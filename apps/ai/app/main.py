from contextlib import asynccontextmanager

from fastapi import FastAPI

from app.api.health import router as health_router
from app.api.v1.reindex import router as reindex_router
from app.instrument import init_instrumentation


@asynccontextmanager
async def lifespan(_: FastAPI):
    init_instrumentation()
    yield


app = FastAPI(title="omni-ai", version="0.1.0", lifespan=lifespan)
app.include_router(health_router)
app.include_router(reindex_router)
