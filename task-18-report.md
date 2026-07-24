# Task 18 report

- Added docs spine: README, `.env.example`, CODEOWNERS, ADRs, runbooks.
- ADR 0001 locks Render as the single web/api/ai host; Fly requires a future ADR.
- ADR 0002 keeps Inngest SDK, keys, and routes inside `apps/api`.
- Added Vietnamese runbooks for AI down and DB failover, plus Meta stub.
- Added 10 adversarial eval markdown cases and `tests/eval/run_stub.py`.
- Verification: `python tests/eval/run_stub.py` => `ok:10`.
- Verification: `git diff --check` passed.
