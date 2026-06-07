# F0017 — Broker/MGA Hierarchy, Producer Ownership & Territory Management — Getting Started

## Prerequisites

- [ ] Read the current release framing in [ROADMAP.md](../ROADMAP.md)
- [ ] Review the Phase A/B approved plan package: [PRD.md](./PRD.md), story files, [STATUS.md](./STATUS.md), and [ADR-026](../../architecture/decisions/ADR-026-broker-mga-hierarchy-producer-ownership-and-territory.md)
- [ ] Review the F0017 API and schema contracts in [nebula-api.yaml](../../api/nebula-api.yaml) and [schemas](../../schemas/README.md)
- [ ] Confirm `scripts/kg/lookup.py F0017` resolves the F0017 feature, stories, endpoints, schemas, and ADR before creating the feature assembly plan

## How to Verify

1. Confirm the feature addresses hierarchy, ownership, and territory together as one distribution model.
2. Confirm hierarchy-aware access enforcement and distribution rollups remain deferred to F0037; F0017 only persists the structural/effective-dated model and emits audit events.
3. Validate story, tracker, API contract, and KG checks before starting implementation.
