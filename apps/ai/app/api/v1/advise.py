import hmac
import json
import logging
from typing import Any
from uuid import UUID

from fastapi import APIRouter, Header, HTTPException
from pydantic import BaseModel, ConfigDict, Field

from app.config import settings
from app.infra.llm.gemini import GeminiLlmProvider

router = APIRouter(prefix="/internal/v1")
logger = logging.getLogger(__name__)

PROMPT_VERSION = "advisor.v1"
DISCLAIMER = (
    "Advisor chỉ tư vấn; không auto-post, không mua ads, không gửi Meta. "
    "Người bán phải duyệt nội dung, giá và thời điểm trước khi thực hiện."
)


class AdviseRequest(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    org_id: UUID = Field(alias="orgId")
    goal: str | None = Field(default=None, max_length=500)
    catalog_aggregates: dict[str, Any] = Field(
        default_factory=dict,
        alias="catalogAggregates",
    )
    sales_aggregates: dict[str, Any] = Field(
        default_factory=dict,
        alias="salesAggregates",
    )


def _advisor_model(allowlist: str) -> str:
    models = [item.strip() for item in allowlist.split(",") if item.strip()]
    if "gemini-2.0-flash" in models:
        return "gemini-2.0-flash"
    for model in models:
        if model != "advisor-stub":
            return model
    raise RuntimeError("AI_MODEL_ALLOWLIST must include a non-stub model for Gemini advisor")


def _build_advisor_messages(
    goal: str,
    catalog_aggregates: dict[str, Any],
    sales_aggregates: dict[str, Any],
) -> list[dict[str, str]]:
    prompt = "\n".join(
        [
            "Bạn là cố vấn kinh doanh cho người bán hàng trên Facebook tại Việt Nam.",
            "Chỉ đưa ra gợi ý tư vấn; KHÔNG tự đăng bài Meta, KHÔNG mua quảng cáo, KHÔNG gửi nội dung lên Meta.",
            "Chỉ dựa trên số liệu tổng hợp được cung cấp; không bịa số liệu.",
            "Giọng văn: chuyên nghiệp, thực tế, phù hợp người bán Việt Nam.",
            "Nhắc người bán phải tự duyệt nội dung, giá và thời điểm trước khi thực hiện.",
            "",
            f"Mục tiêu: {goal}",
            "",
            "Tổng hợp catalog:",
            json.dumps(catalog_aggregates, ensure_ascii=False, indent=2),
            "",
            "Tổng hợp bán hàng:",
            json.dumps(sales_aggregates, ensure_ascii=False, indent=2),
            "",
            "Trả lời bằng tiếng Việt, dạng gợi ý có bullet, ngắn gọn và hành động được.",
        ],
    )
    return [{"role": "user", "content": prompt}]


def _stub_response(
    goal: str,
    catalog_note: str,
    sales_note: str,
) -> dict[str, Any]:
    suggestions = "\n".join(
        [
            f"Mục tiêu: {goal}.",
            "- Ưu tiên 3 SKU còn tồn và biên lợi nhuận tốt; kiểm tra tồn kho trước khi chốt đơn.",
            "- Tạo 1 bài nhắc lại lợi ích chính và 1 kịch bản inbox cho khách đã hỏi nhưng chưa mua.",
            "- Theo dõi doanh thu theo nguồn attribution; không tự mua ads và không tự đăng Meta.",
            "Người bán phải duyệt nội dung, giá và thời điểm trước khi thực hiện.",
        ],
    )

    return {
        "suggestionsText": suggestions,
        "disclaimer": DISCLAIMER,
        "promptVersion": PROMPT_VERSION,
        "model": "advisor-stub",
        "tokens": {"input": 0, "output": 0, "total": 0},
        "toolsUsed": [
            {
                "kind": "advisor",
                "mode": "stub",
                "catalogAggregate": catalog_note,
                "salesAggregate": sales_note,
            },
        ],
        "citations": [
            {"source": "catalog_aggregates_stub"},
            {"source": "sales_aggregates_stub"},
        ],
    }


def _gemini_response(
    goal: str,
    catalog_aggregates: dict[str, Any],
    sales_aggregates: dict[str, Any],
) -> dict[str, Any] | None:
    try:
        provider = GeminiLlmProvider()
        model = _advisor_model(settings.ai_model_allowlist)
        completion = provider.complete(
            model=model,
            messages=_build_advisor_messages(goal, catalog_aggregates, sales_aggregates),
        )
    except Exception:
        logger.exception("Gemini advisor failed; falling back to stub")
        return None

    return {
        "suggestionsText": completion.text,
        "disclaimer": DISCLAIMER,
        "promptVersion": PROMPT_VERSION,
        "model": completion.model,
        "tokens": {
            "input": completion.prompt_tokens,
            "output": completion.completion_tokens,
            "total": completion.total_tokens,
        },
        "toolsUsed": [
            {
                "kind": "advisor",
                "mode": "gemini",
                "catalogAggregate": catalog_aggregates.get("note") or "catalog aggregates",
                "salesAggregate": sales_aggregates.get("note") or "sales aggregates",
            },
        ],
        "citations": [
            {"source": "catalog_aggregates"},
            {"source": "sales_aggregates"},
        ],
    }


@router.post("/ai/advise")
def advise(
    body: AdviseRequest,
    x_service_key: str | None = Header(default=None),
):
    if not hmac.compare_digest(x_service_key or "", settings.service_m2m_key):
        raise HTTPException(status_code=401, detail="invalid service key")

    goal = (body.goal or "Tăng doanh thu tuần này").strip()
    catalog_note = body.catalog_aggregates.get("note") or "catalog aggregate stub"
    sales_note = body.sales_aggregates.get("note") or "sales aggregate stub"

    if settings.gemini_api_key:
        gemini_result = _gemini_response(goal, body.catalog_aggregates, body.sales_aggregates)
        if gemini_result is not None:
            return gemini_result

    return _stub_response(goal, catalog_note, sales_note)
