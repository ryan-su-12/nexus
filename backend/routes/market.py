from fastapi import APIRouter, HTTPException
from datetime import datetime, timedelta
import finnhub
import requests
from config import settings
from database import supabase

router = APIRouter()

YAHOO_HEADERS = {"User-Agent": "Mozilla/5.0"}

@router.get("/users/{user_id}/market")
async def get_market_data(user_id: str):
    result = supabase.table("holdings").select("symbol").eq("user_id", user_id).execute()
    if not result.data:
        raise HTTPException(status_code=400, detail="No holdings found")

    symbols = [h["symbol"] for h in result.data]
    finnhub_client = finnhub.Client(api_key=settings.finnhub_api_key)

    # Fetch prices — try Finnhub first, fall back to Yahoo for Canadian stocks
    performances = []
    for symbol in symbols:
        perf = _fetch_finnhub_quote(finnhub_client, symbol)
        if not perf:
            perf = _fetch_yahoo_quote(symbol)
        if perf:
            performances.append(perf)

    # Fetch news — Finnhub for US, Yahoo for any that Finnhub misses
    today = datetime.now().strftime("%Y-%m-%d")
    yesterday = (datetime.now() - timedelta(days=1)).strftime("%Y-%m-%d")

    news = []
    seen = set()
    for symbol in symbols:
        articles = _fetch_finnhub_news(finnhub_client, symbol, yesterday, today)
        if not articles:
            articles = _fetch_yahoo_news(symbol)
        for a in articles:
            if a["headline"] not in seen:
                seen.add(a["headline"])
                news.append(a)

    return {"performances": performances, "news": news}


def _fetch_finnhub_quote(client, symbol: str) -> dict | None:
    try:
        quote = client.quote(symbol)
        if quote and quote.get("c") and quote["c"] > 0:
            return {
                "symbol": symbol,
                "current_price": quote["c"],
                "previous_close": quote["pc"],
                "daily_change": round(quote["c"] - quote["pc"], 2),
                "daily_change_pct": round(quote["dp"], 2),
            }
    except Exception:
        pass
    return None


def _fetch_yahoo_quote(symbol: str) -> dict | None:
    try:
        url = f"https://query1.finance.yahoo.com/v8/finance/chart/{symbol}?range=2d&interval=1d"
        r = requests.get(url, headers=YAHOO_HEADERS, timeout=10)
        if r.status_code != 200:
            return None
        meta = r.json()["chart"]["result"][0]["meta"]
        current = meta.get("regularMarketPrice")
        previous = meta.get("chartPreviousClose")
        if current and previous:
            change = round(current - previous, 2)
            change_pct = round((change / previous) * 100, 2)
            return {
                "symbol": symbol,
                "current_price": round(current, 2),
                "previous_close": round(previous, 2),
                "daily_change": change,
                "daily_change_pct": change_pct,
            }
    except Exception:
        pass
    return None


def _fetch_finnhub_news(client, symbol: str, from_date: str, to_date: str) -> list:
    try:
        articles = client.company_news(symbol, _from=from_date, to=to_date)
        return [
            {
                "headline": a["headline"],
                "summary": a.get("summary", ""),
                "source": a.get("source", ""),
                "url": a.get("url", ""),
                "symbol": symbol,
            }
            for a in articles[:3]
        ]
    except Exception:
        return []


def _fetch_yahoo_news(symbol: str) -> list:
    try:
        url = f"https://query1.finance.yahoo.com/v8/finance/chart/{symbol}?range=2d&interval=1d"
        r = requests.get(url, headers=YAHOO_HEADERS, timeout=10)
        # Yahoo chart endpoint doesn't return news, so we use a different endpoint
        news_url = f"https://query1.finance.yahoo.com/v1/finance/search?q={symbol}&newsCount=3"
        r = requests.get(news_url, headers=YAHOO_HEADERS, timeout=10)
        if r.status_code != 200:
            return []
        data = r.json()
        return [
            {
                "headline": a.get("title", ""),
                "summary": "",
                "source": a.get("publisher", ""),
                "url": a.get("link", ""),
                "symbol": symbol,
            }
            for a in data.get("news", [])[:3]
            if a.get("title")
        ]
    except Exception:
        return []
