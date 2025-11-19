# gemini_llm_wrapper.py
# ✅ Stable Gemini Wrapper for IMAS MDT Simulation (with safety + retry)

import time
import google.generativeai as genai
from google.api_core.exceptions import GoogleAPIError


class GeminiLLMWrapper:
    """A clean wrapper around Google Gemini for chat-like use cases."""

    def __init__(self, api_key: str, model: str = "gemini-2.5-flash"):
        """Initialize Gemini client and model."""
        try:
            genai.configure(api_key=api_key)
            self.client = genai
            self.model = genai.GenerativeModel(model)
            print(f"✅ Gemini LLM Wrapper initialized with model: {model}")
        except Exception as e:
            print(f"❌ Failed to initialize Gemini: {e}")
            raise

    def generate_reply(self, messages: list, retries: int = 2, **kwargs) -> str:
        """
        Generates a text reply from Gemini.
        Expects messages as a list of dicts like:
        [{"role": "user", "content": "text"}, {"role": "assistant", "content": "text"}]
        Retries automatically if Gemini returns empty / finish_reason=2.
        """

        # ✅ UPDATED GUARDRAILS SYSTEM PROMPT
        prompt = """
You are AyuSahayak, an AI-powered medical triage assistant.
You MUST strictly follow the clinical workflow and enforce guardrails. 
Guardrails are RULES, not examples, and are not to be reused in clinical summaries.

===========================================================
PHASE 1 — Initial Patient Input (Strict Intake)
===========================================================
• Accept only full descriptive symptoms.
• Reject irrelevant inputs immediately.
• If the user gives ANY unrelated statement (foods, greetings, jokes, chit-chat, tasks), reply with:
  "⚠️ Please continue answering the medical questions. You can ask other things after the assessment."

• Allowed answers contain:
  - Symptom descriptions
  - Duration
  - Severity
  - Time pattern
  - Triggers
  - Progression

• DO NOT move to the next question if the incoming answer is irrelevant.

===========================================================
PHASE 2 — Follow-up Clarification (Controlled Free-Text)
===========================================================
User may answer in normal language, but:
✅ Allowed examples:
  "3 days", "severe", "while walking", "after meals", "only at night"

❌ NOT allowed (must be blocked with a warning):
  - Greetings ("hi", "hello", "ok", "lol")
  - Food ("I ate biryani")
  - Social talk
  - Random conversation
  - Restart attempts ("start", "restart")
  - Adding NEW symptoms not in Phase 1

• If user introduces NEW symptoms not originally stated, reply:
  "⚠️ New symptoms can only be added at the beginning. Please answer the current question."

• If user tries to restart:
  "⚠️ Please complete the current case before starting a new one."

• If user gives irrelevant text:
  "⚠️ Please answer the medical question first."

• DO NOT automatically move ahead if the answer is irrelevant.

===========================================================
PHASE 3 — MDT SUMMARY (Final Output)
===========================================================
In Phase 3 you ONLY output the required sections:
  • Symptoms
  • Possible Diseases
  • Moderator Summary
  • Patient Advice

Rules:
❌ DO NOT output guardrail warnings in Phase 3.
❌ DO NOT copy any Phase 1/2 warning lines.
❌ NEVER insert warnings inside symptoms, moderator summary, diseases, or advice.
✅ These warnings must NEVER appear in Phase 3:
   - "⚠️ Please continue answering the medical questions."
   - "⚠️ Please answer the medical question first."
   - "⚠️ New symptoms can only be added at the beginning."
   - "⚠️ I need more information to answer safely."

===========================================================
MEDICINE RULES (Strict)
===========================================================
✅ Allowed:
• Mention ONLY medicine names (paracetamol, ORS, IV saline)

❌ Not Allowed:
• Dosages (mg, ml, mg/kg)
• Frequency (2 times a day, every 6 hours)
• Phrases indicating prescription (take, consume, use, buy)

→ If dosage slips through, replace entire line with:
  "Seek a clinical evaluation for safe medication use."

===========================================================
SAFETY RULES
===========================================================
• If user answer is unclear:
  "⚠️ I need more information to answer safely."
• If answer is irrelevant:
  Use the appropriate PHASE 1/2 guardrail line.
• These rules override all other behaviors.

===========================================================
ABSOLUTE PRIORITY
===========================================================
• Guardrails ALWAYS override normal conversation.
• Gemini MUST block irrelevant or off-topic answers.
• Gemini MUST ONLY proceed when the answer is medically relevant.
"""

        # ✅ Append incoming conversation messages
        for message in messages:
            role = message.get("role", "user")
            content = message.get("content", "")
            if not content:
                continue
            if role == "user":
                prompt += f"User: {content}\n"
            elif role == "assistant":
                prompt += f"Assistant: {content}\n"
            else:
                prompt += f"{role.capitalize()}: {content}\n"

        attempt = 0
        while attempt <= retries:
            try:
                response = self.model.generate_content(
                    prompt,
                    generation_config=genai.GenerationConfig(
                        temperature=kwargs.get("temperature", 0.6),
                        max_output_tokens=kwargs.get("max_tokens", 2048),
                    ),
                    safety_settings=[
                        {"category": "HARM_CATEGORY_HARASSMENT", "threshold": "BLOCK_NONE"},
                        {"category": "HARM_CATEGORY_HATE_SPEECH", "threshold": "BLOCK_NONE"},
                        {"category": "HARM_CATEGORY_SEXUALLY_EXPLICIT", "threshold": "BLOCK_NONE"},
                        {"category": "HARM_CATEGORY_DANGEROUS_CONTENT", "threshold": "BLOCK_NONE"},
                    ],
                )

                # ✅ Check for valid candidate parts
                if not hasattr(response, "candidates") or not response.candidates:
                    raise ValueError("No candidates returned by Gemini (possibly filtered).")

                has_valid_part = False
                combined_text = []

                for cand in response.candidates:
                    if hasattr(cand, "content") and hasattr(cand.content, "parts"):
                        for part in cand.content.parts:
                            if hasattr(part, "text") and part.text:
                                combined_text.append(part.text.strip())
                                has_valid_part = True

                # ✅ Prefer .text accessor
                if hasattr(response, "text") and response.text and response.text.strip():
                    return response.text.strip()

                # ✅ Return candidate parts
                if has_valid_part and combined_text:
                    return " ".join(combined_text).strip()

                raise ValueError("Empty Gemini response or finish_reason=2")

            except (GoogleAPIError, ValueError, Exception) as e:
                attempt += 1
                print(f"⚠️ Gemini attempt {attempt} failed: {e}")
                if attempt <= retries:
                    time.sleep(1.5)
                    print("🔁 Retrying Gemini request...")
                    continue

                # ✅ Fallback message on full failure
                print("❌ Gemini failed all attempts — returning fallback response.")
                return (
                    "⚠️ Unable to generate an AI response at this moment. "
                    "Please review manually or retry later."
                )

        return "⚠️ Gemini returned empty response after multiple retries."


# ✅ Test standalone before running MDT
if __name__ == "__main__":
    import os

    api_key = os.getenv("GOOGLE_API_KEY") or input("Enter your Gemini API key: ")
    gemini = GeminiLLMWrapper(api_key)

    print("\nTesting Gemini Response...\n")
    messages = [
        {"role": "user", "content": "List three possible causes of fever and jaundice."}
    ]

    reply = gemini.generate_reply(messages)
    print("Gemini Output:\n", reply)
