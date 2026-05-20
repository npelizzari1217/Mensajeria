# Recovery Registry

This directory stores recovery snapshots when a pipeline is recovered
from compaction, crash, or interruption.

Format: `recovery_{timestamp}.json`

Recovery protocol:
1. Scan state/{change-id}/dag.json for in_progress/failed phases
2. mem_search("sdd/{change-id}/{phase}") for Engram context
3. Reconstruct context and offer resume
4. Log recovery event here

No recoveries were needed for this change (pipeline completed without interruption).
