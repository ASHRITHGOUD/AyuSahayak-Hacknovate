# backend/modules/routing_pipeline.py
import os
import uuid
import asyncio
from datetime import datetime
from dotenv import load_dotenv

from modules.symptom_collector import SymptomCollector
from modules.symptom_shortlister import SymptomShortlister
from modules.complexity import ComplexityAssessor

from agents.low import GeminiPCP
from agents.medium import MDTAgentGroup
from agents.high import HighCaseHandler
from gemini_llm_wrapper import GeminiLLMWrapper


class RoutingPipeline:
    def __init__(self, external_llm_generate=None):
        load_dotenv()

        # -----------------------------
        # LLM Setup
        # -----------------------------
        if external_llm_generate:
            if callable(external_llm_generate):
                self._safe_generate_reply = external_llm_generate
            elif hasattr(external_llm_generate, "generate_reply"):
                self._safe_generate_reply = external_llm_generate.generate_reply
            else:
                raise ValueError("external_llm_generate must be callable or provide .generate_reply()")
            self.llm = None
            print("✅ RoutingPipeline using external LLM")
        else:
            api_key = os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY")
            if not api_key:
                api_key = input("Enter your Gemini API key: ").strip()

            self.llm = GeminiLLMWrapper(api_key=api_key, model="gemini-2.5-flash")
            self._safe_generate_reply = self._internal_safe_generate_reply
            print("✅ Gemini LLM initialized")

        # -----------------------------
        # Submodule Setup
        # -----------------------------
        self.llm_config = {"custom_generate_reply": self._safe_generate_reply}

        self.collector = SymptomCollector(self._safe_generate_reply)
        self.shortlister = SymptomShortlister(self._safe_generate_reply)
        self.complexity = ComplexityAssessor(self._safe_generate_reply)

        self.low_handler = GeminiPCP(self._safe_generate_reply)
        self.mdt_handler = MDTAgentGroup(self.llm_config, src_lang="eng")
        self.high_handler = HighCaseHandler()

    def _internal_safe_generate_reply(self, messages):
        try:
            res = self.llm.generate_reply(messages)
            return res.text.strip() if hasattr(res, "text") else str(res)
        except Exception as e:
            print("⚠️ Gemini Error:", e)
            return ""

    def _mdt_logging_callable(self, discussion_log):
        """For terminal logging."""
        def log_turn(question):
            discussion_log.append(f"Q: {question} | A: non-interactive")
            return "non-interactive"
        return log_turn

    # ===========================================================
    # NON-INTERACTIVE (Terminal) ROUTE
    # ===========================================================
    def process_case(self, patient_description: str) -> dict:
        print("\n🩺 Starting NON-INTERACTIVE Routing Pipeline...\n")

        case_id = str(uuid.uuid4())[:8].upper()
        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

        collected_text = self.collector.clarification_loop_non_interactive(patient_description)

        summary = self.shortlister.shortlist(collected_text)
        case_complexity = self.complexity.assess(summary)

        result = {
            "case_id": case_id,
            "timestamp": timestamp,
            "symptoms": summary.get("symptoms", []),
            "possible_diseases": summary.get("possible_diseases", []),
        }

        # ------------------------------------------------------
        # LOW COMPLEXITY (PCP)
        # ------------------------------------------------------
        if case_complexity == "low":
            pcp_output = self.low_handler.generate_reply(collected_text)
            result.update({
                "route": "Low (PCP)",
                "specialists_involved": ["Primary Care Physician"],
                "specialist_discussion": "Directly handled by PCP.",
                "mdt_summary_raw": None,
                "patient_friendly_advice": pcp_output["advice"],
                "medicines_advised": pcp_output["medicines"],
            })
            return result

        # ------------------------------------------------------
        # MEDIUM COMPLEXITY (MDT)
        # ------------------------------------------------------
        elif case_complexity == "medium":
            discussion_log = []

            md_results = self.mdt_handler.run_interactive_case(
                collected_text,
                ask_user_callable=self._mdt_logging_callable(discussion_log)
            )

            result.update({
                "route": "Medium (MDT)",
                "symptoms": md_results["symptoms"],
                "specialists_involved": md_results["specialists"],
                "specialist_discussion": md_results["discussion_text"],
                "mdt_summary_raw": md_results["mdt_summary_raw"],
                "medicines_advised": md_results.get("medicines", []),
            })
            return result

        # ------------------------------------------------------
        # HIGH COMPLEXITY (EMERGENCY)
        # ------------------------------------------------------
        elif case_complexity == "high":
            emergency_advice = self.high_handler.handle(summary)
            result.update({
                "route": "High (Emergency)",
                "specialists_involved": ["Emergency Response Team"],
                "specialist_discussion": "Immediate escalation.",
                "mdt_summary_raw": None,
                "patient_friendly_advice": emergency_advice,
                "medicines_advised": ["Emergency stabilization protocols"],
            })
            return result

        # ------------------------------------------------------
        # UNKNOWN
        # ------------------------------------------------------
        result.update({
            "route": "Unknown",
            "patient_friendly_advice": "Could not determine case complexity.",
        })
        return result

    # ===========================================================
    # FASTAPI FINAL ROUTE + PROGRESS
    # ===========================================================
    async def run_route(self, case_complexity, collected_text, summary, case_id, progress_callback=None):

        async def send(msg):
            if progress_callback:
                if asyncio.iscoroutinefunction(progress_callback):
                    await progress_callback(msg)
                else:
                    progress_callback(msg)

        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

        result = {
            "case_id": case_id,
            "timestamp": timestamp,
            "symptoms": summary.get("symptoms", []),
            "possible_diseases": summary.get("possible_diseases", []),
        }

        # ------------------------------------------------------
        # LOW
        # ------------------------------------------------------
        if case_complexity == "low":
            await send("Routing to PCP…")
            pcp = self.low_handler.generate_reply(collected_text)
            result.update({
                "route": "Low (PCP)",
                "specialists_involved": ["Primary Care Physician"],
                "specialist_discussion": "Directly handled by PCP.",
                "mdt_summary_raw": None,
                "patient_friendly_advice": pcp["advice"],
                "medicines_advised": pcp["medicines"],
            })
            return result

        # ------------------------------------------------------
        # MEDIUM (MDT)
        # ------------------------------------------------------
        elif case_complexity == "medium":
            await send("Routing to MDT team…")
            discussion_log = []

            md_results = self.mdt_handler.run_interactive_case(
                collected_text,
                ask_user_callable=self._mdt_logging_callable(discussion_log)
            )

            await send("MDT discussion completed.")

            result.update({
                "route": "Medium (MDT)",
                "symptoms": md_results["symptoms"],
                "specialists_involved": md_results["specialists"],
                "specialist_discussion": md_results["discussion_text"],
                "mdt_summary_raw": md_results["mdt_summary_raw"],
                "medicines_advised": md_results.get("medicines", []),
            })
            return result

        # ------------------------------------------------------
        # HIGH
        # ------------------------------------------------------
        elif case_complexity == "high":
            await send("Emergency case detected…")
            emergency_advice = self.high_handler.handle(summary)
            result.update({
                "route": "High (Emergency)",
                "specialists_involved": ["Emergency Response Team"],
                "specialist_discussion": "Immediate escalation.",
                "mdt_summary_raw": None,
                "patient_friendly_advice": emergency_advice,
                "medicines_advised": ["Emergency stabilization protocols"],
            })
            return result

        # ------------------------------------------------------
        # UNKNOWN
        # ------------------------------------------------------
        await send("Could not determine complexity.")
        result.update({
            "route": "Unknown",
            "patient_friendly_advice": "More details needed.",
        })
        return result


if __name__ == "__main__":
    user_input = input("Describe patient:\n> ")
    router = RoutingPipeline()
    print(router.process_case(user_input))
