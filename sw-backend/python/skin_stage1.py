# =========================================
# skin_stage1.py — Phase 1: Predict + Clean Questions
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

# ============= Setup =============
os.environ["TF_CPP_MIN_LOG_LEVEL"] = "3"
load_dotenv()
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
if not GEMINI_API_KEY:
    print(json.dumps({"error": "Missing GEMINI_API_KEY"}))
    sys.exit(1)
genai.configure(api_key=GEMINI_API_KEY)
gemini = genai.GenerativeModel("gemini-2.0-flash-lite")

# ============= Input =============
if len(sys.argv) < 2:
    print(json.dumps({"error": "No image path provided"}))
    sys.exit(1)
image_path = sys.argv[1]
if not os.path.exists(image_path):
    print(json.dumps({"error": f"Image not found at {image_path}"}))
    sys.exit(1)

# ============= Model =============
model_path = "D:\\AyuSahayak-main\\sw-backend\\models\\skin_model.h5"

model = load_model(model_path)
class_names = [
    "Cellulitis", "Impetigo", "Athlete-Foot", "Nail-Fungus",
    "Ringworm", "Cutaneous-larva-migrans", "Chickenpox", "Shingles"
]

def preprocess_image(path, target_size=(150, 150)):
    img = Image.open(path).convert("RGB").resize(target_size)
    arr = img_to_array(img) / 255.0
    return np.expand_dims(arr, 0)

image_array = preprocess_image(image_path)
preds = model.predict(image_array)[0]
top3 = preds.argsort()[-3:][::-1]
top3_classes = [class_names[i] for i in top3]
top3_probs = [float(preds[i]) for i in top3]

# ============= RAG =============
rag_file = "D:\\AyuSahayak-main\\sw-backend\\rag_data\\skin.txt"

with open(rag_file, "r", encoding="utf-8") as f:
    raw_text = f.read()

sections = re.split(r'\n(?=\d+\.\s)', raw_text.strip())
rag_data = {}
for sec in sections:
    match = re.match(r'(\d+)\.\s*([A-Za-z\s’\'\-()]+)', sec)
    if match:
        name = match.group(2).strip()
        clean = re.sub(r'^\d+\.\s*', '', sec).strip()
        rag_data[name.lower()] = clean

embedder = SentenceTransformer('all-MiniLM-L6-v2')
disease_names = list(rag_data.keys())
embeddings = embedder.encode([rag_data[d] for d in disease_names])
index = faiss.IndexFlatL2(embeddings.shape[1])
index.add(np.array(embeddings))

def retrieve(query, k=1):
    qv = embedder.encode([query])
    D, I = index.search(np.array(qv), k)
    return rag_data[disease_names[I[0][0]]]

rag_results = []
for i, disease in enumerate(top3_classes):
    text = retrieve(f"{disease} skin disease overview and treatment")
    rag_results.append(f"[{i+1}] {disease}\n{text}\n")

rag_summary = "\n\n".join(rag_results)

# ============= Gemini: Question Generation =============
prompt = f"""
You are an AI nurse assisting in diagnosing skin diseases.
Predictions: {top3_classes}
Context: {rag_summary[:1200]}
Generate 3–5 numbered, patient-friendly questions to refine the diagnosis.
Only include clear question lines.
"""

try:
    raw_output = gemini.generate_content(
        prompt,
        generation_config=genai.types.GenerationConfig(
            temperature=0.5,
            max_output_tokens=500
        )
    ).text.strip()
except Exception as e:
    raw_output = f"Error generating questions: {e}"

# ============= Clean the Gemini Output =============
question_lines = []
for line in raw_output.split("\n"):
    line = line.strip()
    if not line:
        continue
    # keep numbered or question-mark lines
    if re.match(r"^(Q?\d+[\.\)]\s+.+)", line, re.IGNORECASE):
        question_lines.append(line)
    elif line.endswith("?"):
        question_lines.append(line)

# fallback: extract from big blob
if not question_lines and "?" in raw_output:
    question_lines = [q.strip() + "?" for q in raw_output.split("?") if q.strip()]

# filter out intros and fillers
clean_questions = []
for q in question_lines:
    if (
        len(q.split()) > 3
        and not re.search(r"start|begin|okay|let me|context|introduction", q, re.I)
    ):
        clean_questions.append(q.strip())

# ensure max 6
clean_questions = clean_questions[:6]

# ============= Output JSON =============
result = {
    "top3_classes": top3_classes,
    "top3_probs": top3_probs,
    "rag_summary": rag_summary,
    "questions": clean_questions
}

print(json.dumps(result, ensure_ascii=False))
