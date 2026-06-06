# F0017 — Broker/MGA Hierarchy, Producer Ownership & Territory Management — Status

**Overall Status:** Planned — plan complete (Phase A + B approved, G1–G5 PASS, plan run `2026-06-06-5fb353e9`); ready for the feature/build action
**Last Updated:** 2026-06-06

## Story Checklist

| Story | Title | Status |
|-------|-------|--------|
| F0017-S0001 | Model broker/MGA hierarchy (self-referencing, arbitrary depth) | Planned |
| F0017-S0002 | Navigate and traverse the distribution hierarchy | Planned |
| F0017-S0003 | Assign and maintain producer ownership (effective-dated) | Planned |
| F0017-S0004 | Define and manage territories with effective-dated assignment | Planned |
| F0017-S0005 | Audit and timeline for hierarchy, ownership, and territory changes | Planned |

## Required Signoff Roles (Set in Planning)

> Architect finalized in Phase B (ADR-026). Security Reviewer is **not forced** for this slice because hierarchy-aware access-control enforcement is deferred to F0037 (ADR-026 §6); no recursive access or hierarchy-based permissions are introduced here.

| Role | Required | Why Required | Set By | Date |
|------|----------|--------------|--------|------|
| Quality Engineer | Yes | Hierarchy traversal, effective-dated ownership/territory, and overlap/cycle validation require test evidence. | Architect (Phase B, confirmed) | 2026-06-06 |
| Code Reviewer | Yes | Self-referencing model, effective-dating, and audit semantics require independent review. | Architect (Phase B, confirmed) | 2026-06-06 |
| Security Reviewer | No | Access-control enforcement deferred to F0037 (ADR-026 §6); no recursive access or hierarchy-based permissions introduced in this slice. | Architect (Phase B, confirmed) | 2026-06-06 |
| DevOps | No | Standard EF Core migrations + indexes (data-model §9.5); no new deploy topology. Revisit at the feature action if runtime/deploy risk emerges. | Architect (Phase B) | 2026-06-06 |
| Architect | Yes | Self-referencing hierarchy + cached ancestry + effective-dated relationships (ADR-026) warrant G0 assembly-plan validation at build. | Architect (Phase B) | 2026-06-06 |

## Story Signoff Provenance

| Story | Role | Reviewer | Verdict | Evidence | Date | Notes |
|-------|------|----------|---------|----------|------|-------|
| F0017-S0001 | Quality Engineer | - | N/A | - | - | Populate after story breakdown is created. |
| F0017-S0001 | Code Reviewer | - | N/A | - | - | Populate after story breakdown is created. |
