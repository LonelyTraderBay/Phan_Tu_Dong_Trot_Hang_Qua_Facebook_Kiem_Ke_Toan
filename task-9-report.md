# Task 9 Report — C8 Eval golden VI + CI hook

- Added 6 golden grounded VI cases under `tests/eval/golden/` (price, color/size, ship, return, empty-context escalate, model escalate).
- Extended `tests/eval/run_stub.py` to validate adversarial ≥10, golden ≥5, and run mocked orchestrator per golden case.
- Wired CI: `pnpm test:eval` in root `package.json`; `ci-ai.yml` runs eval after pytest.
- Verification: `uv run python ../../tests/eval/run_stub.py` => `ok:adversarial=10 golden=6`.
- Verification: `pnpm test:eval` => PASS; `uv run pytest -q` => PASS.
