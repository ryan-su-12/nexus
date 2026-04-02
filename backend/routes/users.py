
from fastapi import APIRouter, HTTPException
from database import supabase
from models import UserCreate

router = APIRouter()

@router.post("/users")
async def create_user(body: UserCreate):
    result = supabase.table("users").insert({"email": body.email}).execute()
    if not result.data:
        raise HTTPException(status_code=400, detail="Failed to create user")
    return {"user": result.data[0]}

@router.get("/users/{user_id}")
async def get_user(user_id: str):
    result = supabase.table("users").select("*").eq("id", user_id).execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="User not found")
    return {"user": result.data[0]}