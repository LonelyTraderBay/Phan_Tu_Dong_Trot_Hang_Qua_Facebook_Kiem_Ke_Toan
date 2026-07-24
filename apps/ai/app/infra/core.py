import json
from urllib import error, request

from app.config import settings


class CoreKnowledgeClient:
    def __init__(
        self,
        base_url: str | None = None,
        service_key: str | None = None,
        opener=request.urlopen,
    ):
        self.base_url = (base_url or settings.core_base_url).rstrip("/")
        self.service_key = service_key or settings.service_m2m_key
        self.opener = opener

    def replace_chunks(
        self,
        *,
        org_id: str,
        source_type: str,
        source_id: str,
        chunks: list[dict],
    ) -> dict:
        req = request.Request(
            f"{self.base_url}/internal/v1/knowledge/chunks",
            data=json.dumps(
                {
                    "orgId": org_id,
                    "sourceType": source_type,
                    "sourceId": source_id,
                    "chunks": chunks,
                }
            ).encode("utf-8"),
            headers={
                "Content-Type": "application/json",
                "X-Service-Key": self.service_key,
            },
            method="POST",
        )

        try:
            with self.opener(req, timeout=30) as response:
                return json.loads(response.read().decode("utf-8"))
        except error.HTTPError as exc:
            detail = exc.read().decode("utf-8", errors="replace")
            raise RuntimeError(f"Core knowledge ingest failed: {exc.code} {detail}") from exc
