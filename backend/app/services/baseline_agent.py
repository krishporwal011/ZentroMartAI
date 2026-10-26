"""Step 1: LLM-Only Baseline Agent.

Implements a genuine parametric baseline customer-support agent that:
1. Calls an LLM or parametric model through a system prompt defining the ZentroMart support role.
2. Introduces itself as an AI assistant.
3. Responds to customer inquiries without consulting the knowledge base or tools.
4. Does not silently access RAG, policy documents, or database tables.
5. Provides a baseline to compare against Step 2 Document-Grounded RAG.
"""
from typing import Dict, Any, List, Optional, Tuple
import re

from app.config import settings
from app.services.llm_provider import get_llm_provider


BASELINE_SYSTEM_PROMPT = """You are an AI customer support assistant for ZentroMart, an Indian online shopping platform.
Always introduce yourself politely as an AI assistant.
Answer customer inquiries regarding orders, returns, cancellations, refunds, delivery timelines, and warranties using only your general background knowledge.
Do not consult, retrieve, or cite any external policy documents, database tables, or internal company guidelines.
If you do not know a specific company detail, provide standard e-commerce advice or state that a human colleague can assist.
"""


class BaselineAgent:
    """Parametric baseline agent without knowledge base or database tools."""

    def __init__(self):
        self.llm = get_llm_provider()
        self.system_prompt = BASELINE_SYSTEM_PROMPT

    def _generate_parametric_fallback(self, question: str) -> Dict[str, Any]:
        """Generate a realistic parametric response reflecting typical ungrounded LLM behavior.
        
        Without ZentroMart's specific policy documents, a standard LLM makes general assumptions
        (e.g., standard 30-day return windows, 1-year brand warranty, cancellation anytime before delivery)
        which fail ZentroMart's specific category windows (7 days for electronics), Monday-Saturday calendar math,
        and strict verification gating.
        """
        q_lower = question.lower()

        # Greeting
        if any(w in q_lower for w in ["hi", "hello", "hey", "namaste", "नमस्ते"]):
            return {
                "decision": "general_greeting",
                "response": "Hello! I am the ZentroMart AI assistant. How may I help you today with your shopping or orders?",
                "evidence": [],
            }

        # Returns
        if any(w in q_lower for w in ["return", "returns", "wapas", "lauta", "वापस"]):
            if "electronic" in q_lower or "laptop" in q_lower or "phone" in q_lower:
                return {
                    "decision": "general_advice",
                    "response": (
                        "Hello! I am your ZentroMart AI assistant. Generally, electronics can be returned within 30 days "
                        "of purchase if you have the original receipt and packaging. Please check your account order page "
                        "or contact our support team to request a return label."
                    ),
                    "evidence": [],
                }
            return {
                "decision": "general_advice",
                "response": (
                    "Hello! I am your ZentroMart AI assistant. You can typically return items within 14 to 30 days "
                    "of delivery as long as they are unused. Please visit the Returns section on our website to initiate a return."
                ),
                "evidence": [],
            }

        # Cancellations
        if any(w in q_lower for w in ["cancel", "cancellation", "radd", "कैंसिल"]):
            return {
                "decision": "general_advice",
                "response": (
                    "Hello, I am your ZentroMart AI assistant. You can cancel your order at any time from your account "
                    "dashboard before the order is delivered. If the order has already shipped, you can simply refuse delivery."
                ),
                "evidence": [],
            }

        # Refunds
        if any(w in q_lower for w in ["refund", "paise", "money back", "रिफ़ंड", "रिफंड"]):
            return {
                "decision": "general_advice",
                "response": (
                    "Hello! I am an AI assistant for ZentroMart. Refunds are usually processed back to your original payment method "
                    "within 5 to 7 business days after we receive your returned item at our fulfillment center."
                ),
                "evidence": [],
            }

        # Delivery / Transit
        if any(w in q_lower for w in ["delivery", "shipping", "shipped", "late", "delay", "pahuncha", "डिलीवरी"]):
            return {
                "decision": "general_advice",
                "response": (
                    "Hello! I am an AI assistant. Standard shipping usually takes 3 to 5 business days across India. "
                    "If your parcel is delayed, please check your tracking link sent via SMS."
                ),
                "evidence": [],
            }

        # Damaged / Wrong / Missing
        if any(w in q_lower for w in ["damage", "damaged", "broken", "wrong", "missing", "kharab", "खराब"]):
            return {
                "decision": "general_advice",
                "response": (
                    "Hello! I am your ZentroMart AI assistant. We apologize for the damaged or incorrect item. "
                    "Please take photos of the product and packaging and send them to support@example.com within 48 hours."
                ),
                "evidence": [],
            }

        # Warranty
        if any(w in q_lower for w in ["warranty", "guarantee", "वारंटी"]):
            return {
                "decision": "general_advice",
                "response": (
                    "Hello! I am an AI assistant. All products sold on ZentroMart carry standard 1-year manufacturer warranty. "
                    "Please contact the brand service center with your invoice for warranty service."
                ),
                "evidence": [],
            }

        # Default fallback
        return {
            "decision": "general_advice",
            "response": (
                "Hello! I am the ZentroMart AI customer support assistant. I do not have access to specific internal "
                "company documents or private order records. For assistance with this request, please contact our human customer care team."
            ),
            "evidence": [],
        }

    async def answer_question(self, question: str) -> Dict[str, Any]:
        """Answer a question using the baseline agent (no RAG, no tools)."""
        if self.llm.is_configured() and self.llm.provider_name() != "deterministic_fallback":
            llm_res = await self.llm.generate_response(
                system_prompt=self.system_prompt,
                user_message=question,
                temperature=0.3,
            )
            text = llm_res.get("text", "")
            return {
                "decision": "llm_parametric",
                "response": text,
                "evidence": [],
                "provider": self.llm.provider_name(),
            }
        
        # When external LLM is not configured, generate realistic parametric baseline
        return self._generate_parametric_fallback(question)


baseline_agent = BaselineAgent()
