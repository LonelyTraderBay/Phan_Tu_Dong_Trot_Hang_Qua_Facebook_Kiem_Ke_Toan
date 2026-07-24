# Task 4 Report — C3 LlmProvider + Gemini + allowlist

## Status

Completed.

## Implementation

- Added `LlmProvider` protocol and `LlmCompletion` dataclass in `apps/ai/app/infra/llm/provider.py`.
- Added `parse_allowlist` / `assert_model_allowed` — rejects models outside comma-separated `AI_MODEL_ALLOWLIST`.
- Added `GeminiLlmProvider.complete(...)` in `apps/ai/app/infra/llm/gemini.py` — calls Gemini `generateContent`, returns text + token counts.
- Follows Task 3 patterns: stdlib `urllib`, injectable `opener`, `settings.gemini_api_key` / `settings.ai_model_allowlist`.
- `GEMINI_API_KEY` already present in root `.env.example` (AI service section).

## Tests

- `test_rejects_model_not_in_allowlist` — `gpt-4o` rejected when allowlist is `gemini-2.0-flash`.
- `test_complete_success_with_mocked_http` — mocked `urlopen` returns parsed completion + usage metadata.

## Verification

- `uv run pytest -q` in `apps/ai` — 9 passed.

## Notes

- No orchestrator/API wiring (Task 5). Provider is infra-only, ready for orchestrator injection.

---

## Re-review (7552ba1..7636eb9)

Reviewed diff `review-7552ba1..7636eb9.diff`; spot-check of `apps/ai/app/infra/llm/*` and `apps/ai/tests/test_llm.py`.

### Commits

| SHA | Message |
|-----|---------|
| `e933079` | `feat(ai): gemini llm provider with allowlist` |
| `7636eb9` | `docs(sdd): task 4 llm provider report` |

Base: `7552ba1` (Task 3) · Head: `7636eb9`

### Spec checklist

| Requirement | Status |
|-------------|--------|
| Interface `LlmProvider.complete(...)` | ✅ `LlmProvider` protocol + `LlmCompletion` dataclass in `provider.py` |
| Gemini implementation | ✅ `GeminiLlmProvider` → Gemini `generateContent`, parses text + `usageMetadata` token counts |
| Reject model not in allowlist | ✅ `assert_model_allowed` before HTTP; `ValueError` with `AI_MODEL_ALLOWLIST` message; pytest covered |
| Files `apps/ai/app/infra/llm/*` | ✅ `provider.py`, `gemini.py` |
| Env `GEMINI_API_KEY` | ✅ `settings.gemini_api_key` (Pydantic env); root `.env.example` line 29; runtime guard if missing |
| Global: allowlist reject | ✅ Checked pre-call; disallowed model never hits Gemini |
| Global: no orchestrator | ✅ No `orchestrator`, `process_message`, or API wiring in diff |
| Commit message | ✅ `feat(ai): gemini llm provider with allowlist` |

**Spec: ✅**

### Findings

#### Important

(none)

#### Minor — deferred

1. **No test for missing `GEMINI_API_KEY`.** RuntimeError path exists (`gemini.py:27-28`) but untested — consistent with Task 3 embedding provider; add in Task 5 if orchestrator integration needs it.
2. **No `system` message role.** `_map_role` accepts `user` / `assistant` (→ `model`) / `model` only. Task 5 orchestrator may need `systemInstruction` or a system-role mapping; defer to orchestrator task.
3. **HTTP error / empty-response paths untested.** `_extract_text` and `HTTPError` wrapping are reasonable; mocked success + allowlist reject suffice for C3 infra scope.

### Verification (review pass)

| Check | Result |
|-------|--------|
| `uv run pytest -q tests/test_llm.py` | Pass (2 tests) |
| `uv run pytest -q` in `apps/ai` | Pass (9 tests) |

### Verdict

**Approved.**

C3 infra-only scope met: protocol, Gemini adapter, allowlist gate, `GEMINI_API_KEY` wiring, no orchestrator leakage. Minor coverage gaps are acceptable deferred debt before Task 5.
