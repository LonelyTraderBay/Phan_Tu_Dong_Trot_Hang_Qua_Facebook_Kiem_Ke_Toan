# SDD Execution — Wave E4 (owner path re-attempt + eng parallel)

**Date:** 2026-07-26  
**Parent:** [path-to-100-percent](./2026-07-25-path-to-100-percent.md) · [completion-step-by-step](./2026-07-25-completion-step-by-step.md) · [E3 plan](./2026-07-25-sdd-e3-r0-owner-path.md)  
**Branch:** `cursor/e4-owner-path` (from `main` @ `0221a4c` after PR #23)  
**Method:** Subagent-Driven — one task per subagent, review between tasks, continue until Gate or owner BLOCKED.

## Global Constraints

- Do **not** invent Meta credentials, Render payment methods, or Supabase Pro billing.
- Do **not** claim CPC thương mại 100% or E100 100% until SoT gates are GREEN.
- Owner/vendor blockers → document **BLOCKED** with exact next action; that is a valid task exit.
- Prefer `cursor/` branch prefix; no secrets in git (never print secret values).
- Keep diffs minimal and on-task.
- E3 must be on `main` before R0 re-probes (baseline `0221a4c`).

## Already DONE (skip)

- E0 warehouse fix + R0 prep packs (#20)
- E1 resume / advisor / Zalo (#22 via E2)
- E2 http_sandbox + billing entitlement proof + E2 gate STOP (#22 merged)
- E3 R0.2/R0.4 attempt **BLOCKED** + SBOM enforce (I7 eng) (#23 merged @ `0221a4c`)
- R0.1 migrations CI + staging baseline; R0.5 Scheduled QA
- R0.2 always-on unblock pack in `docs/ops/deploy-staging-render.md`
- R0.4 Meta App Review prep pack in `docs/ops/p0-meta-app-review-submit.md`
- I8 access review runbook at `docs/runbooks/platform-admin-access-review.md` (evidence still AMBER)

---

## Task 1: Land completion-step-by-step + link SoT

**Goal:** Commit the owner/eng step-by-step checklist and wire it into path-to-100 / remaining-priority SoT; open E4 branch with this plan + progress ledger.

### Steps

1. Confirm worktree `.worktrees/e4-sdd` on `cursor/e4-owner-path` from `origin/main` @ `0221a4c`.
2. Land `docs/superpowers/plans/2026-07-25-completion-step-by-step.md` (Bước 1→26 + owner TODO).
3. Ensure SoT links from [path-to-100-percent](./2026-07-25-path-to-100-percent.md) and [remaining-completion-priority](./2026-07-25-remaining-completion-priority.md) point at the step-by-step checklist.
4. Commit this plan + `.superpowers/sdd/progress.md`.
5. Push branch; open **draft** PR → `main` (title mentions E4).

### Done when

- Step-by-step + SoT links + E4 plan + ledger are on `cursor/e4-owner-path`; draft PR URL available.
- No secrets in commit; parent `main` working tree not double-committed.

---

## Task 2: Re-attempt R0.2 — Render Starter ×3

**Goal:** Upgrade staging to always-on Starter **or** exit BLOCKED with exact owner clicks.

### Steps

1. Probe whether `RENDER_API_KEY` exists in env / `.local-secrets/` / GitHub secrets **without printing values** (presence only: set / unset).
2. If key present: attempt plan upgrade for `omni-api-staging`, `omni-ai-staging`, `omni-web-staging` (Free → Starter) via Render API/CLI if supported; record plan proof (Starter) — never invent payment.
3. If payment missing or API cannot bill: **BLOCKED** — copy exact owner steps from [deploy-staging-render.md § Upgrade to always-on](../../ops/deploy-staging-render.md) and [completion-step-by-step Bước 1–2](./2026-07-25-completion-step-by-step.md):
   - Billing → Add payment method
   - Each service Settings → Instance Type → Starter → Save (three service IDs in that doc)
   - Optional: `render.yaml` `plan: free` → `starter`
   - Verify no cold-start after idle; keep-warm alone ≠ GREEN
4. Update `docs/ops/r0-r3-execution-evidence.md` R0.2 row: **PASS/GREEN only with Starter proof**; else BLOCKED/AMBER with owner clicks.
5. Commit: `docs(ops): R0.2 Starter re-attempt result (SDD E4)`.

### Done when

- R0.2 GREEN with always-on / Starter proof **or** BLOCKED with dashboard click list (no fake GREEN).

---

## Task 3: Re-attempt R0.4 — Meta App Review

**Goal:** Submit App Review **or** BLOCKED with remaining owner actions.

### Steps

1. Probe `META_APP_ID` / `META_APP_SECRET` / `META_VERIFY_TOKEN` / `META_REDIRECT_URI` presence only (placeholders in `.env.example` are known — do not invent real values; never print secrets).
2. If credentials look real **and** staging warm: verify legal URLs (`/legal/privacy`, `/legal/terms`) return public 200; update prep pack status.
3. Submit App Review **only if** real Meta credentials + prep pack completeness allow; otherwise **BLOCKED**.
4. Refresh `docs/ops/p0-meta-app-review-submit.md` / evidence with probe results (no fake submit).
5. Commit: `docs(ops): R0.4 Meta re-attempt result (SDD E4)`.

### Done when

- Submitted (or Approved) recorded **or** BLOCKED with exact remaining owner fields — no fake submit.

---

## Task 4: Eng parallel E100 — I8 access review dry-run

**Goal:** Advance E100 eng-parallel work without owner payment. Prefer **I8** because runbook exists.

### Steps

1. Confirm runbook `docs/runbooks/platform-admin-access-review.md` exists (SoT: I8 AMBER until first quarterly evidence).
2. Execute **dry-run** of access review process per runbook (document what would be reviewed; do **not** invent live admin roster claims or fake GREEN).
3. Update `docs/superpowers/plans/plan-i-dod-evidence.md` I8 note with dry-run status (still AMBER until real quarterly biên bản).
4. If dry-run blocked by missing staging/admin access → document **BLOCKED** with exact next eng/owner action; still valid exit.
5. Commit: `docs(ops): I8 access review dry-run (SDD E4)`.

### Fallback (only if runbook missing)

- Strengthen I4 status-page docs/process instead — **not** preferred this wave (runbook present → pick I8).

### Done when

- I8 dry-run documented honestly (AMBER/BLOCKED OK); no E100 100% claim.

---

## Task 5: E4 gate docs + STOP

**Goal:** Honest gate; update path-to-100 “tiếp theo ngay”; controller STOP.

### Steps

1. Append **Wave E4 SDD gate** to `docs/ops/r0-r3-execution-evidence.md`: Task 1–4 results; R0.2/R0.4 GREEN or BLOCKED; I8 dry-run note.
2. Update `docs/superpowers/plans/2026-07-25-path-to-100-percent.md` “tiếp theo ngay” with honest % (eng / CPC / E100 / tổng) — **no** 100% CPC/E100 claim.
3. Update `.superpowers/sdd/progress.md` ledger to CLOSED or BLOCKED-STOP.
4. Commit: `docs(ops): E4 SDD gate — owner re-attempt + I8 dry-run; STOP`.
5. Controller STOPS after this task (resume when owner unblocks R0.2/R0.4 or provides keys).

### Done when

- Gate accurate; draft PR updated/ready; no false 100% claim.

---

## After this wave (controller)

**STOP** for owner (unless Task 2–3 unexpectedly GREEN):
- R0.2 Render Starter payment ×3
- R0.4 Meta credentials + App Review submit

Then: R0.3b staging full walkthrough → Gate R0 → Wave R1 (paid) SDD.  
Eng may continue only non-owner items already scoped (e.g. Task 4 I8) — do not start R1 paid billing without owner.
