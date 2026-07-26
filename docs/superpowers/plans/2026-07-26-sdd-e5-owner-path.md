# SDD Execution — Wave E5 (owner path re-probe + I5 eng parallel)

**Date:** 2026-07-26  
**Parent:** [path-to-100-percent](./2026-07-25-path-to-100-percent.md) · [completion-step-by-step](./2026-07-25-completion-step-by-step.md) · [E4 plan](./2026-07-26-sdd-e4-owner-path.md)  
**Branch:** `cursor/e5-owner-path` (from `main` @ `9e5976f` after PR #24)  
**Method:** Subagent-Driven — one task per subagent, review between tasks, continue until Gate or owner BLOCKED.

## Global Constraints

- Do **not** invent Meta credentials, Render payment methods, Gemini keys, or Supabase Pro billing.
- Do **not** claim CPC thương mại 100% or E100 100% until SoT gates are GREEN.
- Owner/vendor blockers → document **BLOCKED** with exact next action; that is a valid task exit.
- Prefer `cursor/` branch prefix; no secrets in git (never print secret values).
- Keep diffs minimal and on-task.
- E3 and E4 already attempted R0.2/R0.4 and exited **BLOCKED**. E5 **re-probes** only, then eng-parallel (I5), then **STOP**. Further eng SDD waves cannot reach tổng/CPC/E100 100% without owner R0.2 + R0.4.

## Already DONE (skip)

- E0 warehouse fix + R0 prep packs (#20)
- E1 resume / advisor / Zalo (#22 via E2)
- E2 http_sandbox + billing entitlement proof + E2 gate STOP (#22 merged)
- E3 R0.2/R0.4 attempt **BLOCKED** + SBOM enforce (I7 eng) (#23 merged)
- E4 R0.2/R0.4 re-attempt **BLOCKED** + I8 dry-run AMBER + completion-step-by-step (#24 merged @ `9e5976f`)
- R0.1 migrations CI + staging baseline; R0.5 Scheduled QA
- R0.2 always-on unblock pack in `docs/ops/deploy-staging-render.md`
- R0.4 Meta App Review prep pack in `docs/ops/p0-meta-app-review-submit.md`
- I8 access review runbook + eng dry-run (evidence still AMBER until quarterly signed)
- Owner still has **not** provided Render payment / real `META_*` / GEMINI (probed 2026-07-26)

---

## Task 1: Open E5 branch + plan + draft PR

**Goal:** Create worktree/branch with this plan + progress ledger; open draft PR → `main`.

### Steps

1. Confirm worktree `.worktrees/e5-sdd` on `cursor/e5-owner-path` from `origin/main` @ `9e5976f`.
2. Commit this plan + `.superpowers/sdd/progress.md` (Wave E5 ledger).
3. Push branch; open **draft** PR → `main` (title mentions E5 / owner path / I5 process prep).

### Done when

- E5 plan + ledger on `cursor/e5-owner-path`; draft PR URL available.
- No secrets in commit; parent `main` working tree not double-committed.

---

## Task 2: Re-probe R0.2 — Render always-on

**Goal:** Confirm whether owner unblocked Render Starter **or** exit BLOCKED again (presence / keep-warm only).

### Steps

1. Probe whether `RENDER_API_KEY` exists in env / `.local-secrets/` / GitHub secrets **without printing values** (presence only: set / unset).
2. If key present: attempt plan upgrade for `omni-api-staging`, `omni-ai-staging`, `omni-web-staging` (Free → Starter) via Render API/CLI if supported; record plan proof (Starter) — never invent payment.
3. If payment missing or API cannot bill: **BLOCKED** — owner steps from [deploy-staging-render.md § Upgrade to always-on](../../ops/deploy-staging-render.md) and [completion-step-by-step Bước 1–2](./2026-07-25-completion-step-by-step.md).
4. Keep-warm `healthy_count=3/3` alone = **AMBER** reachability only — **not** GREEN. GREEN only with Starter / no-cold-start proof.
5. Update `docs/ops/r0-r3-execution-evidence.md` R0.2 row honestly.
6. Commit: `docs(ops): R0.2 Starter re-probe result (SDD E5)`.

### Done when

- R0.2 GREEN with always-on / Starter proof **or** BLOCKED with dashboard click list (no fake GREEN). Keep-warm-only stays AMBER/BLOCKED.

---

## Task 3: Re-probe R0.4 — Meta App Review

**Goal:** Submit App Review **or** BLOCKED with remaining owner actions (placeholder check).

### Steps

1. Probe `META_APP_ID` / `META_APP_SECRET` / `META_VERIFY_TOKEN` / `META_REDIRECT_URI` presence only (placeholders in `.env.example` are known — do not invent real values; never print secrets).
2. If credentials look real **and** staging warm: verify legal URLs (`/legal/privacy`, `/legal/terms`) return public 200; update prep pack status.
3. Submit App Review **only if** real Meta credentials + prep pack completeness allow; otherwise **BLOCKED**.
4. Refresh `docs/ops/p0-meta-app-review-submit.md` / evidence with probe results (no fake submit).
5. Commit: `docs(ops): R0.4 Meta re-probe result (SDD E5)`.

### Done when

- Submitted (or Approved) recorded **or** BLOCKED with exact remaining owner fields — no fake submit.

---

## Task 4: Eng parallel E100 — I5 subprocessors customer notification process

**Goal:** Advance E100 eng-parallel without owner payment. Prefer **I5** (public subprocessors page exists; notification process still AMBER).

### Steps

1. Confirm public page `/legal/subprocessors` + source `docs/legal/subprocessors.md` exist (SoT: I5 GREEN/AMBER — process/legal still AMBER).
2. Add owner-facing **customer notification process** for subprocessors change under `docs/` (runbook and/or email/notice template) — eng-ready process only; do **not** invent legal approval or claim customers were notified.
3. Update `docs/superpowers/plans/plan-i-dod-evidence.md` I5 honestly: process eng ready; **legal approve still AMBER**. Do **NOT** claim I5 full GREEN.
4. Optional: link runbook from `docs/legal/subprocessors.md` / `docs/runbooks/README.md`.
5. Commit: `docs(ops): I5 subprocessors customer notification process (SDD E5)`.

### Done when

- Runbook/template landed; I5 evidence updated honestly (eng process ready + legal AMBER); **no** I5 full GREEN / no E100 100% claim.

---

## Task 5: E5 gate docs + STOP

**Goal:** Honest gate; update path-to-100 / completion-step-by-step “tiếp theo ngay”; controller STOP.

### Steps

1. Append **Wave E5 SDD gate** to `docs/ops/r0-r3-execution-evidence.md`: Task 1–4 results; R0.2/R0.4 GREEN or BLOCKED; I5 process note (eng ready / legal AMBER).
2. Update `docs/superpowers/plans/2026-07-25-path-to-100-percent.md` “tiếp theo ngay” with honest % — **no** 100% CPC/E100/tổng claim.
3. Update `docs/superpowers/plans/2026-07-25-completion-step-by-step.md` tiếp theo ngay / owner TODO with E5 STOP.
4. State clearly: **further eng SDD cannot reach 100% without owner R0.2 + R0.4**.
5. Update `.superpowers/sdd/progress.md` ledger to CLOSED or BLOCKED-STOP.
6. Commit: `docs(ops): E5 SDD gate — owner re-probe + I5 process; STOP`.
7. Controller STOPS after this task (resume when owner unblocks R0.2/R0.4 or provides keys).

### Done when

- Gate accurate; draft PR updated/ready; no false 100% claim; STOP text explicit that eng SDD alone cannot finish without owner R0.2+R0.4.

---

## After this wave (controller)

**STOP** for owner (unless Task 2–3 unexpectedly GREEN):
- R0.2 Render Starter payment ×3
- R0.4 Meta credentials + App Review submit

Then: R0.3b staging full walkthrough → Gate R0 → Wave R1 (paid) SDD.  
Eng may continue only non-owner items already scoped (e.g. Task 4 I5 legal handoff) — do not start R1 paid billing without owner.  
**Hard stop:** further eng-only SDD waves cannot reach CPC/E100/tổng 100% without owner R0.2 + R0.4.
