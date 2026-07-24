import hmac
from typing import Any
from uuid import UUID

from fastapi import APIRouter, Header, HTTPException
from pydantic import BaseModel, ConfigDict, Field

from app.config import settings

router = APIRouter(prefix="/internal/v1")


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
        "disclaimer": "Advisor chỉ tư vấn; không auto-post, không mua ads, không gửi Meta.",
        "promptVersion": "advisor.v1",
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
