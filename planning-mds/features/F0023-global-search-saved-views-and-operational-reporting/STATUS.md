# F0023 - Global Search, Saved Views & Operational Reporting - Status

**Overall Status:** Draft - Phase B architecture drafted, pending approval
**Last Updated:** 2026-06-19

## Story Checklist

| Story | Title | Status |
|-------|-------|--------|
| F0023-S0001 | Global search returns grouped CRM results | Planned |
| F0023-S0002 | Filter, sort, and open search results | Planned |
| F0023-S0003 | Personal saved views | Planned |
| F0023-S0004 | Team saved views and defaults | Planned |
| F0023-S0005 | Daily operational workload report | Planned |
| F0023-S0006 | Workflow aging and backlog drilldowns | Planned |
| F0023-S0007 | Permission-safe search and reporting behavior | Planned |

## Required Signoff Roles (Set in Planning)

> Phase B Architect-confirmed matrix. Feature closeout evidence is collected later by `agents/actions/feature.md`.

| Role | Required | Why Required | Set By | Date |
|------|----------|--------------|--------|------|
| Quality Engineer | Yes | Search accuracy, saved-view persistence, projection freshness, and reporting correctness require independent test evidence. | Architect | 2026-06-19 |
| Code Reviewer | Yes | Cross-object query behavior, authorization filtering, saved-view mutations, projections, and report drilldowns require independent review. | Architect | 2026-06-19 |
| Security Reviewer | Yes | Search/reporting crosses visibility boundaries; counts, snippets, suggestions, saved-view metadata, and reports must not leak unauthorized records. | Architect | 2026-06-19 |
| DevOps | Yes | Projection backfill/refresh behavior and runtime lag/failure metrics require deployability and operations evidence. | Architect | 2026-06-19 |
| Architect | Yes | Cross-cutting search/reporting architecture and ontology bindings require G0 assembly-plan validation. | Architect | 2026-06-19 |

## Story Signoff Provenance

| Story | Role | Reviewer | Verdict | Evidence | Date | Notes |
|-------|------|----------|---------|----------|------|-------|
| F0023-S0001 | Quality Engineer | - | N/A | - | - | Populate after story breakdown is created. |
| F0023-S0001 | Code Reviewer | - | N/A | - | - | Populate after story breakdown is created. |
| F0023-S0001 | Security Reviewer | - | N/A | - | - | Pending feature implementation evidence. |
| F0023-S0001 | Architect | - | N/A | - | - | Pending Phase B/feature G0 evidence. |
| F0023-S0002 | Quality Engineer | - | N/A | - | - | Pending feature implementation evidence. |
| F0023-S0002 | Code Reviewer | - | N/A | - | - | Pending feature implementation evidence. |
| F0023-S0002 | Security Reviewer | - | N/A | - | - | Pending feature implementation evidence. |
| F0023-S0002 | Architect | - | N/A | - | - | Pending Phase B/feature G0 evidence. |
| F0023-S0003 | Quality Engineer | - | N/A | - | - | Pending feature implementation evidence. |
| F0023-S0003 | Code Reviewer | - | N/A | - | - | Pending feature implementation evidence. |
| F0023-S0003 | Security Reviewer | - | N/A | - | - | Pending feature implementation evidence. |
| F0023-S0003 | Architect | - | N/A | - | - | Pending Phase B/feature G0 evidence. |
| F0023-S0004 | Quality Engineer | - | N/A | - | - | Pending feature implementation evidence. |
| F0023-S0004 | Code Reviewer | - | N/A | - | - | Pending feature implementation evidence. |
| F0023-S0004 | Security Reviewer | - | N/A | - | - | Pending feature implementation evidence. |
| F0023-S0004 | Architect | - | N/A | - | - | Pending Phase B/feature G0 evidence. |
| F0023-S0005 | Quality Engineer | - | N/A | - | - | Pending feature implementation evidence. |
| F0023-S0005 | Code Reviewer | - | N/A | - | - | Pending feature implementation evidence. |
| F0023-S0005 | Security Reviewer | - | N/A | - | - | Pending feature implementation evidence. |
| F0023-S0005 | Architect | - | N/A | - | - | Pending Phase B/feature G0 evidence. |
| F0023-S0006 | Quality Engineer | - | N/A | - | - | Pending feature implementation evidence. |
| F0023-S0006 | Code Reviewer | - | N/A | - | - | Pending feature implementation evidence. |
| F0023-S0006 | Security Reviewer | - | N/A | - | - | Pending feature implementation evidence. |
| F0023-S0006 | Architect | - | N/A | - | - | Pending Phase B/feature G0 evidence. |
| F0023-S0007 | Quality Engineer | - | N/A | - | - | Pending feature implementation evidence. |
| F0023-S0007 | Code Reviewer | - | N/A | - | - | Pending feature implementation evidence. |
| F0023-S0007 | Security Reviewer | - | N/A | - | - | Pending feature implementation evidence. |
| F0023-S0007 | Architect | - | N/A | - | - | Pending Phase B/feature G0 evidence. |

## Planning Decisions

- F0023 is internal-only for CRM Release MVP.
- Core search/saved-view/reporting substrate can build in parallel with F0017.
- Hierarchy/territory facets depend on F0017 data.
- Hierarchy-aware access-control enforcement and distribution rollups remain deferred to F0037.
- Full document-content search, report scheduling, and free-form report builder are out of scope.
- Phase B selected a PostgreSQL read-side SearchReporting module; no external search engine is added for MVP.
- Saved-view team scope is represented as `teamScopeType` + `teamScopeKey` and validated against the current authorization context.
- Saved-view mutations are audited through `SavedViewAuditEvent`.

## Tracker Sync Checklist

- [x] `planning-mds/features/REGISTRY.md` status/path aligned
- [x] `planning-mds/features/ROADMAP.md` section aligned (`Now/Next/Later/Completed`)
- [x] `planning-mds/features/STORY-INDEX.md` regenerated
- [x] `planning-mds/BLUEPRINT.md` feature/story status links aligned
- [x] `planning-mds/knowledge-graph/feature-mappings.yaml` contains the F0023 Phase B ontology binding

## Deferred Non-Blocking Follow-ups

| Follow-up | Why deferred | Tracking link | Owner |
|-----------|--------------|---------------|-------|
| Hierarchy-aware access enforcement and distribution rollups | Explicitly owned by F0037, not F0023 | `planning-mds/features/F0037-hierarchy-aware-access-scoping-and-distribution-rollups/` | Product Manager / Architect |

## Closeout Summary (Fill at archive time)

| Field | Value |
|-------|-------|
| Implementation completed | TBD |
| Closeout review date | TBD |
| Total stories | 7 |
| Stories completed | 0 / 7 |
| Test count (unit + integration) | TBD |
| Defects found during review | TBD |
| Defects fixed before closeout | TBD |
| Residual risks | TBD |

**Scope delivery:** TBD
