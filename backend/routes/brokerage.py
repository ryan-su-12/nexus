from fastapi import APIRouter, HTTPException
from snaptrade_client import SnapTrade
from config import settings
from database import supabase

router = APIRouter()

snaptrade = SnapTrade(
    consumer_key=settings.snaptrade_consumer_key,
    client_id=settings.snaptrade_client_id,
)


def _get_user_secret(user_id: str) -> str:
    """Get stored SnapTrade user secret, or register and store a new one."""
    # Check if we already have a secret stored
    result = supabase.table("snaptrade_users").select("user_secret").eq("user_id", user_id).execute()
    if result.data:
        return result.data[0]["user_secret"]

    # Register with SnapTrade and store the secret
    try:
        response = snaptrade.authentication.register_snap_trade_user(
            user_id=user_id,
        )
        user_secret = response.body["userSecret"]
    except Exception as e:
        # If user already exists in SnapTrade but we lost the secret,
        # delete and re-register to get a fresh secret
        if "already exist" in str(e).lower() or "1010" in str(e):
            try:
                snaptrade.authentication.delete_snap_trade_user(user_id=user_id)
            except Exception:
                pass
            response = snaptrade.authentication.register_snap_trade_user(
                user_id=user_id,
            )
            user_secret = response.body["userSecret"]
        else:
            raise

    supabase.table("snaptrade_users").upsert({
        "user_id": user_id,
        "user_secret": user_secret,
    }).execute()

    return user_secret


@router.post("/users/{user_id}/brokerage/connect")
async def get_connect_url(user_id: str):
    """Get a SnapTrade Connect URL to link a brokerage account."""
    try:
        user_secret = _get_user_secret(user_id)

        response = snaptrade.authentication.login_snap_trade_user(
            user_id=user_id,
            user_secret=user_secret,
        )
        redirect_uri = response.body.get("redirectURI") or response.body.get("loginRedirectURI")
        if not redirect_uri:
            raise HTTPException(status_code=500, detail="No redirect URI returned")
        return {"connect_url": redirect_uri}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/users/{user_id}/brokerage/accounts")
async def get_accounts(user_id: str):
    """List connected brokerage accounts."""
    try:
        user_secret = _get_user_secret(user_id)

        response = snaptrade.account_information.list_user_accounts(
            user_id=user_id,
            user_secret=user_secret,
        )
        return {"accounts": response.body}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/users/{user_id}/brokerage/holdings")
async def get_brokerage_holdings(user_id: str):
    """Fetch real holdings from connected brokerage and sync to database."""
    try:
        user_secret = _get_user_secret(user_id)

        response = snaptrade.account_information.get_all_user_holdings(
            user_id=user_id,
            user_secret=user_secret,
        )

        all_holdings = []
        for account in response.body:
            positions = account.get("positions", [])
            for pos in positions:
                symbol_info = pos.get("symbol", {})
                symbol_name = symbol_info.get("symbol", {}).get("symbol", "")
                description = symbol_info.get("symbol", {}).get("description", "")
                units = pos.get("units", 0)
                currency = symbol_info.get("symbol", {}).get("currency", {}).get("code", "CAD")

                if symbol_name:
                    all_holdings.append({
                        "symbol": symbol_name,
                        "name": description,
                        "quantity": float(units) if units else 0,
                        "currency": currency,
                    })

        # Sync to database — clear old holdings, insert new ones
        supabase.table("holdings").delete().eq("user_id", user_id).execute()

        if all_holdings:
            rows = [
                {"user_id": user_id, **h}
                for h in all_holdings
            ]
            supabase.table("holdings").insert(rows).execute()

        return {"holdings_count": len(all_holdings), "holdings": all_holdings}

    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
