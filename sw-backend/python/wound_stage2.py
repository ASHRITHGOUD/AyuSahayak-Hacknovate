# =========================================
# wound_stage2.py — Phase 2: Generate Final Report
# =========================================
import sys, os, json
from dotenv import load_dotenv
import google.generativeai as genai

sys.stdout.reconfigure(encoding='utf-8')
load_dotenv()
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))
gemini = genai.GenerativeModel("gemini-2.0-flash-lite")

if len(sys.argv) < 2:
    print(json.dumps({"error": "No JSON input provided"}))
    sys.exit(1)

try:
    data = json.loads(sys.argv[1])
except Exception as e:
    print(json.dumps({"error": f"Invalid JSON input: {e}"}))
    sys.exit(1)

top3_classes = data.get("top3_classes", [])
top3_probs = data.get("top3_probs", [])
rag_summary = data.get("rag_summary", "")
questions = data.get("questions", [])
answers = data.get("answers", [])

qa_pairs = "\n".join([f"{q}\nAnswer: {a}" for q, a in zip(questions, answers)])

prompt = f"""
You are an AI wound-care assistant creating a clinical summary.
CNN Predictions: {top3_classes} ({top3_probs})
RAG Context: {rag_summary[:1500]}

Below are patient Q&A responses:
{qa_pairs}

Follow these rules:
- If the symptoms clearly **do not match** any of the predicted diseases, output:
  ⚠️ "The patient’s symptoms do not align with the predicted diseases.
  This case appears different — please refer for a detailed dermatological evaluation."
- Otherwise, produce a structured report with:

Generate a structured wound-care report with:
1. Final Wound Diagnosis
2. Clinical Reasoning
3. Care & Dressing Instructions
4. Red Flags
5. Disclaimer
6. Medicines (Only if clearly required. Limit to basic OTC options like antiseptic solution, saline wash, povidone-iodine, mupirocin for minor local use if infection is suspected, or paracetamol for pain. 
   DO NOT prescribe oral antibiotics, steroids, or any restricted medications. 
   Keep instructions simple, e.g., "apply thin layer twice daily" or "take only if pain persists.")
"""


try:
    final_report = gemini.generate_content(
        prompt,
        generation_config=genai.types.GenerationConfig(
            temperature=0.4, max_output_tokens=900)
    ).text.strip()
except Exception as e:
    final_report = f"Error generating final report: {e}"

print(json.dumps({"final_report": final_report}, ensure_ascii=False))
