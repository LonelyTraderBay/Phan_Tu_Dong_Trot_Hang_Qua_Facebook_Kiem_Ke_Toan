# SDD Execution — Wave P0 (Post-audit polish → eng local sạch)

**Date:** 2026-07-27  
**Parent:** [completion-priority-post-audit](./2026-07-27-completion-priority-post-audit.md) · [code-first Gate A](./2026-07-26-completion-priority-code-first.md) · [path-to-100](./2026-07-25-path-to-100-percent.md)  
**Branch:** `cursor/p0-post-audit` (from `main` @ `d77c197`)  
**Method:** Subagent-Driven — one task per subagent, review between tasks.

## Owner policy / SoT note

- **NOW = Wave P0** — P0.1 regression tươi + P0.2 docs ports drift (+ optional P0.3).
- **“100%” for this wave** = Gate P0 đóng (eng local sạch mở thương mại) — **not** CPC / E100 / tổng 100%.
- Pha B (Render/Meta) và Pha C (Plan I live) vẫn **BLOCKED owner/vendor** sau STOP.
- Không claim CPC/E100/tổng 100% trong wave này.
- Ports SoT: `config/local-ports.json` (4700/4701/4702/4788/54721).
- Prefer `cursor/` branch; no secrets in git.

## Already DONE (skip)

- L1–L3 Gate A Code local READY (PR #26–#28)
- Port lock Omni + PS1 encoding (PR #29–#30)
- Post-audit checklist SoT drafted (this wave Task 1 lands it)

---

## Task 1: Land post-audit SoT + this plan

**Goal:** Branch + commit post-audit checklist + SDD P0 plan + pointer updates; draft PR.

### Steps

1. Branch `cursor/p0-post-audit` from `origin/main`.
2. Land `2026-07-27-completion-priority-post-audit.md` + pointers in path-to-100 / remaining / code-first.
3. Write this plan; append Wave P0 progress ledger section in evidence (stub OK until T2).
4. Commit; push; draft PR → `main`.

### Done when

- SoT + plan on branch; no CPC/E100 100% claim; no secrets.

**Status:** DONE — commit `527c1e7`, draft PR #31.

---

## Task 2: P0.1 — Gate A regression tươi + evidence

**Goal:** Re-run Gate A commands on locked ports; record GREEN/FAIL + SHA.

### Steps

1. Ensure Docker + `npx supabase status` on `:54721`; `pnpm run ports:sync`; stack `dev:local` healthy on 4700–4788.
2. Run: `pnpm --filter @omni/api test` · `uv run pytest` (apps/ai) · `pnpm test:isolation` · `pnpm test:e2e:local` · `pnpm lint` · `pnpm typecheck`.
3. Append `docs/ops/r0-r3-execution-evidence.md` section “Wave P0 / Gate A re-verify 2026-07-27” with counts + SHA.
4. Commit evidence only (fix code only if regression fails with minimal fix).

### Done when

- All required commands GREEN **or** FAIL documented with root cause; evidence dated; Meta still BLOCKED OK.

**Status:** DONE — commit `016672b`. Gate A all GREEN on locked ports; Meta BLOCKED OK; no CPC/E100 100% claim. Minimal fix: `scripts/local-e2e-smoke.mjs` prefers repo `.env` + `local-ports.json` over stale shell `SUPABASE_URL` (legacy `:54321`).

---

## Task 3: P0.2 — Docs ports / baseline drift

**Goal:** Banner SoT ports; mark legacy `:3000` evidence; no wrong “open :3000” in SoT paths.

### Steps

1. Banner top of `local-host.md` + evidence ledger pointing to `config/local-ports.json`.
2. Mark historical rows that still say 3000/54321 as *legacy* (do not delete history).
3. Confirm path-to-100 / remaining already point to post-audit SoT (Task 1).
4. Commit.

### Done when

- New reader uses `:4700` from SoT docs.

**Status:** DONE — SoT banners on `local-host.md` + `r0-r3-execution-evidence.md`; legacy `:3000`/`:3001`/`:8000`/`:54321` rows labeled; how-to Inngest uses `:4701`/`:4788`; README already locked ports.

---

## Task 4: P0.3 — Optional A6 SW + A7 note + Gate P0 close

**Goal:** Close optional polish honestly; tick Gate P0.

### Steps

1. A6: minimal `/m` cache in `sw.js` **or** document AMBER_OK “offline not required for Gate P0”.
2. A7: **Do not invent owner decision** — leave R2.4 `undecided` **or** note “deferred to Pha B B5”; do not forge AMBER_OK.
3. Update post-audit checklist §6 TODOs + evidence Gate P0 CLOSED.
4. Commit; ready PR for merge.

### Done when

- Gate P0 checklist: P0.1+P0.2 GREEN; P0.3 honest; STOP says Pha B BLOCKED owner.

**Status:** DONE — A6 **AMBER_OK** (network-only `sw.js`; offline `/m` not required for Gate P0). A7 R2.4 left **`undecided`** (deferred to Pha B **B5**; no forged AMBER_OK). Gate P0 CLOSED in evidence. CPC ~38% / E100 ~22%+ / tổng ~55% — **NOT 100%**.

---

## Wave P0 STOP

```
Gate P0 eng local sạch = YES
CPC / E100 / tổng 100% = NOT claimed (~38% / ~22%+ / ~55%)
Next = Pha B only when owner wants to sell (B1 Render Starter) — BLOCKED owner until then
A7 R2.4 = undecided → decide at B5 before CPC claim
```

## Progress ledger

| Task | Status | Commit / note |
|------|--------|---------------|
| T1 SoT + plan | DONE | `527c1e7` · PR #31 |
| T2 P0.1 regression | DONE | `016672b` · evidence § Wave P0 / Gate A re-verify 2026-07-27 · e2e port-lock fix |
| T3 P0.2 docs drift | DONE | `113d926` · SoT banners + legacy labels; how-to → locked ports |
| T4 P0.3 + Gate P0 | DONE | A6 AMBER_OK · A7 deferred B5 · evidence § Wave P0 CLOSED 2026-07-27 |
