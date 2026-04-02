from fastapi import APIRouter, HTTPException
from database import supabase

router = APIRouter()

@router.post("/users/{user_id}/holdings/seed")
async def seed_holdings(user_id: str):
    """Temporary endpoint — seeds your real holdings for testing."""
    # Verify user exists
    user = supabase.table("users").select("*").eq("id", user_id).execute()
    if not user.data:
        raise HTTPException(status_code=404, detail="User not found")

    # Clear old holdings
    supabase.table("holdings").delete().eq("user_id", user_id).execute()

    # Your actual positions
    holdings = [
        {"user_id": user_id, "symbol": "NVDA", "name": "NVIDIA Corporation", "quantity": 0, "currency": "CAD"},
        {"user_id": user_id, "symbol": "PLTR", "name": "Palantir Technologies", "quantity": 0, "currency": "CAD"},
        {"user_id": user_id, "symbol": "VFV.TO", "name": "Vanguard S&P 500 Index ETF", "quantity": 0, "currency": "CAD"},
        {"user_id": user_id, "symbol": "ZEB.TO", "name": "BMO Equal Weight Banks Index ETF", "quantity": 0, "currency": "CAD"},
    ]

    result = supabase.table("holdings").insert(holdings).execute()
    return {"holdings_count": len(result.data), "holdings": result.data}

@router.get("/users/{user_id}/holdings")
async def get_holdings(user_id: str):
    result = supabase.table("holdings").select("*").eq("user_id", user_id).execute()
    return {"holdings": result.data}