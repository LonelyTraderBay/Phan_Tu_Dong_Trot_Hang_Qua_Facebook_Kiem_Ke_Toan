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
