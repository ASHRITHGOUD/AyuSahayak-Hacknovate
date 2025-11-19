# modules/complexity.py

class ComplexityAssessor:
    """
    Dynamically assesses case complexity using Gemini LLM + fallback logic.
    """

    def __init__(self, llm_generate_reply=None):
        self.llm_generate_reply = llm_generate_reply

    def assess(self, symptom_summary: dict) -> str:
        patient_text = symptom_summary.get("raw_text", "").lower()
        symptoms = symptom_summary.get("symptoms", [])

        print("final symptoms went to complexity assessor:")
        print(patient_text)

        # --- Step 1: Try Gemini AI-based reasoning ---
        if self.llm_generate_reply:
            prompt = (
            "Role:\n"
            "You are a clinical triage AI assistant that classifies patient cases into one of three levels of complexity "
            "based on vitals, symptoms, and nurse observations.\n\n"
        
            "Input Provided:\n"
            "- Vitals: Temperature, Pulse, Blood Pressure, SpO₂, Respiratory Rate, etc.\n"
            "- Initial and adaptive symptoms from the nurse.\n"
            "- Patient's age group (Child, Young Adult, Adult, or Senior).\n"
            f"- Free-text patient/nurse description: '{patient_text}'\n\n"
        
            "Your Task:\n"
            "Analyze the details carefully and classify the case into one of these categories: low, medium, or high.\n\n"
        
            "1. Low Complexity\n"
            "- Mild, self-limiting, or common symptoms.\n"
            "- Normal or near-normal vitals.\n"
            "- Can be managed by a general practitioner or teleconsultation.\n"
            "- Examples: Mild fever, sore throat, cold, mild headache, diarrhea without dehydration, minor rash.\n\n"
        
            "2. Medium Complexity\n"
            "- Requires multidisciplinary review or diagnostic clarification.\n"
            "- Symptoms overlap between multiple body systems or indicate involvement of different specialists "
            "(e.g., cardiologist + gastroenterologist).\n"
            "- Moderate vital abnormalities but patient stable.\n"
            "- Duration prolonged (e.g., fever > 5 days).\n"
            "- Examples: Fever with mild shortness of breath and abdominal pain; persistent cough with fatigue and loss of appetite; "
            "suspected infection, autoimmune, or metabolic disorder requiring investigations.\n\n"
        
            "3. High Complexity\n"
            "- Potentially life-threatening or emergency cases requiring immediate referral or hospital care.\n"
            "- Triggered by severely abnormal vitals or critical symptoms (see age-group specifics below).\n\n"
        
            " For Children (0-14 years)\n"
            "- Neonatal disorders: difficulty breathing (grunting, flaring nostrils, chest retractions), poor feeding/not waking for feeds, "
            "fever > 100.4°F (38°C) or low temp < 97.5°F (36.5°C), lethargy/floppiness, skin color changes (jaundice, pale, blue/gray).\n"
            "- Diarrhea / LRI: frequent watery stools (≥3/day), signs of dehydration (sunken eyes/fontanelle, dry mouth, few wet diapers), "
            "lower respiratory infection signs (fast/shallow breathing, wheezing, persistent cough, chest retractions).\n\n"
        
            " For Young Adults (15 - 39 years)\n"
            "- Cardiovascular red flags: chest pain (pressure/squeezing/tightness), pain radiating to arm/jaw/neck/back/upper stomach, "
            "sudden shortness of breath, dizziness/fainting, cold sweat, extreme unexplained fatigue.\n\n"
        
            " For Adults (40 - 69 years)\n"
            "- Higher cardiovascular risk: presentations as above, including atypical symptoms.\n"
            "- Cancer red flags: persistent cough, hemoptysis, unexplained weight loss, lumps/ulcers > 3 weeks, abnormal bleeding.\n"
            "- Chronic respiratory disease: chronic cough with mucus, exertional dyspnea, recurrent chest infections, wheezing.\n\n"
        
            " For Seniors (70+ years)\n"
            "- Cardiovascular: atypical or “silent” heart attacks (fatigue, dyspnea, indigestion, jaw/back/shoulder pain, dizziness).\n"
            "- Chronic respiratory disease: progressive cough, dyspnea, wheezing (often severe).\n"
            "- Neurological emergencies: stroke (F.A.S.T. — facial droop, arm drift, slurred speech) and acute confusion/delirium.\n\n"
        
            "Guidelines:\n"
            "- Base reasoning strictly on provided symptoms and vitals — do not invent data.\n"
            "- Consider overlaps: if symptoms indicate multiple systems or specialists → choose Medium.\n"
            "- If severe, red-flag, or emergency features as listed → choose High.\n"
            "- When uncertain, always choose the higher category.\n\n"
        
            "Finally, classify the overall case complexity as one of the following:\n"
            "- low: mild/common, manageable by a general doctor\n"
            "- medium: moderate, chronic, or multi-symptom cases\n"
            "- high: severe, emergency, or life-threatening cases\n\n"
            "IMPORTANT: respond with only one word: low, medium, or high."
            )

            try:
                reply = self.llm_generate_reply([{"role": "user", "content": prompt}])
                reply = reply.strip().lower() if isinstance(reply, str) else str(reply).strip().lower()
                if reply in ["low", "medium", "high"]:
                    print(f"(Gemini classified complexity as: {reply})")
                    return reply
            except Exception as e:
                print(f"⚠️ Gemini complexity reasoning failed: {e}")

        # --- Step 2: Improved fallback logic ---

        emergency_terms = ["severe", "bleeding", "unconscious", "stroke", "heart attack", "seizure", "collapsed"]
        medium_terms = ["vomiting", "dizziness", "fainting", "chest pain", "abdominal pain", "jaundice", "breathing difficulty"]
        low_terms = ["fever", "cold", "fatigue", "tiredness", "headache", "mild cough"]

        # Priority 1: emergency
        if any(k in patient_text for k in emergency_terms):
            return "high"

        # Priority 2: moderate
        if any(k in patient_text for k in medium_terms):
            return "medium"

        # Priority 3: mild only if no medium/high flags
        if any(k in patient_text for k in low_terms):
            return "low"

        # Default safety
        return "medium"
