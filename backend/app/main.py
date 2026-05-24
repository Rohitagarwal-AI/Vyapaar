from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.database import Base, SessionLocal, engine
from app.routers import ai, automation, credits, customers, dashboard, inventory, reports, sales
from app.seed import backfill_payment_history, seed_database

app = FastAPI(
    title="Vyapaar API",
    description="Smart retail automation platform for small businesses.",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def on_startup() -> None:
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        seed_database(db)
        backfill_payment_history(db)
    finally:
        db.close()


@app.get("/")
def root() -> dict:
    return {"name": settings.app_name, "status": "ready", "docs": "/docs"}


app.include_router(dashboard.router, prefix=settings.api_prefix)
app.include_router(automation.router, prefix=settings.api_prefix)
app.include_router(customers.router, prefix=settings.api_prefix)
app.include_router(credits.router, prefix=settings.api_prefix)
app.include_router(inventory.router, prefix=settings.api_prefix)
app.include_router(sales.router, prefix=settings.api_prefix)
app.include_router(ai.router, prefix=settings.api_prefix)
app.include_router(reports.router, prefix=settings.api_prefix)
