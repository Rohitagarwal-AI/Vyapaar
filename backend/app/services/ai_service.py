from __future__ import annotations

import json
from datetime import date
from typing import Optional

import httpx

from app.core.config import settings
from app.services.analytics import heuristic_risk_score


REMINDER_PROMPT = """You are Vyapaar, an AI assistant for Indian small retailers.
Write one WhatsApp payment reminder.
Rules:
- Keep it short, respectful, and practical.
- Do not threaten the customer.
- Mention customer name, amount, product, due date, and overdue days if overdue.
- Tone: {tone}
- Language: {language}

Customer: {customer_name}
Amount due: Rs {amount}
Product/Invoice: {product}
Due date: {due_date}
Days overdue: {days_overdue}
"""

RISK_PROMPT = """You are Vyapaar, a business credit risk assistant for shopkeepers.
Analyze the customer risk as Low, Medium, or High.
Return concise JSON with keys: risk_level, score, reason, recommended_action.

Customer: {customer_name}
Amount due: Rs {amount_due}
Overdue days: {overdue_days}
Reminder count: {reminder_count}
Notes: {notes}
"""

BUSINESS_ASSISTANT_PROMPT = """You are Vyapaar, an AI business automation assistant for small retailers.
Answer the shopkeeper's question using only the provided business data.
Be specific, action-oriented, and concise. Use rupee amounts where useful.

Question:
{question}

Business data JSON:
{business_data}
"""


class AIService:
    def __init__(self) -> None:
        self.provider = settings.ai_provider.lower().strip()

    async def _complete(self, prompt: str) -> Optional[str]:
        if self.provider == "openai" and settings.openai_api_key:
            return await self._complete_openai(prompt)
        if self.provider == "gemini" and settings.gemini_api_key:
            return await self._complete_gemini(prompt)
        return None

    async def _complete_openai(self, prompt: str) -> str:
        headers = {
            "Authorization": f"Bearer {settings.openai_api_key}",
            "Content-Type": "application/json",
        }
        payload = {"model": settings.openai_model, "input": prompt}
        async with httpx.AsyncClient(timeout=30) as client:
            response = await client.post(
                "https://api.openai.com/v1/responses", headers=headers, json=payload
            )
            response.raise_for_status()
            data = response.json()

        if isinstance(data.get("output_text"), str):
            return data["output_text"].strip()

        parts: list[str] = []
        for item in data.get("output", []):
            for content in item.get("content", []):
                text = content.get("text")
                if text:
                    parts.append(text)
        return "\n".join(parts).strip()

    async def _complete_gemini(self, prompt: str) -> str:
        url = (
            "https://generativelanguage.googleapis.com/v1beta/models/"
            f"{settings.gemini_model}:generateContent?key={settings.gemini_api_key}"
        )
        payload = {"contents": [{"parts": [{"text": prompt}]}]}
        async with httpx.AsyncClient(timeout=30) as client:
            response = await client.post(url, json=payload)
            response.raise_for_status()
            data = response.json()

        candidates = data.get("candidates", [])
        if not candidates:
            return ""
        parts = candidates[0].get("content", {}).get("parts", [])
        return "\n".join(part.get("text", "") for part in parts).strip()

    async def generate_reminder(
        self,
        customer_name: str,
        amount: float,
        product: str,
        due_date: date,
        days_overdue: int,
        tone: str,
        language: str,
    ) -> dict:
        prompt = REMINDER_PROMPT.format(
            customer_name=customer_name,
            amount=amount,
            product=product,
            due_date=due_date,
            days_overdue=days_overdue,
            tone=tone,
            language=language,
        )
        ai_text = await self._complete(prompt)
        if ai_text:
            return {"message": ai_text, "provider": self.provider}

        if language == "Hindi":
            message = (
                f"Namaste {customer_name} ji, aapka Rs {amount:.0f} ka payment "
                f"{product} ke liye {due_date} ko due tha. Kripya suvidha anusaar "
                "aaj payment kar dein. Dhanyavaad."
            )
        elif language == "Hinglish":
            message = (
                f"Hi {customer_name} ji, Rs {amount:.0f} ka payment {product} ke liye "
                f"{due_date} se pending hai. Please aaj convenient time par payment kar dein."
            )
        else:
            overdue_note = f" It is {days_overdue} day(s) overdue." if days_overdue else ""
            message = (
                f"Hello {customer_name}, this is a reminder for Rs {amount:.0f} pending "
                f"for {product}, due on {due_date}.{overdue_note} Please make the payment "
                "at your convenience. Thank you."
            )

        if tone == "strong":
            message += " We request you to clear this before taking further credit."
        elif tone == "friendly":
            message = message.replace("Hello", "Hi")

        return {"message": message, "provider": "local"}

    async def analyze_risk(
        self,
        customer_name: str,
        amount_due: float,
        overdue_days: int,
        reminder_count: int,
        notes: Optional[str],
    ) -> dict:
        prompt = RISK_PROMPT.format(
            customer_name=customer_name,
            amount_due=amount_due,
            overdue_days=overdue_days,
            reminder_count=reminder_count,
            notes=notes or "No notes",
        )
        ai_text = await self._complete(prompt)
        if ai_text:
            try:
                start = ai_text.find("{")
                end = ai_text.rfind("}") + 1
                parsed = json.loads(ai_text[start:end])
                parsed["score"] = int(parsed.get("score", 0))
                return parsed
            except (ValueError, TypeError, json.JSONDecodeError):
                pass

        level, score, reason, action = heuristic_risk_score(
            amount_due, overdue_days, reminder_count, notes
        )
        return {
            "risk_level": level,
            "score": score,
            "reason": reason,
            "recommended_action": action,
        }

    async def answer_business_question(self, question: str, business_data: dict) -> dict:
        prompt = BUSINESS_ASSISTANT_PROMPT.format(
            question=question,
            business_data=json.dumps(business_data, indent=2, ensure_ascii=False),
        )
        ai_text = await self._complete(prompt)
        if ai_text:
            return {"answer": ai_text, "provider": self.provider}

        dashboard = business_data["dashboard"]
        overdue = [item for item in business_data["credits"] if item["status"] == "overdue"]
        low_stock = [
            item
            for item in business_data["inventory"]
            if item["stock"] <= item["minimum_stock"]
        ]

        if "follow" in question.lower() or "customer" in question.lower():
            if not overdue:
                answer = "No overdue customers today. Follow up with the largest pending balances first."
            else:
                names = ", ".join(item["customer"] for item in overdue[:5])
                answer = f"Follow up with these overdue customers today: {names}."
        elif "reorder" in question.lower() or "stock" in question.lower():
            if not low_stock:
                answer = "No product is below minimum stock. Review fast-moving items before the weekend."
            else:
                names = ", ".join(item["name"] for item in low_stock[:5])
                answer = f"Reorder these products first: {names}."
        else:
            answer = (
                f"Today's plan: collect Rs {dashboard['total_pending_credit']:.0f} pending credit, "
                f"follow up with {dashboard['overdue_customers']} overdue customer(s), "
                f"and reorder {dashboard['low_stock_products']} low-stock product(s)."
            )
        return {"answer": answer, "provider": "local"}
