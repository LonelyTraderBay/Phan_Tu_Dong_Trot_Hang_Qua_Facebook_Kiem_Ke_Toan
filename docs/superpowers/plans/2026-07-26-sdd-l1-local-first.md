# SDD Execution — Wave L1 (local-first eng path)

**Date:** 2026-07-26  
**Parent:** [path-to-100-percent](./2026-07-25-path-to-100-percent.md) · [completion-step-by-step](./2026-07-25-completion-step-by-step.md) · [remaining-priority](./2026-07-25-remaining-completion-priority.md)  
**Branch:** `cursor/l1-local-first` (from `main` @ `51f5370` after PR #25)  
**Worktree:** `.worktrees/l1-local`  
**Method:** Subagent-Driven — one task per subagent, review between tasks.

## Owner policy (IMPORTANT)

Owner wants **local-first** development on their PC. **Render billing / Starter is NOT** “tiếp theo ngay”.

- **NOW = Pha Local** — Docker Supabase + `pnpm run dev:local`; close eng leftovers (E0.2, E0.4 local defaults, non-Meta walkthrough).
- **Render + Meta staging** appear **only when claiming CPC thương mại** (Gate R0 live) — deferred after local eng completion.
- Do **not** claim CPC / E100 / tổng 100% in this wave.

## Global Constraints

- Local Docker / `dev:local` is the default coding + SDD surface.
- No Render payment required this wave.
- No claim CPC thương mại 100% or E100 100%.
- Meta walkthrough rows may stay **BLOCKED** locally (localhost cannot receive Meta webhooks).
- Prefer `cursor/` branch prefix; no secrets in git (never print secret values).
- Keep diffs minimal and on-task.
- Wave E5 CLOSED/STOP remains true for CPC/E100 without owner R0.2+R0.4 — L1 advances **eng local path only**, not Gate R0.

## Already DONE (skip)

- E0 warehouse fix + R0 prep packs (#20)
- E1 resume / advisor / Zalo (#22 via E2)
- E2 http_sandbox + billing entitlement proof (#22)
- E3–E5 R0.2/R0.4 probes **BLOCKED**; I7 SBOM enforce; I8 dry-run AMBER; I5 notify eng GREEN/AMBER (#23–#25)
- R0.1 migrations CI + staging baseline; R0.5 Scheduled QA
- Local host playbook `docs/ops/local-host.md`
- E0.2 partial: Inngest path verified; `knowledge_chunks` still 0 without `GEMINI_API_KEY`

---

## Task 1: SoT local-first reorder + this plan

**Goal:** Reorder SoT so Pha Local is NOW; Render/Meta under “khi claim CPC only”; open branch + draft PR.

### Steps

1. Create worktree `.worktrees/l1-local` on `cursor/l1-local-first` from `origin/main`.
2. Commit this plan + SoT updates + Wave L1 ledger.
3. Push branch; open **draft** PR → `main`.

### Done when

- Plan + SoT local-first + ledger on branch; draft PR URL available.
- No secrets; parent `main` working tree not double-committed.

**Status:** DONE in this task.

---

## Task 2: Verify local stack + refresh walkthrough (non-Meta)

**Goal:** Prove local eng surface is healthy; refresh §12.1 walkthrough evidence for non-Meta criteria.

### Steps

1. Start / confirm Docker Supabase + `pnpm run dev:local` (api/web/ai).
2. Health-check: API `:3001/health`, AI `:8000/health`, Supabase `:54321`.
3. Refresh `docs/ops/p0-staging-walkthrough-12-1.md` (or linked local evidence) for non-Meta rows only.
4. Meta rows may remain **BLOCKED** — document why (no public webhook).
5. Commit: `docs(ops): L1 local stack verify + non-Meta walkthrough refresh`.

### Done when

- Health PASS recorded; non-Meta walkthrough evidence refreshed; Meta BLOCKED OK.

**Status:** DONE — `2026-07-26` local health 3/3 + Supabase auth PASS; Meta BLOCKED OK; docs refresh this commit.

---

## Task 3: E0.2 — GEMINI chunks or local stub embeddings

**Goal:** Unblock local `knowledge_chunks` without forcing paid Gemini for local-only work.

### Steps

1. If `GEMINI_API_KEY` present: verify create product + Inngest → `knowledge_chunks` count **> 0**.
2. Else: add **local stub embeddings** path when `GEMINI_API_KEY` empty so local `knowledge_chunks` can get **deterministic stub vectors**.
   - Clearly mark **non-production** (env flag / log / docs).
   - Do **not** claim live LLM quality.
3. Tests covering stub path (and real path skip/guard when key absent).
4. Update `docs/ops/local-host.md` E0.2 section honestly.
5. Commit: `feat(ai): local stub embeddings when GEMINI_API_KEY empty (L1)`.

### Done when

- Local path yields `knowledge_chunks` > 0 (stub or real); tests green; no live-LLM quality claim.

**Status:** DONE — `2026-07-26` stub path landed (`GEMINI_API_KEY` len=0); pytest stub suite green; prod refuse guard; smoke steps in local-host.md (no CPC/Gemini quality claim).

---

## Task 4: E0.4 — local-phase stub defaults in cpc-checklist

**Goal:** Document local-phase default for R2.4 / R2.5 / R2.6 without claiming CPC.

### Steps

1. In [cpc-checklist.md](./cpc-checklist.md) notes: local-phase default may stay `undecided` **or** recommend `AMBER_OK` for **local-only** development.
2. State clearly: owner **must decide** (`REQUIRED` / `AMBER_OK`) **before CPC claim**.
3. Do not invent owner signature/date as CPC-ready.
4. Commit: `docs(plan): E0.4 local-phase stub notes (L1)`.

### Done when

- Checklist notes updated; CPC claim still blocked on undecided/AMBER until owner decides for commercial.

**Status:** DONE — `2026-07-26` local-phase notes in `cpc-checklist.md`; R2.4–R2.6 remain `undecided` (no forged owner signature); **must** `REQUIRED`/`AMBER_OK` before CPC claim.

---

## Task 5: L1 gate — eng local advanced; CPC deferred

**Goal:** Honest gate; Render listed under “khi claim CPC only”.

### Steps

1. Append Wave L1 gate to evidence / progress ledger.
2. Confirm SoT “tiếp theo ngay” remains local-first; Render/Meta under CPC-claim phase only.
3. State: eng local path advanced; **CPC still deferred**; no 100% claim.
4. Commit: `docs(ops): L1 SDD gate — local eng advanced; CPC deferred`.
5. Controller may continue later waves on local path or stop until owner starts CPC claim.

### Done when

- Gate accurate; CPC/E100 not claimed; Render not “tiếp theo ngay”.

---

## Self-check (every task)

- [ ] No secrets committed or printed
- [ ] No CPC / E100 / tổng 100% claim
- [ ] Render payment not required for task Done
- [ ] Meta BLOCKED locally is acceptable
- [ ] PowerShell: use `;` not `&&`
