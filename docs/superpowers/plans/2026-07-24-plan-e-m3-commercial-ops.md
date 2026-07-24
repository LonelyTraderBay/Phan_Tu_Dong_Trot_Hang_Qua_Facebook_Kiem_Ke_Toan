# Plan E — Gate M3 Commercial Ops (outline)

> **For agentic workers:** Expand to full bite-sized tasks when Plan D DoD is green **and** a real customer/pilot is imminent. Until then treat as checklist, not coding sprint.

**Goal:** Move critical path off Free-tier cold-start limits so paid pilots are safe.

**Depends on:** Plan D (or parallel final week of D)  
**Unlocks:** Scale pilots; prerequisite before heavy Phase 2 traffic

## Global Constraints

- Free-first until customer → then paid critical path  
- Staging ≠ production always  
- Do not claim E100/M4  

## Tasks (when activated)

### Task 1: Supabase Pro + PITR + restore drill
### Task 2: Render always-on web+api+ai
### Task 3: Gemini/OpenAI billing + spend cap + secondary `LlmProvider`
### Task 4: UptimeRobot/Better Stack + on-call rotation doc
### Task 5: Stripe or PayOS (or invoice+plan flags) + entitlement enforce
### Task 6: DPA template + subprocessors internal list
### Task 7: Scheduled isolation + eval on staging
### Task 8: `plan-e-dod-evidence.md`

## DoD

- [ ] Restore drill executed once  
- [ ] Cold start eliminated on webhook path  
- [ ] Spend cap proven  
- [ ] Pilot contract pack ready  

## After Plan E

→ [Priority roadmap](./2026-07-24-priority-execution-roadmap.md) Plans F → H (Phase 2–4) → CPC; Plan I → E100.
