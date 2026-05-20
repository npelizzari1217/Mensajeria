# =============================================================================
# SDD State Manager — DAG Engine Contract
# =============================================================================
# This directory stores pipeline state per change.
# Every change gets: .opencode/state/{change-id}/
#
# State survives compaction via filesystem persistence.
# Engram stores a semantic copy for cognitive recall.
#
# Recovery protocol:
#   1. Read dag.json from filesystem (authoritative)
#   2. If missing, mem_search("sdd/{change-id}/state") for Engram copy
#   3. If both missing, pipeline lost — start from last known phase

# =============================================================================
# dag.json Schema
# =============================================================================
#
# {
#   "change_id": "add-dark-mode",
#   "pipeline": {
#     "current_phase": "design",
#     "phases": {
#       "explore":    { "status": "completed",  "completed_at": "ISO", "artifact_obs_id": "obs-xxx" },
#       "propose":    { "status": "completed",  "completed_at": "ISO", "artifact_obs_id": "obs-xxx" },
#       "spec":       { "status": "completed",  "completed_at": "ISO", "artifact_obs_id": "obs-xxx" },
#       "design":     { "status": "in_progress","started_at": "ISO" },
#       "tasks":      { "status": "pending" },
#       "apply-plan": { "status": "pending" },
#       "apply":      { "status": "pending" },
#       "verify":     { "status": "pending" },
#       "prod-review":{ "status": "pending" },
#       "archive":    { "status": "pending" }
#     }
#   },
#   "governance": {
#     "gates_passed": ["spec_approved"],
#     "gates_pending": ["design_approved", "architecture_guardian"],
#     "blockers": [],
#     "approvals": {
#       "spec_approved": { "by": "orchestrator", "at": "ISO" }
#     }
#   },
#   "context": {
#     "artifact_store": "hybrid",
#     "delivery_strategy": "ask-on-risk",
#     "chain_strategy": null,
#     "workload_forecast": {
#       "estimated_lines": 350,
#       "budget_risk": "Medium",
#       "chained_prs_recommended": false
#     }
#   },
#   "recovery": {
#     "checkpoints": ["checkpoints/design_checkpoint.json"],
#     "failures": [],
#     "retries": 0,
#     "last_recovered_at": null
#   },
#   "created_at": "ISO",
#   "updated_at": "ISO",
#   "version": "1.0"
# }

# =============================================================================
# Phase Status Values
# =============================================================================
# pending       — not yet started
# in_progress   — sub-agent launched, awaiting completion
# completed     — phase finished successfully
# failed        — phase errored out
# blocked       — blocked by governance gate
# skipped       — intentionally skipped (e.g., no spec change needed)

# =============================================================================
# Checkpoint Format (saved per phase)
# =============================================================================
# Saved at: .opencode/state/{change-id}/checkpoints/{phase}_checkpoint.json
#
# {
#   "phase": "design",
#   "saved_at": "ISO",
#   "dag_snapshot": { ... full dag.json copy at checkpoint time ... },
#   "context_summary": "Brief summary of what was done in this phase",
#   "observations_created": ["obs-xxx", "obs-yyy"],
#   "files_written": [".opencode/artifacts/add-dark-mode/design.md"]
# }

# =============================================================================
# Recovery Protocol (orchestrator executes on session start)
# =============================================================================
#
# 1. SCAN: find all .opencode/state/*/dag.json with in_progress or failed phases
# 2. LOAD: read each dag.json into orchestrator memory
# 3. PRIORITIZE: pick the most recently updated change
# 4. RECOVER: if current_phase is in_progress, check if sub-agent completed
#    - mem_search("sdd/{change-id}/{phase}") to check if artifact exists
#    - If exists: mark phase completed, move to next phase
#    - If missing: re-launch the phase (retry)
# 5. REPORT: tell user what was recovered and what's next
