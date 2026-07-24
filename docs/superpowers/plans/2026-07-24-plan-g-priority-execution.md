# Plan G — Kế hoạch thực thi theo thứ tự ưu tiên (Phase 3 Intelligence)

**Status:** **IN PROGRESS** — Wave 3A Ads spend starts first  
**Authority (tasks):** [plan-g-phase3-intelligence](./2026-07-24-plan-g-phase3-intelligence.md)  
**Roadmap:** [priority-execution-roadmap](./2026-07-24-priority-execution-roadmap.md) · [path-to-completion](./2026-07-24-path-to-completion-priority.md)  
**Baseline:** Plan F DONE (`plan-f-dod-evidence.md`); CPC still waits for Plan H.

---

## 1. Plan G trên đường hoàn thiện

```
DONE   A–D  Pilot Phase 1
AMBER  E    M3 (code+docs GREEN)
DONE   F    Phase 2 Operations
▶ NOW  G    Phase 3 Intelligence   ← tài liệu này
THEN   H → CPC
THEN   I → E100
```

---

## 2. Mục tiêu một câu

Đưa dữ liệu ads, attribution, advisor, lịch nội dung và API khách vào sản phẩm theo chế độ human-in-the-loop; chưa tự mua ads, chưa auto-post mặc định, chưa claim CPC.

---

## 3. Thứ tự ưu tiên trong G (không đảo)

| Ưu tiên | Wave | Gate ra |
|--------:|------|---------|
| **G0** | 3A Ads spend | `ad_spend` theo org/day/campaign; CSV import; ads vào P&L |
| **G1** | 3B Attribution | UTM/click ids; first/last touch MVP; nguồn đơn |
| **G2** | 3C Owner Advisor | Advise-only; grounded RAG; người duyệt; eval |
| **G3** | 3D Content calendar | Lịch nội dung dùng được; auto-post off mặc định |
| **G4** | 3E Public API | API keys/scopes; signed outbound webhooks; docs |
| **G5** | 3F Hardening | SLO/eval/load/runbooks; Phase 3 checklist xanh |

**Phụ thuộc:** G0 trước P&L/ROAS-style báo cáo; G1 trước attribution reporting; G2 trước G3 gợi ý nội dung; G4 sau `/v1` surface ổn định; G5 cuối.

---

## 4. Checklist vận hành

1. Branch `feat/plan-g-phase3`
2. Execute G0→G5 theo wave order
3. Cập nhật `plan-g-dod-evidence.md` sau từng wave
4. Push branch
5. Không merge main trong branch này

**Không** claim CPC sau G. CPC chỉ sau Plan H.
