# Plan E — Gate M3 Commercial Ops

> **For agentic workers:** REQUIRED SUB-SKILL when coding: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans. Many tasks are **ops/manual** — record evidence even when no app code changes.

**Goal:** Move critical path off Free-tier cold-start limits so paid pilots are safe.

**Architecture:** Paid Supabase Pro + PITR; always-on hosts; LLM spend caps + secondary provider; monitoring; SaaS billing/entitlements; DPA pack; scheduled isolation/eval on staging.

**Depends on:** Plan D DoD (`main` @ `af8413a`+) — Pilot Phase 1 ready  
**Activate when:** Customer/pilot imminent **or** webhook sleep unacceptable  
**Next:** Plans [F–I index](./2026-07-24-plans-f-i-post-phase1-index.md) → CPC / E100  
**Playbook ưu tiên:** [plan-e-priority-execution](./2026-07-24-plan-e-priority-execution.md)  
**Đường hoàn thiện còn lại:** [path-to-completion-priority](./2026-07-24-path-to-completion-priority.md)

## Global Constraints

- Free-first until customer → then paid critical path  
- Staging ≠ production always  
- Do not claim CPC / E100 / M4  
- Prefer evidence docs + runbooks; code only where entitlements/billing/CI need it

## Thứ tự ưu tiên (E0 → E7, không đảo)

| Ưu tiên | Task | M3 | Việc |
|--------:|------|----|------|
| **E0** | Task 1 | M3.1 | Supabase Pro + PITR + restore drill (1 lần, có log) |
| **E1** | Task 2 | M3.2 | Always-on web+api+ai (Render/Fly paid) |
| **E2** | Task 3 | M3.3 | LLM billing + spend cap + secondary `LlmProvider` |
| **E3** | Task 4 | M3.4 | Uptime monitoring + on-call doc |
| **E4** | Task 5 | M3.5 | Stripe / PayOS / invoice+flags + entitlement enforce |
| **E5** | Task 6 | M3.6 | DPA template + subprocessors list |
| **E6** | Task 7 | M3.7 | Scheduled isolation + eval on staging |
| **E7** | Task 8 | — | `plan-e-dod-evidence.md` |

Chi tiết cổng giai đoạn: [plan-e-priority-execution](./2026-07-24-plan-e-priority-execution.md).

## Tasks (expand to bite-sized when activated)

### Task 1 — E0: Supabase Pro + PITR + restore drill

- [ ] Upgrade production project to Pro; enable PITR  
- [ ] Keep staging project separate  
- [ ] Execute restore drill once; attach log to evidence  
- [ ] Commit: `docs(ops): supabase pro pitr restore drill evidence` (and infra notes)

### Task 2 — E1: Always-on web + api + ai

- [ ] Paid always-on (or equivalent) for `apps/web`, `apps/api`, `apps/ai`  
- [ ] Verify webhook path has no sleep miss  
- [ ] Update deploy ADRs/README  
- [ ] Commit: `docs(ops): always-on hosts for critical path`

### Task 3 — E2: LLM billing + spend cap + secondary provider

- [ ] Paid Gemini/OpenAI keys; env spend cap  
- [ ] Enforce cap before LLM (extend Plan C quota path)  
- [ ] Secondary `LlmProvider` config + failover doc  
- [ ] Commit: `feat: llm spend cap and secondary provider config`

### Task 4 — E3: Uptime + on-call

- [ ] UptimeRobot / Better Stack monitors for web/api/ai (+ webhook health)  
- [ ] `docs/runbooks/on-call.md` rotation tối thiểu  
- [ ] Commit: `docs(ops): uptime monitors and on-call`

### Task 5 — E4: Billing SaaS + entitlements

- [ ] Choose Stripe **or** PayOS **or** invoice + plan flags  
- [ ] Enforce entitlements on AI tokens / seats / features end-to-end  
- [ ] Commit: `feat: billing entitlements enforcement` (or docs if invoice-only)

### Task 6 — E5: DPA + subprocessors

- [ ] DPA template usable for pilot signature  
- [ ] Internal subprocessors list  
- [ ] Commit: `docs(legal): dpa template and subprocessors`

### Task 7 — E6: Scheduled isolation + eval

- [ ] Cron/CI on staging: `test:isolation` + `test:eval` định kỳ  
- [ ] Commit: `ci: schedule isolation and eval on staging`

### Task 8 — E7: Plan E DoD evidence

- [ ] `docs/superpowers/plans/plan-e-dod-evidence.md`  
- [ ] Update priority roadmap Plan E DONE  
- [ ] Commit: `docs: record plan E DoD — m3 commercial ops`

## Plan E Definition of Done

- [ ] Restore drill executed once  
- [ ] Cold start eliminated on webhook path  
- [ ] Spend cap proven  
- [ ] Billing/entitlements enforce  
- [ ] Uptime + on-call doc  
- [ ] DPA + subprocessors  
- [ ] Isolation+eval scheduled on staging  
- [ ] `plan-e-dod-evidence.md`  

## Out of scope

- Phase 2 carriers / COD / returns (Plan F)  
- Ads / advisor (Plan G)  
- ERP-lite (Plan H)  
- SSO / SOC2 / pen-test (Plan I)

## Execution handoff

1. Đọc [plan-e-priority-execution](./2026-07-24-plan-e-priority-execution.md).  
2. Chỉ activate khi có khách / sleep không chấp nhận.  
3. Subagent-Driven cho phần code; ops thủ công có evidence.  
4. Sau DoD E → viết full Plan F JIT rồi execute.
