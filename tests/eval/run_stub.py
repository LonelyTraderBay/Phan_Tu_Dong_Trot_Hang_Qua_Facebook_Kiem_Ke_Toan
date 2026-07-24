from pathlib import Path

cases = list(Path(__file__).parent.joinpath("adversarial").glob("*.md"))
assert len(cases) >= 10, len(cases)
print(f"ok:{len(cases)}")
