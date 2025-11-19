import React, { useState } from "react";
import axios from "axios";
import http from "../api/http";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export default function AIImageAnalysis({ conditionType, imageUrl, patientRef }) {
  const [stage, setStage] = useState("idle");
  const [loading, setLoading] = useState(false);
  const [stage1Result, setStage1Result] = useState(null);
  const [answers, setAnswers] = useState([]);
  const [currentQ, setCurrentQ] = useState(0);
  const [finalReport, setFinalReport] = useState(null);

  const accent =
    conditionType === "wound"
      ? "hsl(4 90% 58%)"
      : "hsl(174 62% 47%)";

  // STEP 1 – Analyze Image
  const handleAnalyze = async () => {
    if (loading) return;
    setLoading(true);
    setStage("analyzing");

    try {
      const imageResponse = await fetch(imageUrl);
      const blob = await imageResponse.blob();
      const formData = new FormData();
      formData.append("image", blob, "patient_image.jpg");

      const res = await axios.post(
        `http://localhost:5001/api/${conditionType}_stage1`,
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );

      setStage1Result(res.data);

      // If NO questions → directly show report
      if (!res.data.questions || res.data.questions.length === 0) {
        handleSubmitAnswers([], res.data);
      } else {
        setAnswers(new Array(res.data.questions.length).fill(""));
        setStage("questions");
      }
    } catch (err) {
      alert("Error analyzing image. Check AI backend logs.");
      setStage("idle");
    } finally {
      setLoading(false);
    }
  };

  // Input handler
  const handleAnswerChange = (e) => {
    const updated = [...answers];
    updated[currentQ] = e.target.value;
    setAnswers(updated);
  };

  // Move to NEXT question
  const nextQuestion = () => {
    if (!answers[currentQ]) return alert("Please answer this question.");
    if (currentQ < stage1Result.questions.length - 1) {
      setCurrentQ(currentQ + 1);
    } else {
      handleSubmitAnswers(); // last question → submit
    }
  };

  // STEP 2 – Generate Final Report
  const handleSubmitAnswers = async () => {
    setLoading(true);
    setStage("generating");

    try {
      const payload = {
        top3_classes: stage1Result.top3_classes,
        top3_probs: stage1Result.top3_probs,
        rag_summary: stage1Result.rag_summary,
        questions: stage1Result.questions,
        answers,
        patient_ref: patientRef,
        image_url: imageUrl,
      };

      const res = await axios.post(
        `http://localhost:5001/api/${conditionType}_stage2`,
        payload
      );

      setFinalReport(res.data.final_report || "No detailed AI report available.");
      setStage("report");

      // SAVE TO BACKEND
      const saveUrl =
        conditionType === "wound"
          ? "/patients/ai/save-woundcare"
          : "/patients/ai/save-skincare";

      const dataKey =
        conditionType === "wound" ? "wound_result" : "skin_result";

      const aiResult = {
        topPredictions: stage1Result.top3_classes.map((cls, i) => ({
          name: cls,
          confidence: (stage1Result.top3_probs[i] * 100).toFixed(2),
        })),
        aiFinalReport: res.data.final_report,
        ragSummary: stage1Result.rag_summary,
        patientAnswers: answers,
      };

      await http.post(saveUrl, { patient_ref: patientRef, [dataKey]: aiResult });
    } catch (err) {
      alert("Error generating or saving report.");
      setStage("idle");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="ai-analysis">
      <style>{`
        .ai-analysis {
          background: hsl(210 20% 98%);
          border-radius: 16px;
          padding: 32px;
          animation: fadeInUp 0.4s ease-out;
        }
        .ai-card {
          background: white;
          border-radius: 16px;
          box-shadow: 0 4px 8px rgba(0,0,0,0.05);
          padding: 28px;
          border-left: 4px solid ${accent};
          margin-bottom: 26px;
        }
        .ai-input {
          width: 100%;
          padding: 12px;
          border-radius: 8px;
          border: 1px solid #ccc;
          outline: none;
          margin-top: 12px;
        }
        .ai-btn {
          padding: 12px 24px;
          background: ${accent};
          color: white;
          border: none;
          border-radius: 8px;
          font-weight: 600;
          cursor: pointer;
          margin-top: 16px;
        }
        .markdown-box {
          line-height: 1.6;
          font-size: 15px;
        }
        .markdown-box p { margin-bottom: 10px; }
        .markdown-box ul { margin-left: 16px; }
      `}</style>

      {/* 🟢 STAGE 1 – INITIAL */}
      {stage === "idle" && (
        <div className="ai-card" style={{ textAlign: "center" }}>
          <p style={{ color: "gray", marginBottom: "12px" }}>
            Click below to start AI-powered analysis
          </p>
          <button className="ai-btn" onClick={handleAnalyze} disabled={loading}>
            {loading ? "⏳ Analyzing..." : "🔍 Analyze Image with AI"}
          </button>
        </div>
      )}

      {/* 🟡 LOADING */}
      {loading && stage !== "idle" && (
        <div className="ai-card" style={{ textAlign: "center", color: "gray" }}>
          ⏳ Processing... Please wait.
        </div>
      )}

      {/* 🧠 QUESTION STAGE */}
      {stage === "questions" && stage1Result && (
        <div className="ai-card">
          <h2 style={{ textAlign: "center", color: accent }}>
            🧠 Diagnostic Questions ({currentQ + 1}/{stage1Result.questions.length})
          </h2>

          <p className="ai-question" style={{ marginTop: "14px" }}>
            {stage1Result.questions[currentQ]}
          </p>

          <input
            type="text"
            value={answers[currentQ]}
            onChange={handleAnswerChange}
            placeholder="Type your answer..."
            className="ai-input"
          />

          <div style={{ textAlign: "center" }}>
            <button className="ai-btn" onClick={nextQuestion}>
              {currentQ < stage1Result.questions.length - 1
                ? "Next →"
                : "Generate Report"}
            </button>
          </div>
        </div>
      )}

      {/* ✔ FINAL REPORT */}
      {stage === "report" && finalReport && (
        <div className="ai-card">
          <h2 style={{ textAlign: "center", color: accent, marginBottom: "18px" }}>
            🩺 Unified AI Medical Report
          </h2>

          {/* TOP PREDICTIONS */}
          <div style={{ background: "#F8F9FA", padding: "14px", borderRadius: "10px", marginBottom: "20px" }}>
            <h3>🎯 Top Predictions</h3>
            <ul>
              {stage1Result.top3_classes.map((cls, i) => (
                <li key={i}>
                  <strong>{cls}</strong> — {(stage1Result.top3_probs[i] * 100).toFixed(2)}%
                </li>
              ))}
            </ul>
          </div>

          {/* REFERENCE KNOWLEDGE */}
          <div style={{ marginBottom: "20px" }}>
            <h3>📚 Reference Knowledge</h3>
            <div className="markdown-box">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {stage1Result.rag_summary}
              </ReactMarkdown>
            </div>
          </div>

          {/* CLINICAL SUMMARY */}
          <div>
            <h3>🧾 Clinical Summary</h3>
            <div className="markdown-box">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {finalReport}
              </ReactMarkdown>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
