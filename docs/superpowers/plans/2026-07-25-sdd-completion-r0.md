# SDD Execution — Wave R0 (completion path)

**Date:** 2026-07-25
**Parent SoT:** [2026-07-25-remaining-completion-priority.md](./2026-07-25-remaining-completion-priority.md)
**Method:** Subagent-Driven Development (fresh subagent per task + review between tasks)

## Global Constraints

- Do **not** claim CPC or E100 in docs.
- Do **not** push migrations to production (prod currently none / recreate later).
- Prefer **local-first** for R0.3a; staging public URLs for R0.3b/R0.4.
- Evidence updates go to `docs/ops/r0-r3-execution-evidence.md` and the walkthrough file.
- No secrets in git; use `.local-secrets/` (gitignored) only.
- Owner-only blockers (payment, Meta dashboard credentials) → mark **BLOCKED** with exact next owner action; do not invent credentials.
- Keep diffs minimal: docs + evidence + small scripts only if needed for verification.
- Commits on feature branch only (not unsolicited force-push).

## Already DONE (do not re-do)

- R0.1 migrations (CI + remote staging `tjsmpcgkeoglemptuymu`)
- R0.5 Scheduled QA (Actions run 30139904845)
- Local full stack docs/scripts (`docs/ops/local-host.md`, `pnpm run dev:local`)

---

## Task 1: R0.3a Local §12.1 walkthrough evidence

**Goal:** Execute / verify what is possible of Design §12.1 on the **local** stack and record PASS / FAIL / BLOCKED per criterion.

### Steps

1. Ensure Docker PATH includes `C:\Program Files\Docker\Docker\resources\bin` if needed.
2. Start local Supabase (`npx supabase start`) if not running; confirm Studio/API up.
3. Start or verify local apps via `pnpm run dev:local` (or existing processes): web `:3000`, api `:3001`, ai `:8000`.
4. Health-check: HTTP 200 for api `/health`, ai health, web root (as documented in `docs/ops/local-host.md`).
5. Run isolation proof if available: `pnpm test:isolation` (or equivalent documented command); record result.
6. Update `docs/ops/p0-staging-walkthrough-12-1.md`:
   - Preflight: mark local URLs; note staging≠prod where true; Meta row BLOCKED if no test app.
   - Criteria 1–7: each `PASS` / `FAIL` / `BLOCKED` with short note + date `2026-07-25` + operator `sdd-task-1`.
   - Criteria requiring Meta OAuth/DM (typically 2, 4) → **BLOCKED** with reason `META_*` placeholders / no test Page — do not fake PASS.
   - Criteria verifiable via UI/API/tests without Meta → attempt and record honestly.
7. Update `docs/ops/r0-r3-execution-evidence.md` R0.3 row to reflect local progress (still AMBER overall until staging+Meta).
8. Commit on the feature branch with message like: `docs(ops): R0.3a local §12.1 walkthrough evidence (SDD Task 1)`.

### Done when

- Walkthrough file filled for all 7 criteria + preflight.
- Evidence file updated.
- Isolation test result recorded (pass or explicit skip reason).
- Commit exists.

### Not in scope

- Render payment / Meta App Review submit.
- Claiming R0.3 GREEN overall.

---

## Task 2: R0.2 Always-on staging — evidence + owner unblock pack

**Goal:** Refresh R0.2 status; produce a single owner action list to reach always-on. Do **not** spend money.

### Steps

1. Read `docs/ops/deploy-staging-render.md`, `render.yaml`, evidence file Render URLs.
2. Probe staging health from this environment if possible; if TLS fails locally, cite GHA keep-warm / prior external probe evidence — do not claim LIVE without evidence.
3. Document exact owner steps: Render payment method → upgrade free→starter (or equivalent) for `omni-api-staging`, `omni-ai-staging`, `omni-web-staging`.
4. Update `docs/ops/r0-r3-execution-evidence.md` R0.2 with current status + unblock list.
5. If missing, add a short section to `docs/ops/deploy-staging-render.md` titled “Upgrade to always-on (owner)” with checklist.
6. Commit: `docs(ops): R0.2 always-on unblock pack (SDD Task 2)`.

### Done when

- Evidence R0.2 updated; owner checklist concrete (service names + URLs).
- Status remains AMBER until paid always-on proven.

### Blocked exit (acceptable)

- If no network path to Render: still ship the owner checklist + leave AMBER with noted probe failure.

---

## Task 3: R0.4 Meta App Review — prep pack (credentials blocked)

**Goal:** Make App Review submission mechanically ready; stop at owner credentials.

### Steps

1. Read `docs/ops/p0-meta-app-review-submit.md`.
2. Verify legal/public URL placeholders and webhook requirements against current staging URLs.
3. Produce/update a checklist in that file or evidence: Terms, Privacy, webhook URL, permissions, redirect URIs — filled with staging URLs where known; blank for secrets.
4. Confirm `META_*` still placeholders in committed examples only (do not commit real secrets).
5. Update evidence R0.4: AMBER + “owner: replace META_* + submit”.
6. Commit: `docs(ops): R0.4 Meta App Review prep pack (SDD Task 3)`.

### Done when

- Prep checklist complete; R0.4 still AMBER; no fake Submitted claim.

---

## Task 4: Wave R0 gate summary + ledger closeout

**Goal:** Summarize R0 gate: what is GREEN / AMBER / BLOCKED; link to parent SoT; no CPC claim.

### Steps

1. Update parent SoT “Tóm tắt một trang” if status changed.
2. Append Wave R0 SDD summary to `docs/ops/r0-r3-execution-evidence.md`.
3. Commit: `docs(ops): R0 SDD wave gate summary (SDD Task 4)`.

### Done when

- Gate summary accurate; next wave clearly R1 (owner billing) or remaining R0 owner actions.

---

## After Wave R0 (controller stops for owner)

Owner must clear: Render always-on payment, Meta credentials + App Review submit, then full staging §12.1.
Next SDD wave: **R1 Plan E paid/live** (new plan file) — do not start until owner unblocks or explicitly asks to prep-only R1 docs.
