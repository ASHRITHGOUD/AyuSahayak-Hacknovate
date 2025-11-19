# modules/symptom_shortlister.py

class SymptomShortlister:
    """
    Uses Gemini to extract ONLY symptom keywords from patient text.
    No disease prediction. No fallback KB.
    """

    def __init__(self, llm_generate_reply):
        self.llm_generate_reply = llm_generate_reply

    def shortlist(self, patient_text: str):
        """
        Return ONLY:
        - symptoms: list of extracted symptoms (from Gemini)
        - raw_text: original full text
        """

        # LLM prompt to extract ONLY symptoms
        prompt = (
            "You are a medical assistant.\n"
            "Extract ONLY the symptoms mentioned in the following patient description.\n"
            "Return them as a comma-separated list.\n"
            "Do NOT guess diseases.\n"
            "Do NOT invent symptoms.\n"
            f"Patient text: '{patient_text}'\n"
        )

        try:
            reply = self.llm_generate_reply([{"role": "user", "content": prompt}])
            # Parse Gemini result into list
            symptoms = [s.strip() for s in reply.split(",") if s.strip()]
        except Exception as e:
            print(f"⚠️ SymptomShortlister LLM Error: {e}")
            symptoms = []

        return {
            "symptoms": symptoms,
            "raw_text": patient_text
        }
