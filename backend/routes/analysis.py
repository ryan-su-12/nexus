from fastapi import APIRouter, HTTPException
import anthropic
import json
from config import settings
from database import supabase
from routes.market import get_market_data

router = APIRouter()

SYSTEM_PROMPT = """You are Axon, a portfolio intelligence assistant. You provide clear,
concise daily summaries of a user's investment portfolio performance.

Your job is to:
1. Summarize how the portfolio performed today (total change, biggest movers)
2. Explain WHY — connect price movements to relevant news and market events
3. Highlight anything noteworthy (unusual volume, earnings, sector trends)
4. Keep it conversational but informative — like a smart friend who follows markets

Rules:
- Lead with the headline: overall portfolio direction and magnitude
- Break down by individual holdings, ordered by impact on the portfolio
- Connect each significant move to a news catalyst when possible
- If a stock moved but there's no clear news, say so honestly
- Keep the total summary under 300 words
- Use dollar amounts and percentages
- Don't give investment advice or recommendations"""

@router.get("/users/{user_id}/summary")
async def daily_summary(user_id: str):
    try:
        # Get market data (reuses Step 2)
        market = await get_market_data(user_id)

        if not market["performances"]:
            raise HTTPException(status_code=400, detail="No market data available")

        # Build context for Claude
        context = json.dumps(market, indent=2)

        # Call Claude
        client = anthropic.Anthropic(api_key=settings.anthropic_api_key)
        response = client.messages.create(
            model="claude-sonnet-4-20250514",
            max_tokens=1024,
            system=SYSTEM_PROMPT,
            messages=[{
                "role": "user",
                "content": f"Here is my portfolio and today's market data. Give me my daily summary.\n\n{context}"
            }]
        )

        summary = response.content[0].text
        return {"date": __import__("datetime").datetime.now().strftime("%Y-%m-%d"), "summary": summary}

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))