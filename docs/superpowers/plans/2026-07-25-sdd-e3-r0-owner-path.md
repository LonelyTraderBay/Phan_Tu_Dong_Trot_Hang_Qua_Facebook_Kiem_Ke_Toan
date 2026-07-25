# SDD Execution — Wave E3 (R0 owner path + eng parallel)

**Date:** 2026-07-25  
**Parent:** [path-to-100-percent](./2026-07-25-path-to-100-percent.md) · [E2 plan](./2026-07-25-sdd-e2-to-100.md)  
**Branch:** `cursor/e3-r0-owner-path` (from `main` after PR #22)  
**Method:** Subagent-Driven — one task per subagent, review between tasks, continue until Gate or owner BLOCKED.

## Global Constraints

- Do **not** invent Meta credentials, Render payment methods, or Supabase Pro billing.
- Do **not** claim CPC thương mại 100% or E100 100% until SoT gates are GREEN.
- Owner/vendor blockers → document **BLOCKED** with exact next action; that is a valid task exit.
- Prefer `cursor/` branch prefix; no secrets in git (never print secret values).
- Keep diffs minimal and on-task.
- E2 must be on `main` before R0 probes (Task 1).

## Already DONE (skip)

- E0 warehouse fix + R0 prep packs (#20)
- E1 resume / advisor / Zalo (#22 via E2)
- E2 http_sandbox + billing entitlement proof + E2 gate STOP (#22 merged)
- R0.1 migrations CI + staging baseline; R0.5 Scheduled QA
- R0.2 always-on unblock pack in `docs/ops/deploy-staging-render.md`
- R0.4 Meta App Review prep pack in `docs/ops/p0-meta-app-review-submit.md`

---

## Task 1: Merge PR #22 → main + open E3 branch

**Goal:** Land E2 on `main`; start `cursor/e3-r0-owner-path` worktree with this plan + progress ledger.

### Steps

1. `gh pr ready 22` if draft; confirm CI GREEN / MERGEABLE.
2. `gh pr merge 22 --merge` (prefer merge commit to preserve history; do not delete remote branch unless clean).
3. Confirm `main` tip includes E2 commits (`resume`, `http_sandbox`, billing gate docs).
4. Create worktree `.worktrees/e3-sdd` from updated `main` on `cursor/e3-r0-owner-path`.
5. Commit this plan + `.superpowers/sdd/progress.md`.
6. Push branch; draft PR optional until Task 5.

### Done when

- `main` has merge SHA for #22; E3 worktree/branch exists with plan + ledger committed.
- If merge blocked by permissions → document **BLOCKED**, leave PR ready; do not invent merge.

---

## Task 2: Attempt R0.2 — Render Starter ×3

**Goal:** Upgrade staging to always-on Starter **or** exit BLOCKED with exact owner clicks.

### Steps

1. Probe whether `RENDER_API_KEY` exists in env / `.local-secrets/` / GitHub secrets **without printing values** (presence only: set / unset).
2. If key present: attempt plan upgrade for `omni-api-staging`, `omni-ai-staging`, `omni-web-staging` (Free → Starter) via Render API/CLI if supported.
3. If payment missing or API cannot bill: **BLOCKED** — copy exact owner steps from [deploy-staging-render.md § Upgrade to always-on](../../ops/deploy-staging-render.md):
   - Billing → Add payment method
   - Each service Settings → Instance Type → Starter → Save (three service IDs in that doc)
   - Optional: `render.yaml` `plan: free` → `starter`
   - Verify no cold-start after idle; keep-warm alone ≠ GREEN
4. Update `docs/ops/r0-r3-execution-evidence.md` R0.2 row: GREEN only with post-upgrade proof; else BLOCKED/AMBER with owner clicks.
5. Commit: `docs(ops): R0.2 Starter attempt result (SDD E3)`.

### Done when

- R0.2 GREEN with always-on proof **or** BLOCKED with dashboard click list (no fake GREEN).

---

## Task 3: Attempt R0.4 — Meta App Review

**Goal:** Submit App Review **or** BLOCKED with remaining owner actions.

### Steps

1. Probe `META_APP_ID` / `META_APP_SECRET` / `META_VERIFY_TOKEN` / `META_REDIRECT_URI` presence only (placeholders in `.env.example` are known — do not invent real values; never print secrets).
2. If staging warm: verify legal URLs (`/legal/privacy`, `/legal/terms`) return public 200; update prep pack status.
3. Refresh `docs/ops/p0-meta-app-review-submit.md` / evidence with probe results.
4. If credentials/legal/screencast incomplete → **BLOCKED** (cannot submit); list exact owner fills from prep pack table.
5. Commit: `docs(ops): R0.4 Meta attempt result (SDD E3)`.

### Done when

- Submitted (or Approved) recorded **or** BLOCKED with exact remaining owner fields — no fake submit.

---

## Task 4: R3.7 eng — SBOM enforce on release tags

**Goal:** Make release/`v*` path fail CI if SBOM artifact missing; strengthen `.github/workflows/sbom.yml`.

### Steps

1. Review current `sbom.yml` (Syft SPDX on `v*` / release / dispatch; already has `test -s sbom.spdx.json`).
2. Strengthen enforce: ensure tag pushes and published releases cannot succeed without a non-empty SBOM; fail the job clearly if Syft/upload fails; consider requiring SBOM asset on release.
3. Keep scope to workflow/docs — do not invent org release process claims.
4. Update `plan-i-dod-evidence.md` I7 note if enforce status changes.
5. Commit: `ci(sbom): enforce SBOM on release tags (SDD E3 R3.7)`.

### Done when

- Workflow fails closed when SBOM missing; evidence row updated honestly (AMBER remaining if org must still cut tags).

---

## Task 5: E3 gate docs + STOP

**Goal:** Honest gate; update path-to-100 “tiếp theo ngay”; controller STOP.

### Steps

1. Append **Wave E3 SDD gate** to `docs/ops/r0-r3-execution-evidence.md`: Task 1–4 results; R0.2/R0.4 GREEN or BLOCKED.
2. Update `docs/superpowers/plans/2026-07-25-path-to-100-percent.md` “tiếp theo ngay” with honest % (eng / CPC / E100 / tổng) — **no** 100% CPC/E100 claim.
3. Update `.superpowers/sdd/progress.md` ledger to CLOSED or BLOCKED-STOP.
4. Commit: `docs(ops): E3 SDD gate — R0 owner attempt + eng SBOM; STOP`.
5. Controller STOPS after this task (resume when owner unblocks R0.2/R0.4 or provides keys).

### Done when

- Gate accurate; draft PR to `main` if useful; no false 100% claim.

---

## After this wave (controller)

**STOP** for owner (unless Task 2–3 unexpectedly GREEN):
- R0.2 Render Starter payment ×3
- R0.4 Meta credentials + App Review submit

Then: R0.3b staging full walkthrough → Gate R0 → Wave R1 (paid) SDD.
Eng may continue only non-owner items already scoped (e.g. Task 4 SBOM) — do not start R1 paid billing without owner.
