import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import get_settings
from app.db import init_db
from app.routers import audiences, personas, products, simulations, surveys
from app.services.phoenix import init_tracing

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s: %(message)s")
log = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(_: FastAPI):
    init_tracing()
    init_db()
    log.info("Simulation Sentinels API ready")
    yield


def create_app() -> FastAPI:
    settings = get_settings()
    app = FastAPI(
        title="Simulation Sentinels API",
        description="Customer digital-twin simulation platform for insurance products",
        version="0.1.0",
        lifespan=lifespan,
    )
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins_list,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    app.include_router(personas.router)
    app.include_router(audiences.router)
    app.include_router(products.router)
    app.include_router(surveys.router)
    app.include_router(simulations.router)

    @app.get("/health")
    def health():
        return {"status": "ok", "service": "simulation-sentinels"}

    return app


app = create_app()
