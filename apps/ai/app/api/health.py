from fastapi import APIRouter, Header

router = APIRouter()


@router.get("/health")
def health(traceparent: str | None = Header(default=None)):
    body = {"status": "ok"}
    if traceparent:
        body["traceparent"] = traceparent
    return body
