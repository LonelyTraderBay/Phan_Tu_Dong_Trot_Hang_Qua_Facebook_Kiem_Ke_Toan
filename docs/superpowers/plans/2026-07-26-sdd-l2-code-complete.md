# SDD Execution — Wave L2 (code-complete local)

**Date:** 2026-07-26  
**Parent:** [path-to-100-percent](./2026-07-25-path-to-100-percent.md) · [completion-step-by-step](./2026-07-25-completion-step-by-step.md) · [remaining-priority](./2026-07-25-remaining-completion-priority.md) · [L1 plan](./2026-07-26-sdd-l1-local-first.md)  
**Branch:** `cursor/l2-code-complete` (from `main` @ `5fea338` after PR #26)  
**Worktree:** `.worktrees/l2-code`  
**Method:** Subagent-Driven — one task per subagent, review between tasks.

## Owner policy / SoT note (code-first)

Owner wants **code-complete / local perfection** on PC first. Commercial / Render / Meta deep deploy is **deferred**.

- **NOW = Wave L2** — finish & harden eng code locally (invites loop, Inngest in `dev:local`, advisor aggregates, CI/tooling).
- **CPC claim deferred** — do **not** claim CPC / E100 / tổng 100% in this wave.
- Render payment / Starter and live Meta App Review stay under “khi claim CPC only”.

## Global Constraints

- Local Docker / `dev:local` is the default coding + SDD surface.
- No Render payment required this wave.
- Meta walkthrough / live webhook rows may stay **BLOCKED** locally.
- Do **not** claim CPC thương mại 100% or E100 100%.
- Prefer `cursor/` branch prefix; no secrets in git (never print secret values).
- Keep diffs minimal and on-task.
- Wave L1 CLOSED remains true; L2 continues the **eng local path only**.

## Already DONE (skip)

- Wave L1: SoT local-first · stack verify · stub embeddings · E0.4 notes · gate (PR #26)
- E0–E5 eng waves; R0.1 migrations; R0.5 Scheduled QA
- Local host playbook `docs/ops/local-host.md`

---

## Task 1: Plan + branch + SoT note (code-first)

**Goal:** Open L2 branch; land this plan; set SoT “tiếp theo ngay” = L2 code-complete local; CPC claim deferred.

### Steps

1. Worktree `.worktrees/l2-code` on `cursor/l2-code-complete` from `origin/main`.
2. Write this plan; update path-to-100 / completion-step-by-step / remaining-priority briefly.
3. Append Wave L2 progress ledger section.
4. Commit: `docs(plan): SDD L2 code-complete local — commercial deferred`.

### Done when

- Plan + SoT + ledger on branch; no secrets; no CPC 100% claim.

**Status:** DONE in this task.

---

## Task 2: Invite complete loop (list + accept) — P0

**Goal:** End-to-end local multi-user invites: create (raw token once) → list pending → accept → membership.

### Steps

1. `GET /v1/orgs/:orgId/invites` — list pending for org admins (`members.invite`).
2. `POST /v1/invites/accept` — token → membership; invalidate invite; JWT required, OrgGuard skipped.
3. On create: return one-time raw `token` in response; store hash only.
4. Wire web invites page: list from API; accept flow posts token; show token once after create (Mailpit/local).
5. OpenAPI stubs for new/updated routes.
6. Unit/integration tests for list + accept.
7. Commit: `feat(identity): invite list + accept loop (SDD L2)`.

### Done when

- Local invite loop works without email provider; tests green; no secrets committed.

**Status:** DONE — `2026-07-26` invite list + accept + raw token once; web wired; unit tests green.

---

## Task 3: Bundle Inngest into `dev:local` + knowledge_chunks smoke

**Goal:** One command local stack includes Inngest; smoke stub → `knowledge_chunks` > 0 documented/proven.

### Steps

1. Ensure `dev:local` (or documented companion) starts Inngest alongside api/web/ai.
2. Smoke with stub embeddings path (no Gemini required).
3. Update `local-host.md` if needed.
4. Commit when green.

### Done when

- Local smoke path clear; stub OK; no live-LLM quality claim.

**Status:** PENDING

---

## Task 4: Advisor real aggregates + Zalo runbook drift

**Goal:** Replace hardcoded stub notes in advisor aggregates with real local data; refresh Zalo runbook if drifted.

### Steps

1. Find advisor stub aggregates; wire real queries/counts where local data exists.
2. Refresh Zalo ops runbook for current local behavior.
3. Commit when honest (no commercial claim).

### Done when

- Advisor notes reflect real aggregates locally; runbook current.

**Status:** PENDING

---

## Task 5: Tooling — CI Node 22 + L2 gate

**Goal:** Align CI Node with `engines`; append L2 gate; CPC still deferred.

### Steps

1. Align CI Node 22 with package `engines`.
2. Append Wave L2 gate to evidence ledger.
3. Commit: L2 gate — code-complete local advanced; commercial deferred.

### Done when

- Gate accurate; no CPC/E100 100% claim; Render not “tiếp theo ngay”.

**Status:** PENDING

---

## Self-check (every task)

- [ ] No secrets committed or printed
- [ ] No CPC / E100 / tổng 100% claim
- [ ] Render payment not required for task Done
- [ ] Meta BLOCKED locally is acceptable
- [ ] PowerShell: use `;` not `&&`
