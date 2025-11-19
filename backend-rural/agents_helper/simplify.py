# agents_helper/simplify.py

import re

class GeminiSimplify:
    """
    This class provides a uniform simplification interface for both PCP and MDT.
    It expects an external LLM generate function (adapter) passed during initialization.
    """

    def __init__(self, llm_generate_fn):
        """
        llm_generate_fn → a callable like adapter.generate_reply(messages)
        """
        self.llm_generate = llm_generate_fn

    # ------------------------------------------------------------
    # Main method
    # ------------------------------------------------------------
    def simplify_text(self, medical_text: str, mode: str = "pcp") -> str:

        if mode == "pcp":
            prompt = self._pcp_prompt(medical_text)

        elif mode == "mdt":
            prompt = self._mdt_prompt(medical_text)

        else:
            raise ValueError("Unknown simplify mode")

        messages = [
            {"role": "user", "content": prompt}
        ]

        response = self.llm_generate(messages)
        return self._clean_response(response)

    # ------------------------------------------------------------
    # PCP PROMPT
    # ------------------------------------------------------------
    def _pcp_prompt(self, text: str) -> str:
        """
        Simplify the text while keeping the 5 required headings EXACTLY the same.
        """
        return f"""
You are a clinical simplification AI for nurses.

SIMPLE RULES:
1. KEEP ALL HEADINGS EXACTLY THE SAME — DO NOT rename, remove, or reorder:
   - CONDITION SUMMARY
   - POSSIBLE CAUSES
   - NURSE ACTIONS
   - ESCALATION CRITERIA
   - MEDICINES ADVISED

2. Simplify ONLY the content under each heading.
3. Use short, clear sentences.
4. No medical jargon unless required.

Here is the text to simplify:

{text}

Return ONLY the simplified text with the SAME 5 HEADINGS.
""".strip()

    # ------------------------------------------------------------
    # MDT PROMPT
    # ------------------------------------------------------------
    def _mdt_prompt(self, text: str) -> str:
        """
        Convert MDT moderator summary & specialists discussion into
        clear PCP-style sections.
        """
        return f"""
Rewrite the following MDT content into a clean, simple nurse-friendly summary.

FINAL OUTPUT MUST USE **EXACTLY these 5 SECTIONS**:

CONDITION SUMMARY:
POSSIBLE CAUSES:
NURSE ACTIONS:
ESCALATION CRITERIA:
MEDICINES ADVISED:

RULES:
- DO NOT change the heading names.
- Under CONDITION SUMMARY, include a brief one-line about the main concern & note key points from specialists.
- Give short, actionable items under NURSE ACTIONS.
- MEDICINES ADVISED should contain only safe OTC or supportive care (if any). If unsure, leave blank.

MDT INPUT:
{text}

Return ONLY the 5 PCP-style sections.
""".strip()

    # ------------------------------------------------------------
    # Clean LLM output
    # ------------------------------------------------------------
    def _clean_response(self, resp: str) -> str:
        """
        Ensures the response is plain text (Gemini sometimes wraps XML/markdown).
        """
        if not isinstance(resp, str):
            resp = getattr(resp, "text", "") or str(resp)

        # Remove markdown fences
        resp = resp.replace("```", "").strip()

        # Normalize spacing
        resp = re.sub(r"\n{3,}", "\n\n", resp)

        print("SIMPLIFIED RESPONSE:", resp) 

        return resp.strip()
