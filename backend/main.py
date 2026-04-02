from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routes.users import router as users_router
from routes.portfolio import router as portfolio_router
from routes.market import router as market_router
from routes.analysis import router as analysis_router
from routes.brokerage import router as brokerage_router

app = FastAPI(title="Axon", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(users_router)
app.include_router(portfolio_router)
app.include_router(market_router)
app.include_router(analysis_router)
app.include_router(brokerage_router)

@app.get("/health")
async def health():
    return {"status": "ok", "service": "axon"}