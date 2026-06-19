# Action Context

## Run Identity

- Action: `plan`
- Feature: `F0023`
- Phase: `A+B`
- Feature mode: `existing`
- Run: `2026-06-19-2f180001`
- Product root: `/home/gajap/uSandbox/repos/nebula/nebula-insurance-crm`
- Agents root: `/home/gajap/uSandbox/repos/nebula/nebula-agents`
- Plan run folder: `planning-mds/operations/evidence/runs/2026-06-19-2f180001`

## Inputs

- `FEATURE_ID=F0023`
- `PHASE=A+B`
- `FEATURE_MODE=existing`
- `PRODUCT_ROOT=/home/gajap/uSandbox/repos/nebula/nebula-insurance-crm`
- `AGENTS_ROOT=/home/gajap/uSandbox/repos/nebula/nebula-agents`

## Auto-Resolved Values

- `FEATURE_SLUG=global-search-saved-views-and-operational-reporting`
- `FEATURE_PATH=/home/gajap/uSandbox/repos/nebula/nebula-insurance-crm/planning-mds/features/F0023-global-search-saved-views-and-operational-reporting`
- `FEATURE_INDEX_ROOT=/home/gajap/uSandbox/repos/nebula/nebula-insurance-crm/planning-mds/operations/evidence/features/F0023-global-search-saved-views-and-operational-reporting`
- `PLAN_RUN_ID=2026-06-19-2f180001`
- `PLAN_RUN_FOLDER=/home/gajap/uSandbox/repos/nebula/nebula-insurance-crm/planning-mds/operations/evidence/runs/2026-06-19-2f180001`

## Assumptions

- The product root is the documented default sibling product repo `nebula-insurance-crm`.
- Agent instructions and scripts resolve from the sibling agent repo `nebula-agents`.
- The registry reserves `F0023` as `Global Search, Saved Views & Operational Reporting`, and the feature folder exists with `PRD.md` and `STATUS.md`, so `FEATURE_MODE=existing` is honored.
- The plan run is a base run evidence package only; no feature evidence package is created during plan.

## Scope Boundaries

- Phase A artifacts are owned by product-manager.
- Phase B artifacts are owned by architect.
- Implementation agents do not run in this plan action.
- Feature evidence package creation is out of scope for this run.

## Lifecycle Stage

Plan - complete
