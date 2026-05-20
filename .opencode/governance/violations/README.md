# Governance Violations Registry

Violations detected by `architecture-guardian`, `production-reviewer`, or manual gate evaluation.
Each violation is stored as a YAML file named `{change-id}.yaml`.

## Violation Schema

```yaml
violations:
  - id: "viol-001"
    gate: architecture_guardian
    severity: critical
    file_path: "api/src/application/messaging/send-message.use-case.ts"
    rule: app_no_infra_imports
    description: "Use case imports PrismaService directly instead of using repository port"
    recommendation: "Inject 'MessageRepository' port via @Inject() and use the interface"
    detected_at: "2026-05-20T15:00:00Z"
    detected_by: "architecture-guardian"
    status: open
```

## Status Values

- `open` — Not yet addressed
- `accepted` — Acknowledged, will fix later
- `fixed` — Resolved in subsequent commit
- `wont_fix` — Explicitly ignored with reason

## Active Violations

<!-- Populated automatically by architecture-guardian during apply-plan phase -->
<!-- No active violations at this time -->
