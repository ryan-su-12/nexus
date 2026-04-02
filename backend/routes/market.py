from fastapi import APIRouter, HTTPException
from datetime import datetime, timedelta
import finnhub
from config import settings
from database import supabase

router = APIRouter()

@router.get("/users/{user_id}/market")
async def get_market_data(user_id: str):
    result = supabase.table("holdings").select("symbol").eq("user_id", user_id).execute()
    if not result.data:
        raise HTTPException(status_code=400, detail="No holdings found")

    symbols = [h["symbol"] for h in result.data]
    client = finnhub.Client(api_key=settings.finnhub_api_key)

    # Fetch prices from Finnhub
    performances = []
    for symbol in symbols:
        try:
            quote = client.quote(symbol)
            if quote and quote.get("c"):
                performances.append({
                    "symbol": symbol,
                    "current_price": quote["c"],
                    "previous_close": quote["pc"],
                    "daily_change": round(quote["c"] - quote["pc"], 2),
                    "daily_change_pct": round(quote["dp"], 2),
                })
        except Exception:
            continue

    # Fetch news from Finnhub
    today = datetime.now().strftime("%Y-%m-%d")
    yesterday = (datetime.now() - timedelta(days=1)).strftime("%Y-%m-%d")

    news = []
    seen = set()
    for symbol in symbols:
        try:
            articles = client.company_news(symbol, _from=yesterday, to=today)
            for a in articles[:3]:
                if a["headline"] not in seen:
                    seen.add(a["headline"])
                    news.append({
                        "headline": a["headline"],
                        "summary": a.get("summary", ""),
                        "source": a.get("source", ""),
                        "url": a.get("url", ""),
                        "symbol": symbol,
                    })
        except Exception:
            continue

    return {"performances": performances, "news": news}