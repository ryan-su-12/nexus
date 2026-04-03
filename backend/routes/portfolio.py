from fastapi import APIRouter
from database import supabase

router = APIRouter()

@router.get("/users/{user_id}/holdings")
async def get_holdings(user_id: str):
    result = supabase.table("holdings").select("*").eq("user_id", user_id).execute()
    return {"holdings": result.data}
