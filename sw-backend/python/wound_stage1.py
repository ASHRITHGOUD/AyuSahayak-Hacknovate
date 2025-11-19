# =========================================
# wound_stage1.py — Phase 1: Predict + Clean Questions
# =========================================
import sys
sys.stdout.reconfigure(encoding='utf-8')

import os, json, re, faiss, numpy as np, tensorflow as tf
from tensorflow.keras.models import load_model  # type: ignore
from tensorflow.keras.preprocessing.image import img_to_array  # type: ignore
from PIL import Image
from sentence_transformers import SentenceTransformer
from dotenv import load_dotenv
import google.generativeai as genai

# Setup
os.environ["TF_CPP_MIN_LOG_LEVEL"] = "3"
load_dotenv()

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
if not GEMINI_API_KEY:
    print(json.dumps({"error": "Missing GEMINI_API_KEY"}))
    sys.exit(1)

genai.configure(api_key=GEMINI_API_KEY)
gemini = genai.GenerativeModel("gemini-2.0-flash-lite")

# Check CLI args
if len(sys.argv) < 2:
    print(json.dumps({"error": "No image path provided"}))
    sys.exit(1)

image_path = sys.argv[1]
if not os.path.exists(image_path):
    print(json.dumps({"error": f"Image not found at {image_path}"}))
    sys.exit(1)

# Model
MODEL_PATH = "D:\\AyuSahayak-main\\sw-backend\\models\\wound_model.h5"
CLASS_NAMES = [
    "Abrasions", "Avulsion", "Bruises", "Burns", "Cut", "Laceration",
    "Puncture", "Scars", "Surgical wounds", "Ulcer"
]
model = load_model(MODEL_PATH)

# Preprocess
def preprocess_image(img_path, target_size=(128,128)):
    img = Image.open(img_path).convert("RGB").resize(target_size)
    arr = img_to_array(img)/255.0
    return np.expand_dims(arr, 0)

image_array = preprocess_image(image_path)
preds = model.predict(image_array)[0]
top3 = preds.argsort()[-3:][::-1]
top3_classes = [CLASS_NAMES[i] for i in top3]
top3_probs = [float(preds[i]) for i in top3]

# RAG
RAG_FILE = "D:\\AyuSahayak-main\\sw-backend\\rag_data\\wound.txt"
with open(RAG_FILE, "r", encoding="utf-8") as f:
    raw = f.read()

sections = re.split(r'\n(?=\d+\.\s)', raw.strip())
rag_data = {}
for s in sections:
    m = re.match(r'(\d+)\.\s*([A-Za-z\s’\'\-()]+)', s)
    if m:
        name = m.group(2).strip()
        text = re.sub(r'^\d+\.\s*', '', s).strip()
        rag_data[name.lower()] = text

embedder = SentenceTransformer("all-MiniLM-L6-v2")
keys = list(rag_data.keys())
embeddings = embedder.encode([rag_data[k] for k in keys])
index = faiss.IndexFlatL2(embeddings.shape[1])
index.add(np.array(embeddings))

def retrieve(query, k=1):
    qv = embedder.encode([query])
    D, I = index.search(np.array(qv), k)
    return rag_data[keys[I[0][0]]]

rag_results = []
for c in top3_classes:
    txt = retrieve(f"{c} wound care overview")
    rag_results.append(f"### {c}\n{txt}\n")

rag_summary = "\n\n".join(rag_results)

# Gemini — Question generation
prompt = f"""
You are an AI wound-care assistant.
CNN predicted wound types: {top3_classes}.
RAG summary: {rag_summary[:1200]}.
Generate 3–5 clear, nurse-friendly diagnostic questions only.
Focus on pain, cause, discharge, and infection.
Number them (Q1, Q2, etc.) and exclude any extra commentary.
"""

try:
    raw_output = gemini.generate_content(
        prompt, generation_config=genai.types.GenerationConfig(
            temperature=0.5, max_output_tokens=600)
    ).text.strip()
except Exception as e:
    raw_output = f"Error generating questions: {e}"

# ============= Clean Output =============
question_lines = []
for line in raw_output.split("\n"):
    line = line.strip()
    if not line:
        continue
    if re.match(r"^(Q?\d+[\.\)]\s+.+)", line, re.IGNORECASE):
        question_lines.append(line)
    elif line.endswith("?"):
        question_lines.append(line)

if not question_lines and "?" in raw_output:
    question_lines = [q.strip() + "?" for q in raw_output.split("?") if q.strip()]

clean_questions = []
for q in question_lines:
    if (
        len(q.split()) > 3
        and not re.search(r"start|begin|okay|let me|context|introduction", q, re.I)
    ):
        clean_questions.append(q.strip())

clean_questions = clean_questions[:6]

# Output
result = {
    "top3_classes": top3_classes,
    "top3_probs": top3_probs,
    "rag_summary": rag_summary,
    "questions": clean_questions
}

print(json.dumps(result, ensure_ascii=False))
