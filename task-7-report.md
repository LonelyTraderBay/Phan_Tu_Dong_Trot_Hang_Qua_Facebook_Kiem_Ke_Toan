# Task 7 Report - C6 AI inbound + Meta send gates
- Added `ai/process_inbound` Inngest job after successful Meta inbound persistence.
- AI job loads message/conversation, gates `kill_ai_all`, `bot_paused`, captures `bot_epoch`.
- Calls AI `process-message`, writes `ai_runs`, then gates epoch/pause/`kill_ai_outbound`.
- Enqueues `meta.send` with reply text when present, including escalate handoff text.
- Added `meta/send` job to recheck epoch/pause, decrypt page token, and Graph-send message.
- Wired jobs index and explicit outbox maps for `ai.process_inbound` and `meta.send`.
- Tests: kill switch drop, epoch mismatch drop, persist enqueue, outbox maps.
- Verification: `pnpm --dir apps/api typecheck`; `pnpm --dir apps/api test`.
