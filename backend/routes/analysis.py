from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import anthropic
import json
from config import settings
from database import supabase
from routes.market import get_market_data

router = APIRouter()

SUMMARY_PROMPT = """You are Axon, a portfolio intelligence assistant. You provide clear,
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

CHAT_PROMPT = """You are Axon, a portfolio intelligence chatbot. You help users understand
their investment portfolio by answering questions about their holdings, performance,
risk, sector exposure, and market trends.

You have access to the user's current portfolio data which is provided as context.
Use this data to give specific, personalized answers.

Rules:
- Be conversational but precise — use actual numbers from their portfolio
- If asked about something not in the data, say so honestly
- Don't give specific investment advice or buy/sell recommendations
- Keep responses concise and focused
- Use dollar amounts and percentages when relevant"""

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
            system=SUMMARY_PROMPT,
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


class ChatRequest(BaseModel):
    message: str


@router.post("/users/{user_id}/chat")
async def chat(user_id: str, body: ChatRequest):
    try:
        market = await get_market_data(user_id)
        context = json.dumps(market, indent=2)

        client = anthropic.Anthropic(api_key=settings.anthropic_api_key)
        response = client.messages.create(
            model="claude-sonnet-4-20250514",
            max_tokens=1024,
            system=f"{CHAT_PROMPT}\n\nHere is the user's current portfolio data:\n{context}",
            messages=[{
                "role": "user",
                "content": body.message,
            }],
        )

        return {"reply": response.content[0].text}

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))