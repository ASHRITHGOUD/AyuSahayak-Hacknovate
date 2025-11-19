// RuralCareAI.jsx
import React, { useState, useEffect, useRef } from "react";
import "./RuralCareAI.css";
import ChatWindow from "../../components/components-rural/ChatWindow";
import { useNavigate } from "react-router-dom";
import { useLocation } from "react-router-dom";
import http from "../../api/http";




export default function RuralCareAI() {
  const [messages, setMessages] = useState([
    { type: "bot", sender: "bot", text: "👋 Hello! What symptoms and vitals is your patient having?" },
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const [lockScroll, setLockScroll] = useState(false);

  const [processingCase, setProcessingCase] = useState(false);
  const [currentQuestions, setCurrentQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [caseInfo, setCaseInfo] = useState({ caseId: null, initialText: null });

  const [agents, setAgents] = useState([
    { id: "symptom", title: "Symptom Agent", subtitle: "Waiting for symptom extraction...", status: "idle", output: "", expanded: true, icon: "🧾", visible: false },
    { id: "complexity", title: "Complexity Agent", subtitle: "Determining case complexity...", status: "idle", output: "", expanded: true, icon: "🧠", visible: false },
    { id: "simplify", title: "Simplify Agent", subtitle: "Awaiting simplified summary...", status: "idle", output: "", expanded: true, icon: "✂️", visible: false },
  ]);

  const resultCache = useRef(null);
  const shownMessagesRef = useRef(new Set());
  const chatEndRef = useRef(null);
  const navigate = useNavigate();
  const { search } = useLocation();
const params = new URLSearchParams(search);
const patientRef = params.get("ref");  // PAT000014
const showToast = (msg) => {
  const t = document.createElement("div");
  t.innerText = msg;
  t.style.position = "fixed";
  t.style.bottom = "25px";
  t.style.right = "25px";
  t.style.padding = "14px 18px";
  t.style.background = "hsl(142 75% 40%)";
  t.style.color = "white";
  t.style.fontSize = "15px";
  t.style.borderRadius = "8px";
  t.style.boxShadow = "0 4px 10px rgba(0,0,0,0.2)";
  t.style.zIndex = 9999;
  t.style.opacity = 1;
  t.style.transition = "opacity 0.6s ease";

  document.body.appendChild(t);

  setTimeout(() => { t.style.opacity = 0; }, 2000);
  setTimeout(() => { t.remove(); }, 2600);
};


useEffect(() => {
  if (!lockScroll) {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }
}, [messages, agents, lockScroll]);



  const appendMessage = (m) => setMessages((p) => [...p, m]);
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

  const startThinkingBubble = (message = "💭") => {
    setLockScroll(true); 
    setIsTyping(true);
    appendMessage({ type: "bot", sender: "bot", text: message, isThinking: true });
    const interval = setInterval(() => {
      setMessages((prev) => {
        const copy = [...prev];
        if (copy.length && copy[copy.length - 1].isThinking) {
          const base = message;
          const dots = ".".repeat(((copy[copy.length - 1].text.match(/\./g) || []).length + 1) % 4);
          copy[copy.length - 1] = { ...copy[copy.length - 1], text: `${base}${dots}` };
        }
        return copy;
      });
    }, 450);

    return () => {
      clearInterval(interval);
      setMessages((prev) => prev.filter((m) => !m.isThinking));
      setIsTyping(false);
      setLockScroll(false);
    };
  };

  const updateAgent = (nextAgents, id, status, output) => {
    const idx = nextAgents.findIndex((a) => a.id === id);
    if (idx === -1) return;
    const prev = nextAgents[idx];
    nextAgents[idx] = {
      ...prev,
      status,
      visible: true,
      output: output ? (prev.output ? `${prev.output}\n\n${output}` : output) : prev.output,
    };
  };

  const ensureAgentPlaceholderInMessages = (agentId) => {
    setMessages((prev) => {
      const found = prev.find((m) => m.type === "agent" && m.agentId === agentId);
      if (found) return prev;
      return [...prev, { type: "agent", agentId, sender: "agent" }];
    });
  };

  const finalizeAgent = (id, outputText) => {
    setAgents((prev) => {
      const next = [...prev];
      const idx = next.findIndex((a) => a.id === id);
      if (idx === -1) return next;

      const subtitleMap = {
        symptom: "Symptoms extracted",
        complexity: "Case complexity determined",
        simplify: "Summary ready"
      };

      next[idx] = {
        ...next[idx],
        status: "done",
        visible: true,
        subtitle: subtitleMap[id] || next[idx].subtitle,
        output: outputText || next[idx].output || "Done."
      };

      return next;
    });

    ensureAgentPlaceholderInMessages(id);
  };

  const processProgressMessage = (msg) => {
    const t = (msg || "").toLowerCase();

    setAgents((prev) => {
      const next = [...prev];
      if (
        t.includes("shortlisting") ||
        t.includes("collecting patient symptoms") ||
        (t.includes("symptom") && !t.includes("complex"))
      ) {
        updateAgent(next, "symptom", "running", msg);
        ensureAgentPlaceholderInMessages("symptom");
        if (t.includes("shortlisting done") && resultCache.current?.symptoms) {
          const sym = resultCache.current.symptoms;
          finalizeAgent("symptom", `Extracted Symptoms:\n${Array.isArray(sym) ? sym.join("\n") : String(sym)}`);
        }
        return next;
      }

      if (
        t.includes("complexity") ||
        t.includes("risk level") ||
        t.includes("classification")
      ) {
        const hasValue = t.includes("low") || t.includes("medium") || t.includes("high");
        updateAgent(next, "complexity", hasValue ? "done" : "running", msg);
        ensureAgentPlaceholderInMessages("complexity");
        return next;
      }

      if (
        t.includes("simplifying") ||
        t.includes("final summary")
      ) {
        updateAgent(next, "simplify", "running", msg);
        ensureAgentPlaceholderInMessages("simplify");
        return next;
      }

      updateAgent(next, "simplify", "running", msg);
      ensureAgentPlaceholderInMessages("simplify");
      return next;
    });
  };

  const populateFinalResultIntoAgentsSequential = async (result) => {
    resultCache.current = result;

    const symptoms = result.symptoms || [];
    finalizeAgent(
      "symptom",
      `Extracted Symptoms:\n${symptoms.length ? symptoms.join("\n") : "No symptoms extracted."}`
    );

    await sleep(600);

    const complexityLabel =
      result.complexity ||
      result.route ||
      "unknown";

    setAgents((prev) => {
      const next = [...prev];
      const idx = next.findIndex((a) => a.id === "complexity");
      if (idx !== -1) {
        next[idx] = {
          ...next[idx],
          status: "done",
          subtitle: "Complexity determined",
          visible: true,
          output: `Classification: ${complexityLabel}`
        };
      }
      return next;
    });

    await sleep(600);

    const route = (result?.route || "").toLowerCase();
    const specialists =
      Array.isArray(result?.specialists_involved) ? result.specialists_involved : [];

    if (route === "low" || specialists.length === 0) {
      appendMessage({
        type: "banner",
        sender: "bot",
        text:
          `<div class='banner-title'>📌 Case Details</div>` +
          `Case ID: <b>${result?.case_id || "N/A"}</b><br>` +
          `Triage Level: <b>${route === "medium" ? "Medium Risk" : "Low Risk"}</b>`
      });
    } else if (route === "medium") {
      appendMessage({
        type: "banner",
        sender: "bot",
        text: "🧑‍⚕️ Case escalated to Multi-Disciplinary Team.",
        risk: "medium"
      });

      appendMessage({
        type: "banner",
        sender: "bot",
        text: `Specialists engaged:\n${specialists.map(s => "• " + s).join("\n")}`,
      });
    }

    await sleep(700);

    const simplified = result.final_summary_simplified || null;

    if (simplified && typeof simplified === "object") {
      const parts = [
        `CONDITION SUMMARY:\n${simplified["CONDITION SUMMARY"] || ""}`,
        `POSSIBLE CAUSES:\n${simplified["POSSIBLE CAUSES"] || ""}`,
        `NURSE ACTIONS:\n${simplified["NURSE ACTIONS"] || ""}`,
        `ESCALATION CRITERIA:\n${simplified["ESCALATION CRITERIA"] || ""}`,
        `MEDICINES ADVISED:\n${
          Array.isArray(simplified["MEDICINES ADVISED"])
            ? simplified["MEDICINES ADVISED"].join("\n")
            : simplified["MEDICINES ADVISED"] || ""
        }`
      ];

      if (Array.isArray(result.specialists_involved) && result.specialists_involved.length) {
        parts.push(
          `SPECIALISTS INVOLVED:\n${result.specialists_involved
            .map((s) => `• ${s}`)
            .join("\n")}`
        );
      }

      finalizeAgent("simplify", parts.join("\n\n"));
    } else {
      finalizeAgent(
        "simplify",
        result.moderator_technical_summary || "No simplified summary available."
      );
    }
  };

  const populateFinalResultIntoAgents = (result) => {
    populateFinalResultIntoAgentsSequential(result).catch((e) => {
      console.error("Error populating agents:", e);
      setAgents((prev) => prev.map((a) => ({ ...a, visible: true })));
    });
  };

  const handleSendMessage = async (userInput) => {
    if (!userInput?.trim()) return;

    appendMessage({ type: "user", sender: "user", text: userInput });

    if (
      caseInfo.caseId &&
      currentQuestions.length > 0 &&
      currentQuestionIndex < currentQuestions.length
    ) {
      const currentQuestion = currentQuestions[currentQuestionIndex];
      const newAnswers = { [currentQuestion]: userInput };
      setAnswers((p) => ({ ...p, ...newAnswers }));
      await handleNextQuestion(newAnswers);
      return;
    }

    setCaseInfo((prev) => ({ ...prev, initialText: userInput }));
    const stopThinking = startThinkingBubble("💭 Analyzing initial patient input…");

    try {
      const resp = await fetch("http://127.0.0.1:8000/api/start_case", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ patient_input: userInput }),
      });
      const data = await resp.json();
      stopThinking();

      if (!resp.ok) {
        appendMessage({
          type: "bot",
          sender: "bot",
          text: `⚠️ Error starting case: ${data.detail || resp.statusText}`,
        });
        return;
      }

      const cid = data.case_id;
      setCaseInfo((p) => ({ ...p, caseId: cid }));
      const firstQ = data.first_follow_up_question;

      if (firstQ) {
        appendMessage({ type: "bot", sender: "bot", text: "💬 Please answer the next question carefully." });
        appendMessage({ type: "bot", sender: "bot", text: `🩺 ${firstQ}` });
        setCurrentQuestions([firstQ]);
        setCurrentQuestionIndex(0);
      } else {
        await finalizeCaseViaWebSocket({});
      }
    } catch (e) {
      appendMessage({
        type: "bot",
        sender: "bot",
        text: `⚠️ Network error: ${e.message}`,
      });
    }
  };

  const handleNextQuestion = async (updatedAnswers) => {
    setIsTyping(true);
    const stop = startThinkingBubble("💭 Processing your answer…");

    try {
      const resp = await fetch("http://127.0.0.1:8000/api/next_question", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ case_id: caseInfo.caseId, answers: updatedAnswers }),
      });
      const data = await resp.json();
      stop();

      if (!resp.ok) {
        appendMessage({
          type: "bot",
          sender: "bot",
          text: `⚠️ ${data.detail || "Answer rejected"}`,
        });
        setIsTyping(false);
        return;
      }

      appendMessage({
        type: "bot",
        sender: "bot",
        text: "✅ Response recorded.",
      });

      if (data.warning) {
        appendMessage({
          type: "bot",
          sender: "bot",
          text: `⚠️ Guardrail: ${data.warning}`,
        });

        if (data.next_question) {
          appendMessage({
            type: "bot",
            sender: "bot",
            text: `🔁 Please answer again:\n🩺 ${data.next_question}`,
          });
        }

        setIsTyping(false);
        return;
      }

      if (!data.done) {
        const nextQ = data.next_question;
        if (nextQ) {
          setCurrentQuestions((p) => [...p, nextQ]);
          setCurrentQuestionIndex((i) => i + 1);
          appendMessage({
            type: "bot",
            sender: "bot",
            text: `🩺 ${nextQ}`,
          });
        }
      } else {
        await finalizeCaseViaWebSocket(updatedAnswers);
      }
    } catch (e) {
      stop();
      appendMessage({
        type: "bot",
        sender: "bot",
        text: `⚠️ Network error: ${e.message}`,
      });
    }

    setIsTyping(false);
  };

  const finalizeCaseViaWebSocket = async (finalAnswers) => {
    setAgents((a) =>
      a.map((ag) => ({
        ...ag,
        status: "idle",
        output: "",
        visible: false,
      }))
    );

    setIsTyping(true);
    setProcessingCase(true);

    const stopThinking = startThinkingBubble("💭 Collecting patient symptoms");
    stopThinking();

    try {
      const ws = new WebSocket("ws://127.0.0.1:8000/ws/process_case");

      ws.onopen = () => {
        ws.send(JSON.stringify({ case_id: caseInfo.caseId, answers: finalAnswers }));
      };

ws.onmessage = (evt) => {
  let data = {};
  try {
    data = JSON.parse(evt.data);
  } catch {
    data = { type: "progress", message: evt.data };
  }

  // ---------------------------------------------------------
  // HIGH RISK CASE
  // ---------------------------------------------------------
  if (data.type === "final" && data.result?.route === "high") {

    // ⭐ SAVE HIGH CASE TO NODE BACKEND
    const highPayload = {
       patient_ref: patientRef,
      case_id: data?.result?.case_id,
      symptoms: data?.result?.symptoms || [],
      classification: "high",
      summary: data?.result?.final_summary_simplified || {},
      specialists: data?.result?.specialists_involved || [],
      escalation_reason: "High-risk red-flag symptoms",
      timestamp: new Date().toISOString(),
    };

    console.log(">>> HIGH CASE PAYLOAD SENT TO BACKEND:", highPayload);

   // ⭐ SAVE HIGH CASE TO BACKEND USING AUTHENTICATED AXIOS
http.post("/save_case", highPayload)
  .then((res) => {
    console.log("💾 HIGH case saved:", res.data);
    showToast("🚨 High-Risk Case Saved to Patient Record");
  })
  .catch((err) => {
    console.error("❌ HIGH save failed:", err);
    showToast("❌ Saving failed");
  });




    // --- EXISTING EMERGENCY UI CODE ---
    setMessages((prev) => prev.filter((m) => m.type !== "agent"));

    setAgents((prev) =>
      prev.map((a) => ({
        ...a,
        visible: false,
        output: "",
        status: "idle",
      }))
    );

    appendMessage({
      type: "emergency",
      sender: "bot",
      data: data.result.final_summary_simplified,
    });

    appendMessage({
      type: "bot",
      sender: "bot",
      text:
        "⚠️ This case requires immediate medical attention. Please escalate without delay.",
    });

    try { ws.close(); } catch {}

    setIsTyping(false);
    setProcessingCase(false);
    return; // VERY IMPORTANT — DO NOT TOUCH
  }

  // ---------------------------------------------------------
  // SYMPTOM EVENT
  // ---------------------------------------------------------
  if (data.type === "symptoms") {
    const symptoms = data.symptoms || [];
    resultCache.current = resultCache.current || {};
    resultCache.current.symptoms = symptoms;

    finalizeAgent(
      "symptom",
      `Extracted Symptoms:\n${symptoms.length ? symptoms.join("\n") : "None"}`
    );

    return;
  }

  // ---------------------------------------------------------
  // PROGRESS EVENT
  // ---------------------------------------------------------
  if (data.type === "progress") {
    processProgressMessage(data.message);
  }

  // ---------------------------------------------------------
  // LOW / MEDIUM FINAL EVENT
  // ---------------------------------------------------------
  if (data.type === "final") {

    // ⭐ SAVE LOW/MEDIUM CASE TO NODE BACKEND
    const payload = {
       patient_ref: patientRef,
      case_id: data?.result?.case_id,
      symptoms: data?.result?.symptoms || [],
      classification: data?.result?.complexity || data?.result?.route,
      summary: data?.result?.final_summary_simplified || {},
      specialists: data?.result?.specialists_involved || [],
      timestamp: new Date().toISOString(),
    };

    console.log(">>> LOW/MEDIUM PAYLOAD SENT TO BACKEND:", payload);

// ⭐ SAVE LOW/MEDIUM CASE USING AUTHENTICATED AXIOS
http.post("/save_case", payload)
  .then((res) => {
    console.log("💾 LOW/MEDIUM saved:", res.data);
    showToast("✅ Case Saved to Patient Record");
  })
  .catch((err) => {
    console.error("❌ LOW/MEDIUM save failed:", err);
    showToast("❌ Saving failed");
  });



    // --- EXISTING LOW/MEDIUM UI CODE ---
    resultCache.current = data.result;
    populateFinalResultIntoAgents(data.result);

    setAgents((prev) =>
      prev.map((a) => ({ ...a, status: "done", visible: true }))
    );

    appendMessage({
      type: "bot",
      sender: "bot",
      text: "✅ Case processing complete. See agent cards above.",
    });

    try { ws.close(); } catch {}

    setTimeout(() => {
      setCaseInfo({ caseId: null, initialText: null });
      setCurrentQuestions([]);
      setCurrentQuestionIndex(0);
      setAnswers({});
      setIsTyping(false);
      setProcessingCase(false);
    }, 900);
  }
};


      ws.onerror = () => {
        appendMessage({
          type: "bot",
          sender: "bot",
          text: "⚠️ WebSocket error.",
        });
        setIsTyping(false);
        setProcessingCase(false);
      };

      ws.onclose = () => {
        setIsTyping(false);
        setProcessingCase(false);
      };
    } catch (e) {
      appendMessage({
        type: "bot",
        sender: "bot",
        text: `⚠️ WebSocket exception: ${e.message}`,
      });
      setIsTyping(false);
      setProcessingCase(false);
    }
  };

  const toggleAgentExpanded = (id) => {
    setAgents((prev) =>
      prev.map((a) =>
        a.id === id ? { ...a, expanded: !a.expanded } : a
      )
    );
  };

  return (
    <div className="rural-ai-page">
    <div className="app-shell dark-glass">
      <header className="app-header animate-fade-in-up back-header">
  <button
    className="back-button"
    onClick={() => navigate("/nurse/patients")}
  >
    ← Back
  </button>

  <div className="brand animate-fade-in">
    🩺 RuralCareAI — Clinical Triage
  </div>
</header>


      <main className="main-area">
        <ChatWindow
          messages={messages}
          onSendMessage={handleSendMessage}
          isTyping={isTyping}
          isProcessingCase={processingCase}
          agents={agents}
          toggleAgent={toggleAgentExpanded}
        />
        <div ref={chatEndRef} />
      </main>
    </div>
    </div>
  );
}
