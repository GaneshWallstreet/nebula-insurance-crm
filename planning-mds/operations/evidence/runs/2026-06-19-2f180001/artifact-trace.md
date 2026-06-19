# Artifact Trace - F0023 run 2026-06-19-2f180001

Captures artifacts read, written, generated, referenced externally, and explicitly omitted or waived.

## Artifacts Read

- `agents/ROUTER.md` - attempted at workspace root, missing; resolved under sibling repo `nebula-agents`
- `nebula-agents/agents/ROUTER.md` - read
- `nebula-agents/agents/agent-map.yaml` - read
- `nebula-agents/agents/docs/AGENT-USE.md` - read
- `nebula-agents/agents/actions/plan.md` - read
- `planning-mds/features/REGISTRY.md` - read; confirmed `F0023` planned folder
- `planning-mds/features/ROADMAP.md` - read; confirmed `F0023` is in `Now`
- `planning-mds/features/F0023-global-search-saved-views-and-operational-reporting/` - listed; confirmed existing `PRD.md` and `STATUS.md`
- `planning-mds/BLUEPRINT.md` - read and updated with F0023 story links and screen list entries
- `planning-mds/knowledge-graph/solution-ontology.yaml` - read
- `planning-mds/knowledge-graph/canonical-nodes.yaml` - read targeted F0023-relevant canonical slices
- `planning-mds/knowledge-graph/feature-mappings.yaml` - read and updated; removed F0023 excluded placeholder and added Phase A feature/story stubs
- `planning-mds/knowledge-graph/code-index.yaml` - read targeted search policy binding snippets
- `planning-mds/knowledge-graph/coverage-report.yaml` - read targeted coverage slices and regenerated after mapping changes
- `planning-mds/features/F0023-global-search-saved-views-and-operational-reporting/PRD.md` - read and updated
- `planning-mds/features/F0023-global-search-saved-views-and-operational-reporting/README.md` - read and updated
- `planning-mds/features/F0023-global-search-saved-views-and-operational-reporting/STATUS.md` - read and updated
- `planning-mds/features/F0023-global-search-saved-views-and-operational-reporting/GETTING-STARTED.md` - read and updated
- `planning-mds/features/F0023-global-search-saved-views-and-operational-reporting/acceptance-criteria-checklist.md` - created
- `planning-mds/features/F0023-global-search-saved-views-and-operational-reporting/persona-distribution-operations-manager.md` - created
- `planning-mds/features/F0023-global-search-saved-views-and-operational-reporting/persona-relationship-manager.md` - created
- `planning-mds/features/F0023-global-search-saved-views-and-operational-reporting/persona-underwriter.md` - created
- `planning-mds/features/F0023-global-search-saved-views-and-operational-reporting/F0023-S0001-global-search-results.md` - created
- `planning-mds/features/F0023-global-search-saved-views-and-operational-reporting/F0023-S0002-filter-and-open-search-results.md` - created
- `planning-mds/features/F0023-global-search-saved-views-and-operational-reporting/F0023-S0003-personal-saved-views.md` - created
- `planning-mds/features/F0023-global-search-saved-views-and-operational-reporting/F0023-S0004-team-saved-views.md` - created
- `planning-mds/features/F0023-global-search-saved-views-and-operational-reporting/F0023-S0005-daily-operational-workload-report.md` - created
- `planning-mds/features/F0023-global-search-saved-views-and-operational-reporting/F0023-S0006-workflow-aging-and-backlog-report.md` - created
- `planning-mds/features/F0023-global-search-saved-views-and-operational-reporting/F0023-S0007-permission-safe-search-and-reporting.md` - created
- `planning-mds/features/STORY-INDEX.md` - regenerated
- `nebula-agents/agents/architect/SKILL.md` - read for Phase B role ownership and required outputs
- `nebula-agents/agents/architect/references/api-design-guide.md` - read on demand for API contract work
- `nebula-agents/agents/architect/references/service-architecture-patterns.md` - read on demand for service boundary work
- `planning-mds/architecture/SOLUTION-PATTERNS.md` - read on demand for architecture patterns
- `planning-mds/architecture/api-guidelines-profile.md` - read on demand for API style
- `planning-mds/architecture/api-design-guide.md` - read on demand for API style
- `planning-mds/architecture/data-modeling-guide.md` - read on demand for data modeling
- `planning-mds/architecture/authorization-patterns.md` - read on demand for authorization design
- `planning-mds/architecture/json-schema-validation-architecture.md` - read on demand for schema validation design
- `planning-mds/architecture/performance-design-guide.md` - read on demand for NFRs
- `planning-mds/api/nebula-api.yaml` - read and updated for F0023 API contract
- `planning-mds/security/authorization-matrix.md` - read and updated for F0023 authorization
- `planning-mds/security/policies/policy.csv` - read and updated for F0023 policy rows
- `planning-mds/architecture/decisions/ADR-014-search-index-and-saved-view-architecture.md` - read and replaced with accepted F0023 ADR
- `planning-mds/architecture/data-model.md` - read and updated with F0023 entities
- `planning-mds/architecture/feature-assembly-plan.md` - read and updated with F0023 pointer
- `planning-mds/architecture/error-codes.md` - read and updated with F0023 API error codes
- `planning-mds/knowledge-graph/code-index.yaml` - read and updated with F0023 node bindings
- `planning-mds/knowledge-graph/canonical-nodes.yaml` - read and updated by Architect for F0023 canonical nodes

## Artifacts Created Or Updated

- `planning-mds/operations/evidence/runs/2026-06-19-2f180001/README.md` - created
- `planning-mds/operations/evidence/runs/2026-06-19-2f180001/action-context.md` - created
- `planning-mds/operations/evidence/runs/2026-06-19-2f180001/artifact-trace.md` - created
- `planning-mds/operations/evidence/runs/2026-06-19-2f180001/gate-decisions.md` - created
- `planning-mds/operations/evidence/runs/2026-06-19-2f180001/commands.log` - created
- `planning-mds/operations/evidence/runs/2026-06-19-2f180001/lifecycle-gates.log` - created
- `planning-mds/features/F0023-global-search-saved-views-and-operational-reporting/feature-assembly-plan.md` - created
- `planning-mds/schemas/global-search-result.schema.json` - created
- `planning-mds/schemas/global-search-response.schema.json` - created
- `planning-mds/schemas/saved-view.schema.json` - created
- `planning-mds/schemas/saved-view-upsert-request.schema.json` - created
- `planning-mds/schemas/operational-workload-report.schema.json` - created
- `planning-mds/schemas/workflow-aging-report.schema.json` - created
- `planning-mds/api/nebula-api.yaml` - updated with F0023 Search, SavedViews, and OperationalReports endpoints and schemas
- `planning-mds/architecture/decisions/ADR-014-search-index-and-saved-view-architecture.md` - updated
- `planning-mds/architecture/data-model.md` - updated
- `planning-mds/architecture/feature-assembly-plan.md` - updated with F0023 feature-local plan pointer
- `planning-mds/architecture/error-codes.md` - updated
- `planning-mds/security/authorization-matrix.md` - updated
- `planning-mds/security/policies/policy.csv` - updated
- `planning-mds/BLUEPRINT.md` - updated with F0023 architecture summary, API, security, and observability sections
- `planning-mds/knowledge-graph/canonical-nodes.yaml` - updated by Architect
- `planning-mds/knowledge-graph/code-index.yaml` - updated
- `planning-mds/knowledge-graph/feature-mappings.yaml` - updated with F0023 Phase B bindings

## Generated Evidence

- `planning-mds/features/STORY-INDEX.md` regenerated by `generate-story-index.py`
- `planning-mds/knowledge-graph/coverage-report.yaml` refreshed by `validate.py --write-coverage-report`
- `planning-mds/knowledge-graph/coverage-report.yaml` refreshed again after Phase B ontology edits
- Closeout validators reran successfully: `validate-stories.py`, `generate-story-index.py`, `validate-trackers.py --feature F0023 --skip-feature-evidence`, `validate.py --write-coverage-report`, `validate.py`, `validate.py --check-drift`, and `validate_templates.py`

## External Or Global Evidence References

None.

## Run Environment

- Shell commands were executed from three absolute roots: workspace root `/home/gajap/uSandbox/repos/nebula`, product root `/home/gajap/uSandbox/repos/nebula/nebula-insurance-crm`, and agent root `/home/gajap/uSandbox/repos/nebula/nebula-agents`.
- The command audit uses absolute `cwd` values because this plan action spans sibling repositories, while the base run folder is under the product repository.

## Omissions And Waivers

- No feature evidence package is created during plan by contract.
- `validate-feature-evidence.py` was not called directly. `validate-trackers.py` was rerun with `--skip-feature-evidence` because the default validator path invokes feature-evidence validation, which the plan contract forbids before a feature evidence package exists.
