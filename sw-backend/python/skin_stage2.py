# =========================================
# skin_stage2.py — Phase 2: Final Report from Answers
# =========================================
import sys, os, json
from dotenv import load_dotenv
import google.generativeai as genai

os.environ["TF_CPP_MIN_LOG_LEVEL"] = "3"
sys.stdout.reconfigure(encoding='utf-8')

load_dotenv()
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
if not GEMINI_API_KEY:
    print(json.dumps({"error": "Missing GEMINI_API_KEY"}))
    sys.exit(1)

genai.configure(api_key=GEMINI_API_KEY)
gemini = genai.GenerativeModel("gemini-2.0-flash-lite")

# ============= Expect JSON Input via Command-line =============
if len(sys.argv) < 2:
    print(json.dumps({"error": "No JSON input provided"}))
    sys.exit(1)

try:
    data = json.loads(sys.argv[1])
except Exception as e:
    print(json.dumps({"error": f"Invalid JSON input: {e}"}))
    sys.exit(1)

# ============= Extract Required Data =============
top3_classes = data.get("top3_classes", [])
top3_probs = data.get("top3_probs", [])
rag_summary = data.get("rag_summary", "")
questions = data.get("questions", [])
answers = data.get("answers", [])

# ============= Build Final Gemini Prompt =============
answer_pairs = "\n".join([f"Q{i+1}: {q}\nA{i+1}: {a}" for i, (q, a) in enumerate(zip(questions, answers))])

final_prompt = f"""
You are an AI clinical assistant generating a dermatology report.

CNN Predictions: {top3_classes} with probabilities {top3_probs}
RAG Summary: {rag_summary[:1500]}

Below are the patient's answers:
{answer_pairs}

Follow these rules:
- If the symptoms clearly **do not match** any of the predicted diseases, output:
  ⚠️ "The patient’s symptoms do not align with the predicted diseases.
  This case appears different — please refer for a detailed dermatological evaluation."
- Otherwise, produce a structured report with:

Write a structured medical report including:
1. Most Likely Diagnosis
2. Clinical Reasoning
3. Recommended Action
4. Red Flags
5. Disclaimer
6. Medicines (Only if clearly indicated, limited to mild OTC options such as antihistamines, moisturizers, mild antifungals, or antiseptics. 
   Do NOT prescribe steroids, antibiotics, or schedule medications. 
   Keep dosage simple and generic, e.g., "apply twice daily" or "take once daily if itching.")
"""


try:
    final_report = gemini.generate_content(
        final_prompt,
        generation_config=genai.types.GenerationConfig(
            temperature=0.4, max_output_tokens=1000)
    ).text.strip()
except Exception as e:
    final_report = f"Error generating final report: {e}"

print(json.dumps({"final_report": final_report}, ensure_ascii=False))
