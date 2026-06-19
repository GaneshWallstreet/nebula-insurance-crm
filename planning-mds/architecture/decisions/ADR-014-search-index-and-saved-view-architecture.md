# ADR-014: Search Index, Saved Views, and Operational Reporting Projections

**Status:** Accepted
**Date:** 2026-06-19
**Owners:** Architect
**Related Features:** F0008, F0023, F0032, F0037

## Context

F0023 introduces cross-object CRM search, personal/team saved views, and operational reports over broker, MGA/program, account, policy, submission, renewal, and task workloads. Directly querying every transactional aggregate for every search/report request would duplicate filters, make permission-safe counts brittle, and couple the UI to source-specific query shapes.

Saved views are reusable criteria, not materialized record lists and not an authorization grant. Operational reports must compute counts after the same authorization filters that govern source-record reads; hidden records must be indistinguishable from non-matches in result states, facets, suggestions, counts, and report drilldowns.

The solution remains a modular monolith on PostgreSQL. No external search engine is introduced for the F0023 MVP slice.

## Decision

Introduce a read-side F0023 module with three persisted records:

| Record | Purpose | Ownership |
|--------|---------|-----------|
| `SearchDocument` | One permission-filterable search row per source record, with title, subtitle, status, owner, LOB, region, source link, and search vector. | Search/reporting module, derived from source modules |
| `SavedView` | Structured criteria JSON for `Search`, `WorkloadReport`, or `WorkflowAgingReport`, scoped to `Personal` or `Team`. | Search/reporting module |
| `OperationalReportProjection` | One report fact row per source workload item, carrying workflow status, owner, due dates, SLA band, source dimensions, and source link. | Search/reporting module, derived from workflow/source modules |

Saved-view mutations append immutable `SavedViewAuditEvent` rows. These audit rows are separate from broker/account timelines because saved views are administrative criteria artifacts rather than source-record activity.

Search and report reads use a two-stage authorization pipeline:

1. Casbin checks the high-level feature resource/action (`global_search:read`, `operational_report:read`, `saved_view:*`).
2. Query-layer filters apply source-object visibility attributes before rows, snippets, facets, counts, or drilldowns are returned.

Saved-view application always re-runs current authorization. It never stores visible record IDs as authority.

## Search Index Design

`SearchDocument` stores:

- `ObjectType`, `ObjectId`, `TargetUrl`
- `Title`, `Subtitle`, `Status`, `OwnerUserId`, `OwnerDisplayName`
- `AccountId`, `BrokerId`, `PolicyId`, `SubmissionId`, `RenewalId`, `TaskId`
- `LineOfBusiness`, `Region`, `ProgramId`, `TerritoryId`
- `SearchText`, generated `SearchVector`, `MatchedFieldHintsJson`
- `SourceUpdatedAt`, `IndexedAt`, `LastProjectionError`

Indexes:

- Unique `(ObjectType, ObjectId)`
- GIN on `SearchVector`
- B-tree on `(ObjectType, Status)`, `OwnerUserId`, `Region`, `LineOfBusiness`
- Partial index on active/current rows when source records can be archived

F0023 uses PostgreSQL full-text search and deterministic fallback `ILIKE` for short exact identifiers where needed. External engines such as OpenSearch are a future scale option, not the MVP dependency.

## Saved View Design

`SavedView` stores:

- `Name`, normalized name, optional `Description`
- `ViewType`: `Search`, `WorkloadReport`, or `WorkflowAgingReport`
- `Visibility`: `Personal` or `Team`
- `OwnerUserId`
- `TeamScopeType`: `Role`, `Region`, `Program`, or `Territory`
- `TeamScopeKey`
- `CriteriaJson`, `SortJson`
- `IsDefault`, `ArchivedAt`
- audit fields and `RowVersion`

Rules:

- Personal names are unique per `(OwnerUserId, ViewType, NormalizedName)` while active.
- Team names are unique per `(TeamScopeType, TeamScopeKey, ViewType, NormalizedName)` while active.
- One default exists per personal or team scope and view type.
- Team mutations are manager/admin actions. `DistributionManager`, `ProgramManager`, and `Admin` can publish/default only for scopes they administer.
- Criteria validation is structural. Obsolete filters are ignored on apply with a warning payload; invalid create/update payloads fail with `saved_view_criteria_invalid`.

## Operational Report Projection Design

`OperationalReportProjection` is a queryable fact table, not a pre-aggregated dashboard cache. It stores source dimensions so each report request can aggregate after authorization filtering.

Projected facts include:

- `SourceObjectType`, `SourceObjectId`, `TargetUrl`
- `WorkflowType`, `CurrentStatus`, `StatusEnteredAt`, `DaysInStatus`
- `OwnerUserId`, `OwnerDisplayName`
- `DueDate`, `IsDueToday`, `IsOverdue`, `AgeBand`
- `AccountId`, `BrokerId`, `PolicyId`, `LineOfBusiness`, `Region`, `ProgramId`, `TerritoryId`
- `LastSourceUpdatedAt`, `ProjectedAt`

Indexes:

- `(WorkflowType, CurrentStatus, AgeBand)`
- `(OwnerUserId, IsOverdue, DueDate)`
- `(Region, LineOfBusiness)`
- Unique `(SourceObjectType, SourceObjectId)`

Reports exposed by F0023:

- `GET /operational-reports/workload`
- `GET /operational-reports/workflow-aging`

Drilldown rows reuse the `GlobalSearchResult` shape to keep source navigation and permission behavior consistent.

## Projection Freshness

F0023 implementation uses in-process projection services in the modular monolith:

- transactional writes enqueue refresh work for affected source records;
- a backfill command seeds search/report rows for existing records;
- read endpoints expose `indexedAt` / `generatedAt` so stale data is observable;
- failed projection refreshes are retried and surfaced through logs/metrics.

Projection lag budget: p95 under 60 seconds after source-record commit. If the projection row is missing or stale, source detail endpoints remain authoritative.

## API Contract

F0023 adds these OpenAPI surfaces in `planning-mds/api/nebula-api.yaml`:

- `GET /search-results`
- `GET /saved-views`
- `POST /saved-views`
- `GET /saved-views/{savedViewId}`
- `PATCH /saved-views/{savedViewId}`
- `DELETE /saved-views/{savedViewId}`
- `PUT /saved-views/{savedViewId}/default`
- `GET /operational-reports/workload`
- `GET /operational-reports/workflow-aging`

All non-2xx responses use ProblemDetails. Saved-view updates and default changes require `If-Match` and return `precondition_failed` (412) for stale row versions.

## Authorization

New Casbin resources:

- `global_search:read` - internal roles only.
- `saved_view:read` - internal roles only; query layer filters owner/team eligibility.
- `saved_view:manage` - personal owners and manager/admin team-scope administrators.
- `saved_view:default` - personal owners and manager/admin team-scope administrators.
- `operational_report:read` - internal roles only; query layer filters rows and aggregates by source visibility.

`BrokerUser` and `ExternalUser` receive no policy lines for F0023. External broker/MGA global search and operational reporting remain out of scope.

## Consequences

### Positive

- Search and reporting share a consistent, permission-safe read model.
- Saved views become durable operational artifacts without granting access.
- Reports aggregate after authorization filtering, reducing hidden-record leakage risk.
- PostgreSQL-only MVP avoids new infrastructure while preserving a path to external search later.

### Negative

- Projection freshness must be monitored and tested.
- Source writes need projection refresh hooks and backfill coverage.
- Team saved views need careful scope validation to avoid metadata leakage.

## Follow-ups

- F0037 owns hierarchy-aware enforcement and distribution rollups. F0023 may store `TerritoryId` and `ProgramId` facets when available, but does not redefine access-control semantics.
- F0032 may later govern admin-configured shared report definitions and global defaults.
- F0008 broker insights may reuse `SearchDocument` and `OperationalReportProjection` as read substrates.
