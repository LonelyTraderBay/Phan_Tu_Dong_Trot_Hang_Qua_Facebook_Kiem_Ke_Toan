from fastapi.testclient import TestClient

from app.api.v1 import process_message as process_message_api
from app.config import settings
from app.domain.orchestrator import ProcessMessageOrchestrator, PromptTemplate
from app.infra.llm.provider import LlmCompletion
from app.main import app

ORG_ID = "11111111-1111-1111-1111-111111111111"

client = TestClient(app)


class FakeEmbeddings:
    def __init__(self):
        self.texts: list[str] = []

    def embed_texts(self, texts: list[str]) -> list[list[float]]:
        self.texts = texts
        return [[0.02] * 768 for _ in texts]


class FakeRetriever:
    def __init__(self, chunks: list[dict]):
        self.chunks = chunks
        self.calls: list[dict] = []

    def retrieve_chunks(self, **kwargs) -> list[dict]:
        self.calls.append(kwargs)
        return self.chunks


DEFAULT_LLM_JSON = (
    '{"replyText":"Ao thun nay co mau den [1].",'
    '"citedIndices":[1],"escalate":false}'
)


class FakeLlm:
    def __init__(self, text: str = DEFAULT_LLM_JSON):
        self.calls: list[dict] = []
        self.text = text

    def complete(self, **kwargs) -> LlmCompletion:
        self.calls.append(kwargs)
        return LlmCompletion(
            text=self.text,
            model=kwargs["model"],
            prompt_tokens=10,
            completion_tokens=7,
            total_tokens=17,
        )


def make_orchestrator(chunks: list[dict], *, llm_text: str = DEFAULT_LLM_JSON):
    embeddings = FakeEmbeddings()
    retriever = FakeRetriever(chunks)
    llm = FakeLlm(llm_text)
    orchestrator = ProcessMessageOrchestrator(
        embedding_provider=embeddings,
        retriever=retriever,
        llm_provider=llm,
        prompt=PromptTemplate(version="test_prompt_v1", text="Only use context."),
    )
    return orchestrator, embeddings, retriever, llm


def test_process_message_escalates_without_context_and_skips_llm():
    orchestrator, _, retriever, llm = make_orchestrator([])

    result = orchestrator.process_message(
        org_id=ORG_ID,
        message="Gia san pham la bao nhieu?",
        model="gemini-2.0-flash",
    )

    assert retriever.calls[0]["org_id"] == ORG_ID
    assert llm.calls == []
    assert result["replyText"].startswith("Minh chua co du thong tin")
    assert result["citations"] == []
    assert result["toolsUsed"] == []
    assert result["tokens"] == {"prompt": 0, "completion": 0, "total": 0}
    assert result["escalate"] is True


def test_process_message_escalates_low_relevance_chunks_and_skips_llm():
    orchestrator, _, _, llm = make_orchestrator(
        [
            {
                "sourceType": "product",
                "sourceId": "22222222-2222-2222-2222-222222222222",
                "chunkIndex": 0,
                "content": "Quan jeans co mau xanh.",
                "distance": 0.80,
            }
        ]
    )

    result = orchestrator.process_message(
        org_id=ORG_ID,
        message="Ao nay co mau den khong?",
        model="gemini-2.0-flash",
    )

    assert llm.calls == []
    assert result["citations"] == []
    assert result["tokens"] == {"prompt": 0, "completion": 0, "total": 0}
    assert result["escalate"] is True


def test_process_message_answers_with_subset_citations_from_good_chunks():
    orchestrator, embeddings, retriever, llm = make_orchestrator(
        [
            {
                "sourceType": "product",
                "sourceId": "22222222-2222-2222-2222-222222222222",
                "chunkIndex": 0,
                "content": "Ao thun co co tron.",
                "score": 0.92,
            },
            {
                "sourceType": "product",
                "sourceId": "33333333-3333-3333-3333-333333333333",
                "chunkIndex": 1,
                "content": "Ao thun co mau den.",
                "score": 0.91,
            }
        ],
        llm_text=(
            '{"replyText":"Ao thun nay co mau den [2].",'
            '"citedIndices":[2,99],"escalate":false}'
        ),
    )

    result = orchestrator.process_message(
        org_id=ORG_ID,
        message="Ao nay co mau den khong?",
        top_k=2,
        model="gemini-2.0-flash",
    )

    assert embeddings.texts == ["Ao nay co mau den khong?"]
    assert retriever.calls[0]["org_id"] == ORG_ID
    assert retriever.calls[0]["top_k"] == 2
    assert llm.calls[0]["model"] == "gemini-2.0-flash"
    assert "[1] Ao thun co co tron." in llm.calls[0]["messages"][0]["content"]
    assert "[2] Ao thun co mau den." in llm.calls[0]["messages"][0]["content"]
    assert result == {
        "replyText": "Ao thun nay co mau den [2].",
        "citations": [
            {
                "index": 2,
                "sourceType": "product",
                "sourceId": "33333333-3333-3333-3333-333333333333",
                "chunkIndex": 1,
                "score": 0.91,
            }
        ],
        "toolsUsed": [],
        "promptVersion": "test_prompt_v1",
        "model": "gemini-2.0-flash",
        "tokens": {"prompt": 10, "completion": 7, "total": 17},
        "escalate": False,
    }


def test_process_message_honors_model_escalate_flag():
    orchestrator, _, _, llm = make_orchestrator(
        [
            {
                "sourceType": "product",
                "sourceId": "22222222-2222-2222-2222-222222222222",
                "chunkIndex": 0,
                "content": "Ao thun co mau den.",
                "score": 0.92,
            }
        ],
        llm_text=(
            '{"replyText":"Minh se chuyen doi ngu ho tro kiem tra them.",'
            '"citedIndices":[1],"escalate":true}'
        ),
    )

    result = orchestrator.process_message(
        org_id=ORG_ID,
        message="Ao nay co mau den khong?",
        model="gemini-2.0-flash",
    )

    assert llm.calls[0]["model"] == "gemini-2.0-flash"
    assert result["replyText"] == "Minh se chuyen doi ngu ho tro kiem tra them."
    assert result["citations"] == []
    assert result["tokens"] == {"prompt": 10, "completion": 7, "total": 17}
    assert result["escalate"] is True


def test_process_message_escalates_factual_answer_without_citations():
    orchestrator, _, _, llm = make_orchestrator(
        [
            {
                "sourceType": "product",
                "sourceId": "22222222-2222-2222-2222-222222222222",
                "chunkIndex": 0,
                "content": "Ao thun co mau den.",
                "score": 0.92,
            }
        ],
        llm_text=(
            '{"replyText":"Ao thun nay co mau den.",'
            '"citedIndices":[],"escalate":false}'
        ),
    )

    result = orchestrator.process_message(
        org_id=ORG_ID,
        message="Ao nay co mau den khong?",
        model="gemini-2.0-flash",
    )

    assert llm.calls[0]["model"] == "gemini-2.0-flash"
    assert result["replyText"].startswith("Minh chua co du thong tin")
    assert result["citations"] == []
    assert result["escalate"] is True


def test_process_message_route_uses_service_key(monkeypatch):
    class FakeOrchestrator:
        def __init__(self):
            self.calls: list[dict] = []

        def process_message(self, **kwargs):
            self.calls.append(kwargs)
            return {
                "replyText": "ok",
                "citations": [],
                "toolsUsed": [],
                "promptVersion": "test",
                "model": "gemini-2.0-flash",
                "tokens": {"prompt": 1, "completion": 1, "total": 2},
                "escalate": False,
            }

    fake = FakeOrchestrator()
    monkeypatch.setattr(process_message_api, "orchestrator", fake)

    r = client.post(
        "/internal/v1/ai/process-message",
        headers={"x-service-key": settings.service_m2m_key},
        json={"orgId": ORG_ID, "message": "hello", "topK": 4},
    )

    assert r.status_code == 200
    assert r.json()["replyText"] == "ok"
    assert fake.calls[0] == {
        "org_id": ORG_ID,
        "message": "hello",
        "top_k": 4,
        "model": None,
    }


def test_process_message_route_rejects_wrong_service_key():
    r = client.post(
        "/internal/v1/ai/process-message",
        headers={"x-service-key": "wrong-key"},
        json={"orgId": ORG_ID, "message": "hello"},
    )

    assert r.status_code == 401
