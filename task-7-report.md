# Task 7 Report - C6 AI inbound + Meta send gates
- Added `ai/process_inbound` Inngest job after successful Meta inbound persistence.
- AI job loads message/conversation, gates `kill_ai_all`, `bot_paused`, captures `bot_epoch`.
- Calls AI `process-message`, writes `ai_runs`, then gates epoch/pause/`kill_ai_outbound`.
- Enqueues `meta.send` with reply text when present, including escalate handoff text.
- Added `meta/send` job to recheck epoch/pause, decrypt page token, and Graph-send message.
- Wired jobs index and explicit outbox maps for `ai.process_inbound` and `meta.send`.
- Tests: kill switch drop, epoch mismatch drop, persist enqueue, outbox maps.
- Verification: `pnpm --dir apps/api typecheck`; `pnpm --dir apps/api test`.

## Critical/Important follow-up
- Added `meta_outbound_sends` reservations keyed by inbound message so `meta/send` retries do not double-send Graph messages.
- `meta/send` now marks 24h-window failures, rechecks epoch/pause plus `kill_ai_all`/`kill_ai_outbound` immediately before Graph, and records sent/failed status.
- Inbound persistence now ensures `ai.process_inbound` outbox exists for both new and duplicate provider messages, repairing enqueue-after-insert failures on retry.
- Added unique AI inbound outbox index per message and tests for send idempotency, kill recheck, 24h drop, and duplicate inbound enqueue repair.
- Verification: `pnpm --dir apps/api test meta-send.spec.ts meta-persist-inbound.spec.ts`; `pnpm --dir apps/api typecheck`; `pnpm --dir apps/api test`.
