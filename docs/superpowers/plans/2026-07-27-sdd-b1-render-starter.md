# SDD Execution — Wave B1 (Pha B kickoff — Render Starter / R0.2)

**Date:** 2026-07-27  
**Parent:** [completion-priority-post-audit](./2026-07-27-completion-priority-post-audit.md) · [completion-step-by-step](./2026-07-25-completion-step-by-step.md)  
**Branch:** `cursor/b1-render-starter-kickoff`  
**Method:** Subagent-Driven when implementing; this wave opens Pha B eng path.

## Owner policy / honesty

- Gate P0 (eng local) = **YES** (PR #31).
- Wave B1 success for **eng** = kickoff docs + re-probe + owner click-path rõ ràng.
- Wave B1 success for **R0.2 GREEN** = owner thanh toán + Free→Starter ×3 + no-cold-start proof.
- **Không** claim R0.2 GREEN / CPC / E100 / tổng 100% khi còn Free tier hoặc thiếu payment.
- Keep-warm `healthy_count=3/3` = **AMBER** reachability only — **không** đủ GREEN.

## Already DONE (skip)

- Staging services LIVE on Render Free (`omni-api/ai/web-staging`)
- Blueprint `render.yaml` (`plan: free`)
- Owner upgrade table in `docs/ops/deploy-staging-render.md`
- Gate P0 CLOSED

---

## Task 1: Kickoff SoT + owner runbook VI + re-probe

**Goal:** Mở Wave B1 trên `main` path: plan SDD, runbook owner tiếng Việt, evidence re-probe R0.2 vẫn BLOCKED nếu chưa payment.

### Steps

1. Branch `cursor/b1-render-starter-kickoff`.
2. Land this plan + `docs/ops/b1-render-starter-owner.md` (click-path VI đầy đủ).
3. Re-probe: `RENDER_API_KEY` presence (không in giá trị); ghi latency/health nếu probe được; latest keep-warm.
4. Append evidence `Wave B1 OPEN / R0.2 re-probe`.
5. Update post-audit §6: B1 = OPEN / BLOCKED owner.
6. Commit VI đầy đủ → PR Enterprise → merge khi CI xanh.

### Done when

- Docs + evidence trên branch/PR; R0.2 verdict trung thực (GREEN chỉ nếu owner đã Starter + proof).

**Status:** DONE in this PR (kickoff docs + re-probe; R0.2 GREEN vẫn BLOCKED owner)

---

## Task 2: Owner clears R0.2 (BLOCKED until payment)

**Ai:** Owner (không phải agent tự thanh toán)

1. Billing → Add payment method.
2. Free → Starter cho `omni-api-staging`, `omni-ai-staging`, `omni-web-staging`.
3. (Tuỳ) Đổi `render.yaml` `plan: free` → `plan: starter` sau khi Dashboard đã Starter.
4. External curl sau idle 15–30 phút — không cold-start page.
5. Eng ghi evidence R0.2 **GREEN**.

**Status:** BLOCKED (owner)

---

## Wave B1 STOP (eng kickoff)

```
Eng kickoff B1 = YES (docs + re-probe)
R0.2 always-on GREEN = NO until owner Starter x3
Next after R0.2 GREEN = B2 META_* + App Review
CPC / E100 / tong 100% = NOT claimed
```
