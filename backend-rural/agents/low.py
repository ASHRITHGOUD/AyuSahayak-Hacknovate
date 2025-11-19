# backend/agents/low.py
from types import SimpleNamespace
from agents_helper.simplify import GeminiSimplify

class GeminiPCP:
    """Gemini-based Low Complexity Handler (PCP)"""

    def __init__(self, llm_generate_callable):
        if not callable(llm_generate_callable):
            raise ValueError("Provide a callable LLM wrapper")
        self.llm_generate = llm_generate_callable

        # Core agent
        self.agent = SimpleNamespace()
        self.agent.generate_reply = self._wrap_safe

        # Simplifier instance
        self.simplifier = GeminiSimplify(llm_generate_callable)

    def _wrap_safe(self, messages):
        """Safely call Gemini LLM and handle errors gracefully."""
        try:
            res = self.llm_generate(messages)
            return res.strip() if isinstance(res, str) else getattr(res, "text", "No response.")
        except Exception as e:
            return f"[PCP] LLM error: {e}"

    # -------------------------------------------------------
    # FINAL UPDATED PCP PROMPT (SAFE + OTC ONLY)
    # -------------------------------------------------------
    def generate_reply(self, patient_text: str, simplify: bool = True):
        """
        Generate a structured, practical PCP-level plan.
        """

        prompt = (
            f"You are a Primary Care Physician assisting a nurse in a rural clinic.\n"
            f"The patient reports the following symptoms: \"{patient_text}\"\n\n"
            "Write a complete PCP assessment even if symptoms are very few or unclear.\n"
            "NEVER ask follow-up questions or wait for more information.\n"

            "NURSE ENVIRONMENT LIMITATIONS:\n"
            "- Only vitals available (temperature, pulse, BP, SpO₂).\n"
            "- NO labs, NO imaging.\n"
            "- You MAY mention prescription medicines ONLY as suggestions for the supervising doctor.\n"

            "- Nurse may give saline, oral tablets, ORS.\n"
            "- NO dosage (mg/ml) or frequency instructions.\n"
            "- Frame medicines as: 'Doctor may consider X'.\n"
            "- Do NOT directly instruct the patient to take any medicine.\n"

            "Write the clinical plan using EXACTLY these 5 sections:\n\n"
            "CONDITION SUMMARY:\n"
            "POSSIBLE CAUSES:\n"
            "NURSE ACTIONS:\n"
            "ESCALATION CRITERIA:\n"
            "MEDICINES ADVISED:\n\n"

            "MEDICINE RULES:\n"
            "- You may suggest doctor-level medications.\n"
            "- No dosage, no frequency.\n"
            "- Keep items short and non-prescriptive.\n"

            "Keep everything short, clear, and nurse-friendly.\n" 
            "DO NOT ask any questions. DO NOT tell the patient to continue answering questions.\n"
 
        )

        messages = [{"role": "user", "content": prompt}]
        full_reply = self.agent.generate_reply(messages)
        print("PCP FULL REPLY:", full_reply)

        # Extract “MEDICINES ADVISED”
        medicines = []
        if "MEDICINES ADVISED" in full_reply.upper():
            try:
                section_text = full_reply.split("MEDICINES ADVISED")[1]
                lines = section_text.splitlines()
                for line in lines:
                    clean = line.strip(" -•\t:")
                    if clean and len(clean.split()) < 12:
                        medicines.append(clean)
                    elif any(h in line.upper() for h in ["SUMMARY", "CAUSES", "ACTIONS", "ESCALATION"]):
                        break
                medicines = [m for m in medicines if m]
            except:
                medicines = []

        if not medicines:
            medicines = [
                "Paracetamol (for fever/pain)",
                "ORS solution",
                "Antacid (for acidity)",
                "Cetirizine (for allergy)",
            ]

        return {"advice": full_reply,"pcp_full": full_reply, "medicines": medicines}

    def simplify_reply(self, text: str) -> str:
        return self.simplifier.simplify_text(text, mode="pcp")
