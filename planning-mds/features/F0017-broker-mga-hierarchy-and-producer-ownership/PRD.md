---
template: feature
version: 1.1
applies_to: product-manager
---

# F0017: Broker/MGA Hierarchy, Producer Ownership & Territory Management

**Feature ID:** F0017
**Feature Name:** Broker/MGA Hierarchy, Producer Ownership & Territory Management
**Priority:** High
**Phase:** CRM Release MVP+

## Feature Statement

**As a** distribution leader or relationship manager
**I want** broker hierarchy, producer ownership, and territory visibility
**So that** I can manage channels, accountability, and regional performance accurately

## Business Objective

- **Goal:** Reflect real commercial P&C distribution structure inside Nebula.
- **Metric:** Ownership clarity, territory reporting coverage, and hierarchy-based workflow accuracy.
- **Baseline:** Broker records exist, but advanced hierarchy and producer ownership are limited.
- **Target:** Nebula supports channel-aware structure and assignment rules.

## Problem Statement

- **Current State:** Advanced broker hierarchy and producer ownership are not fully modeled.
- **Desired State:** MGAs, sub-brokers, producers, and territories are represented explicitly.
- **Impact:** Better governance, reporting, and relationship accountability.

## Scope & Boundaries

**In Scope (MVP — confirmed at G1 clarification, 2026-06-06):**
- Broker/MGA hierarchy as an **arbitrary-depth, self-referencing tree** with cycle/orphan prevention and a cached-ancestry read model (S0001)
- Hierarchy navigation and drill-down (S0002)
- **Effective-dated** producer ownership with point-in-time attribution (S0003)
- **Effective-dated** territory definition and assignment with conflicting-overlap prevention (S0004)
- Audit/timeline for all hierarchy, ownership, and territory changes (S0005)

**Out of Scope (deferred):**
- Hierarchy-aware **rollup reporting / production rollups** — deferred to **F0037** (builds on the F0023 reporting substrate)
- Hierarchy-aware **access-control enforcement** (parent/child visibility, territory/producer scoping) — modeled-for here but **enforcement deferred to F0037**
- Commission calculation, splits, and revenue attribution (F0025)
- External producer portal (F0029)
- Carrier-side appointment detail (F0028)
- Nested territories (territory hierarchy)

## Success Criteria

- Users can model and navigate broker hierarchy accurately.
- Ownership and territory logic support downstream workflows and reporting.
- Hierarchy supports operational and analytical use cases without manual workarounds.

## Requirements Clarifications (Resolved 2026-06-06)

Resolved at the `G1 CLARIFICATION` gate of plan run `2026-06-06-5fb353e9`:

1. **MVP boundary:** Deliver hierarchy modeling + producer ownership + territory management. Hierarchy-aware rollup reporting is deferred.
2. **Hierarchy shape:** Arbitrary-depth, self-referencing tree (not fixed tiers) — requires cycle/orphan guards and a cached-ancestry / materialized-path read model.
3. **Effective-dating:** Producer ownership and territory assignments are effective-dated in MVP; point-in-time attribution and history are preserved.
4. **Authorization scope:** Structural/reporting-only. Hierarchy-aware access-control **enforcement is deferred**; F0017 models the data a later authorization change will consume. Security Reviewer remains optional (not forced) for this slice; all structural changes are still audited.

## Risks & Assumptions

- **Risk:** Hierarchy design becomes overly complex before core CRM workflows are stable.
- **Assumption:** Producer ownership is more valuable once account, submission, and reporting foundations exist.
- **Mitigation:** Sequence this feature after CRM Release MVP core workflow delivery.

## Dependencies

- F0002 Broker & MGA Relationship Management
- F0023 Global Search, Saved Views & Operational Reporting

## Architecture & Solution Design

### Solution Components

- Extend the broker domain with hierarchy management services, producer ownership services, and territory assignment components instead of treating hierarchy as display-only metadata.
- Add hierarchy-aware rollup services for production, workflow, and activity reporting across MGA, broker, and producer levels.
- Introduce a territory and ownership policy component that can later be reused by queue routing, reporting, and access-control decisions.
- Keep producer ownership separate from commission calculation so F0017 remains the structural model while F0025 owns the economics.

### Data & Workflow Design

- Model broker hierarchy using a self-referencing relationship, with room for materialized path or cached ancestry data if query depth becomes expensive.
- Represent producer ownership and territory assignment as effective-dated relationships so historical attribution and rollup accuracy are preserved.
- Add hierarchy-aware reporting projections rather than recalculating entire broker trees on each screen load.
- Validate changes to prevent cycles, orphaned children, and overlapping territory rules that would undermine downstream routing and reporting.

### API & Integration Design

- Expose APIs for hierarchy traversal, ownership assignment, territory management, and hierarchy-aware search/report filtering.
- Feed hierarchy and producer context into F0022 routing rules and F0023 reporting without making those modules recalculate structural relationships independently.
- Support drill-down from MGA to broker to producer through consistent identifiers and filter semantics.
- Keep external producer portal and carrier appointment integrations out of the initial boundary.

### Security & Operational Considerations

- Extend authorization checks to account for parent-child broker visibility, territory scoping, and producer-level ownership.
- Audit all hierarchy and ownership changes because they affect access boundaries, reporting rollups, and future commission attribution.
- Monitor rollup recalculation cost and consider asynchronous recomputation if hierarchy updates become expensive.
- Preserve historical ownership snapshots or effective-dated reads so reports remain accurate after organizational changes.

## Architecture Traceability

**Taxonomy Reference:** [Feature Architecture Traceability Taxonomy](../../architecture/feature-architecture-traceability-taxonomy.md)

| Classification | Artifact / Decision | ADR |
|----------------|---------------------|-----|
| Introduces: Feature-Local Component | Broker hierarchy service, producer ownership model, and territory rules | PRD only |
| Extends: Cross-Cutting Component | Territory and ownership data become routing inputs for shared queue execution | [ADR-013](../../architecture/decisions/ADR-013-operational-routing-and-queue-engine.md) (Proposed) |
| Reuses: Established Component/Pattern | Hierarchy-aware rollups across shared search and reporting surfaces | [ADR-014](../../architecture/decisions/ADR-014-search-index-and-saved-view-architecture.md) (Proposed) |

## Screen Layouts (ASCII)

This feature is UI-bearing (hierarchy, ownership, and territory panels on
broker/account/territory detail). Desktop and a narrow variant below.

### Broker/MGA Detail — Hierarchy panel (Desktop)

```
+--------------------------------------------------------------------------+
| Broker/MGA: Acme MGA                                   [ Edit ] [ ⋮ ]     |
| Breadcrumb: (root) ▸ Acme MGA                                            |
+--------------------------------------------------------------------------+
| Hierarchy                                            [ Set / Change Parent ]
|--------------------------------------------------------------------------|
| ▾ Acme MGA (MGA)                                                          |
|    ▾ Northeast Brokers (Broker)                                           |
|       • J. Lee (Producer)            Owner of: 12 accounts               |
|       • R. Patel (Producer)          Owner of:  8 accounts               |
|    ▸ Southeast Brokers (Broker)            [expand]                       |
|  (cycle/self-parent attempts are rejected inline)                        |
+--------------------------------------------------------------------------+
| Ownership | Territories | Timeline                                       |
+--------------------------------------------------------------------------+
```

### Broker/MGA Detail — Hierarchy panel (Narrow)

```
+----------------------------+
| Acme MGA        [Edit][⋮]  |
| (root) ▸ Acme MGA          |
+----------------------------+
| Hierarchy   [Set Parent ▾] |
|----------------------------|
| ▾ Acme MGA (MGA)           |
|   ▾ Northeast Brokers      |
|     • J. Lee (Producer)    |
|     • R. Patel (Producer)  |
|   ▸ Southeast Brokers      |
+----------------------------+
| [Ownership][Terr.][Time]   |
+----------------------------+
```

### Ownership / Territory panels (Desktop, summarized)

```
+--------------------------- Ownership ----------------------------+
| Account: Globex Inc.                       [ Assign / Reassign ] |
| Current owner: J. Lee  (effective 2026-04-01 → open)            |
| History:  M. Diaz  (2025-01-01 → 2026-03-31)                     |
| "As of" [2025-06-01] → owner: M. Diaz                           |
+-----------------------------------------------------------------+
+--------------------------- Territory ----------------------------+
| Territory: Northeast            [ Create ] [ Assign Member ]     |
| Members (active): Northeast Brokers, J. Lee, R. Patel           |
| Overlap conflicts are rejected (409) on assign                  |
+-----------------------------------------------------------------+
```

## Related User Stories

| Story | Title | Cluster |
|-------|-------|---------|
| [F0017-S0001](./F0017-S0001-model-broker-mga-hierarchy.md) | Model broker/MGA hierarchy (self-referencing, arbitrary depth) | Hierarchy |
| [F0017-S0002](./F0017-S0002-navigate-hierarchy.md) | Navigate and traverse the distribution hierarchy | Hierarchy |
| [F0017-S0003](./F0017-S0003-producer-ownership-effective-dated.md) | Assign and maintain producer ownership (effective-dated) | Ownership |
| [F0017-S0004](./F0017-S0004-territory-management-effective-dated.md) | Define and manage territories with effective-dated assignment | Territory |
| [F0017-S0005](./F0017-S0005-hierarchy-ownership-territory-audit.md) | Audit and timeline for hierarchy, ownership, and territory changes | Cross-cutting |
