# modules/symptom_collector.py
import re
from time import sleep

class SymptomCollector:
    def __init__(self, llm):
        self.llm = llm

        self._symptom_lexicon = {
            "fever","cough","cold","jaundice","yellow","pain","headache","vomiting","nausea","diarrhea",
            "breath","breathing","shortness","sob","dyspnea","chest","abdomen","abdominal","throat",
            "fatigue","weakness","dizziness","fainting","syncope","sweating","rash","swelling","swollen",
            "burning","urine","vomit","loose","stool","back","leg","arm","shoulder","jaw","heart",
            "palpitation","wheeze","wheezing","phlegm","sputum","blood","bleeding","dark","itch",
            "itching","chills","rigor","flu","sore","throat","sorethroat","edema","oedema","loss",
            "appetite","weight","weightloss",

            # optional add-ons that fix the stomach ache issue
            "stomach","ache","stomachache"
        }

        # Slot keywords — new removed
        self._slot_keywords = {
            "duration","since when","how long","for how long","days","hours","weeks","months",
            "severity","mild","moderate","severe","scale","intensity",
            "timing","pattern","only at night","at night","in the morning","after meals","before meals",
            "while walking","on exertion","on lying down","while resting","intermittent","continuous",
            "triggers","trigger","worse with","better with","relieved by","aggravated by",
            "location","where exactly","which side","radiate","radiating",
            "progression","getting better","getting worse","same","started suddenly","gradual",
            "associated","with fever","with cough","with vomiting",
        }

        self._med_rx_patterns = [
            r"\bmg\b", r"\bml\b", r"\bmcg\b", r"\bmg/kg\b", r"\btablet(s)?\b", r"\bsyrup\b",
            r"\bdose\b", r"\bdosage\b", r"\btake\b", r"\bconsume\b", r"\bbuy\b", r"\buse\b",
            r"\badminister\b", r"\bevery\s+\d+\s*(hours|hrs|days)\b",
            r"\btwice\s+a\s+day\b", r"\bonce\s+a\s+day\b", r"\bthrice\s+a\s+day\b",
        ]

        # ❌ NEW SYMPTOM FISHING — REMOVED COMPLETELY
        self._broad_new_symptom_phrases = []  # <-- wiped out

    # ------------------------------------
    # LLM Helpers
    # ------------------------------------
    def _extract_text_from_response(self, res):
        try:
            if isinstance(res, str) and res.strip():
                return res.strip()
            if hasattr(res, "text") and isinstance(res.text, str) and res.text.strip():
                return res.text.strip()
            if hasattr(res, "candidates") and res.candidates:
                cand = res.candidates[0]
                content = getattr(cand, "content", None)
                parts = getattr(content, "parts", None)
                if parts:
                    pieces = []
                    for p in parts:
                        txt = getattr(p, "text", None) or getattr(p, "content", None)
                        if isinstance(txt, str):
                            pieces.append(txt)
                        elif hasattr(txt, "text"):
                            pieces.append(txt.text)
                    joined = " ".join(pieces).strip()
                    if joined:
                        return joined
            return str(res).strip()
        except Exception as e:
            return f"Gemini error: {e}"

    def gemini_reply_to_str(self, messages, retries=2, backoff=0.5):
        last_err = None
        for _ in range(retries):
            try:
                res = self.llm(messages) if callable(self.llm) else self.llm.generate_reply(messages)
                text = self._extract_text_from_response(res)
                if text and "quick accessor" in text.lower():
                    raise ValueError(text)
                return text
            except Exception as e:
                last_err = e
                sleep(backoff)
                backoff *= 1.5
        return f"Gemini error: {last_err}"

    # ------------------------------------
    # Guardrail Helpers
    # ------------------------------------
    def _extract_symptom_keywords(self, text: str) -> set:
        words = set(w.strip(".,:;!?()[]{}\"'").lower() for w in text.split())
        return {w for w in words if w in self._symptom_lexicon}

    def _contains_med_or_dose(self, question: str) -> bool:
        return any(re.search(p, question.lower()) for p in self._med_rx_patterns)

    def _mentions_slot(self, question: str) -> bool:
        q = question.lower()
        return any(slot in q for slot in self._slot_keywords)

    def _overlaps_context_symptoms(self, question: str, ctx_keywords: set) -> bool:
        qwords = set(w.strip(".,:;!?()[]{}\"'").lower() for w in question.split())
        return len(qwords & ctx_keywords) > 0

    def _looks_like_question(self, q: str) -> bool:
        q = q.strip().lower()
        return ("?" in q) or q.startswith(
            ("do ","is ","are ","did ","does ","have ","has ",
             "can ","could ","would ","will ","shall ","may ")
        )

    def _sanitize_question(self, q: str) -> str:
        q = re.sub(r"\s+"," ",q.strip())
        return q if q.endswith("?") else q + "?"

    def _validate_followup_question(self, current_context, asked_questions, question):
        if not question or not question.strip():
            return False,"empty",question

        q = question.strip()

        if not self._looks_like_question(q):
            return False,"not_a_question",q

        if self._contains_med_or_dose(q):
            return False,"med_or_dose",q

        # ❌ NEW SYMPTOM BLOCK — FULLY REMOVED

        norm_q = ' '.join(q.lower().split())
        asked_norms = [' '.join(x.lower().split()) for x in (asked_questions or [])]
        if norm_q in asked_norms:
            return False,"duplicate",q

        ctx_keys = self._extract_symptom_keywords(current_context)
        relevant = self._overlaps_context_symptoms(q, ctx_keys) or self._mentions_slot(q)

        if not relevant:
            return False,"not_relevant",q

        return True,"",self._sanitize_question(q)

    # ------------------------------------
    # Follow-up generator
    # ------------------------------------
    def generate_single_followup(self, current_context: str, asked_questions=None):
        asked_questions = asked_questions or []

        base = (
    "You are a clinical triage AI assistant.\n"
    "Ask ONE follow-up question that covers ALL already-mentioned symptoms together.\n"
    "You may ask about duration OR severity OR timing OR triggers OR location OR progression — but apply it to all symptoms in a single question.\n"
    "Do NOT ask separate questions for each symptom.\n"
    "Do NOT introduce new symptoms.\n"
    "The question must be short and use one slot applied to all symptoms.\n"
    "If no follow-up is needed, reply: no further questions."
)

        prompt = (
            f"{base}\n\nContext: '''{current_context}'''\n"
            f"Previously asked: {', '.join(asked_questions) if asked_questions else 'none'}\n\n"
            "Your ONE follow-up question:"
        )

        for attempt in range(3):
            q = self.gemini_reply_to_str([{"role":"user","content":prompt}])
            if not q:
                continue

            if "no further" in q.lower():
                return None

            ok, reason, sanitized = self._validate_followup_question(
                current_context, asked_questions, q
            )
            if ok:
                return sanitized

            prompt = (
                f"{base}\n\nCONSTRAINTS:\n"
                f"- Last attempt rejected for: {reason}\n"
                f"- Must refer ONLY to existing symptoms\n"
                f"- Only duration/severity/timing/location\n"
                f"- No meds/doses\n"
                f"Context: '''{current_context}'''\n"
                f"Previously asked: {', '.join(asked_questions)}\n\n"
                "Your corrected follow-up question:"
            )

        return "Can you describe severity and timing of the main symptom?"

    # ------------------------------------
    # First question API
    # ------------------------------------
    def clarification_loop_api(self, initial_input, max_rounds=1, confidence_threshold=70):
        collected = initial_input.strip()
        q = self.generate_single_followup(collected, asked_questions=[])
        if not q:
            return collected, []
        return collected, [q]

    # ------------------------------------
    # Next question API – simplified (no new-symptom blocking)
    # ------------------------------------
    def generate_next_question_api(self, collected_context, new_answers, asked_questions=None, confidence_threshold=70):
        asked_questions = asked_questions or []

        for q, a in new_answers.items():
            collected_context += f" | {q}: {a or 'unknown'}"

        next_q = self.generate_single_followup(collected_context, asked_questions)
        if not next_q:
            return True, None, collected_context

        return False, next_q, collected_context

    # ------------------------------------
    # Non-interactive loop
    # ------------------------------------
    def clarification_loop_non_interactive(self, initial_input, max_rounds=2):
        ctx = initial_input.strip()
        asked = []
        for _ in range(max_rounds):
            q = self.generate_single_followup(ctx, asked)
            if not q:
                break
            asked.append(q)
            ctx += f" | {q}: awaiting answer"
        return ctx
