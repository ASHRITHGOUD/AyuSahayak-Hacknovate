import { useEffect, useState } from "react";
import { useSearchParams, useNavigate, useLocation } from "react-router-dom";
import NurseNav from "../../components/NurseNav";
import http from "../../api/http";

export default function AISummary() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();

  const ref = params.get("ref");
  const passedPatient = location.state?.patient || null;

  const [loading, setLoading] = useState(true);
  const [aiData, setAiData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!passedPatient) {
      setError("No patient data received.");
      setLoading(false);
      return;
    }

    const loadAI = async () => {
      try {
        if (
          passedPatient.conditionType === "wound" ||
          passedPatient.conditionType === "skin"
        ) {
          setAiData(passedPatient.aiSummary);
        } else {
          const res = await http.get(`/cases/${ref}`);
          const cases = res.data.cases || [];
          const latest = cases.length > 0 ? cases[cases.length - 1] : null;
          setAiData(latest);
        }
      } catch (err) {
        setError("Failed to load AI Summary.");
      } finally {
        setLoading(false);
      }
    };

    loadAI();
  }, [ref, passedPatient]);

  if (loading) return <div className="loading">Loading...</div>;

  if (error)
    return (
      <div style={{ padding: 40, textAlign: "center", color: "red" }}>
        {error}
      </div>
    );

  const patient = passedPatient;

  // Converts multi-line string into bullet list
  const toBulletList = (text) => {
    if (!text) return [];
    return text
      .split("\n")
      .map((line) => line.replace(/^\*?\s*/g, "")) // remove leading *
      .filter((line) => line.trim().length > 0);
  };

  return (
    <>
      <NurseNav />

      <div className="summary-container">
        <button className="back-btn" onClick={() => navigate(-1)}>
          ← Back
        </button>

        {/* PROFESSIONAL HEADER */}
        <h1 className="page-title">
          <span className="page-icon">🤖</span>
          <span>AI Summary Report</span>
        </h1>

        {/* Patient Card */}
        <div className="patient-box">
          <div className="patient-info">
            <h2>
              {patient.firstName} {patient.lastName}
            </h2>
            <p>
              <b>ID:</b> {patient.patientId}
            </p>
            <p>
              <b>Gender:</b> {patient.gender}
            </p>
            <p>
              <b>Age:</b> {patient.age}
            </p>
            <p>
              <b>Condition:</b> {patient.conditionType}
            </p>
          </div>
        </div>

        {/* Summary Card */}
        <div className="summary-card">
          {!aiData && <p>No AI summary available.</p>}

          {aiData && (
            <>
              <h2 className="section-title">
                {patient.conditionType === "wound" && "🩹 WoundCare AI Results"}
                {patient.conditionType === "skin" && "🧴 SkinCare AI Results"}
                {patient.conditionType === "other" && "🩺 RuralCare AI Results"}
              </h2>

              {/* WOUND */}
              {patient.conditionType === "wound" && (
                <div className="summary-grid">
                  <p>
                    <b>Top Predictions:</b>{" "}
                    {aiData.topPredictions?.map((p) => p.name).join(", ")}
                  </p>
                  <p>
                    <b>Symptoms:</b> {aiData.symptoms?.join(", ")}
                  </p>
                  <p>
                    <b>Medications:</b> {aiData.medications?.join(", ")}
                  </p>
                  <p>
                    <b>Wound Care:</b> {aiData.woundCare}
                  </p>
                  <p>
                    <b>Home Care:</b> {aiData.homeCare}
                  </p>
                  <p>
                    <b>Red Flags:</b> {aiData.redFlags?.join(", ")}
                  </p>
                </div>
              )}

              {/* SKIN */}
              {patient.conditionType === "skin" && (
                <div className="summary-grid">
                  <p>
                    <b>Top Predictions:</b>{" "}
                    {aiData.topPredictions?.map((p) => p.name).join(", ")}
                  </p>
                  <p>
                    <b>Diagnosis:</b> {aiData.mostLikelyDiagnosis}
                  </p>
                  <p>
                    <b>Recommended Action:</b> {aiData.recommendedAction}
                  </p>
                  <p>
                    <b>Red Flags:</b> {aiData.redFlags?.join(", ")}
                  </p>
                </div>
              )}

              {/* RURAL */}
              {patient.conditionType === "other" && (
                <>
                  <div className="summary-grid">
                    <p>
                      <b>Classification:</b> {aiData.classification}
                    </p>
                    <p>
                      <b>Symptoms:</b> {aiData.symptoms?.join(", ")}
                    </p>
                    <p>
                      <b>Specialists:</b> {aiData.specialists?.join(", ")}
                    </p>
                  </div>

                  <h3 className="ds-title">📝 Detailed Summary</h3>

                  <div className="ds-card">
                    {Object.entries(aiData.summary).map(
                      ([key, value], index) =>
                        value &&
                        value.length !== 0 && (
                          <div key={index} className="ds-section">
                            <h4 className="ds-heading">
                              {key.replace(/_/g, " ")}
                            </h4>

                            {/* Array data */}
                            {Array.isArray(value) ? (
                              <ul className="ds-list">
                                {value.map((item, i) => (
                                  <li key={i}>{item}</li>
                                ))}
                              </ul>
                            ) : (
                              <ul className="ds-list">
                                {toBulletList(value).map((item, i) => (
                                  <li key={i}>{item}</li>
                                ))}
                              </ul>
                            )}
                          </div>
                        )
                    )}
                  </div>
                </>
              )}
            </>
          )}
        </div>
      </div>

      {/* STYLES */}
      <style>{`
        .summary-container {
          padding: 40px;
          max-width: 900px;
          margin: 0 auto;
          animation: fadeIn 0.4s ease;
        }

        /* Professional Header */
        .page-title {
          font-size: 30px;
          font-weight: 700;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 14px;
          margin-bottom: 25px;

          background: linear-gradient(135deg, #0aa3e0, #10d0a0);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;

          letter-spacing: 0.6px;
        }

        .page-icon {
          font-size: 28px;
          margin-top: 2px;
          filter: drop-shadow(0 1px 1px rgba(0,0,0,0.15));
        }

        .back-btn {
          background: none;
          border: none;
          font-size: 18px;
          cursor: pointer;
          color: #444;
          margin-bottom: 20px;
        }

        /* Patient Card */
        .patient-box {
          display: flex;
          align-items: flex-start;
          padding: 24px;
          border-radius: 20px;
          background: rgba(255, 255, 255, 0.55);
          backdrop-filter: blur(12px);
          box-shadow: 0 10px 25px rgba(0,0,0,0.08);
          margin-bottom: 35px;
        }

        .patient-info h2 {
          margin: 0 0 8px;
          font-size: 26px;
          font-weight: 800;
          color: #111;
        }

        .patient-info p {
          margin: 4px 0;
          font-size: 16px;
          color: #333;
        }

        /* Summary Card */
        .summary-card {
          padding: 30px;
          border-radius: 20px;
          background: #ffffff;
          box-shadow: 0 12px 30px rgba(0,0,0,0.08);
        }

        .section-title {
          font-size: 22px;
          font-weight: 700;
          margin-bottom: 20px;
          color: #0ea5e9;
        }

        .summary-grid p {
          padding: 10px 0;
          border-bottom: 1px solid #e5e7eb;
        }

        /* Detailed Summary */
        .ds-title {
          margin-top: 25px;
          font-size: 22px;
          font-weight: 700;
          color: #333;
        }

        .ds-card {
          margin-top: 14px;
          background: #fff;
          border-radius: 16px;
          padding: 22px;
          border: 1px solid #e6e6e6;
          box-shadow: 0 6px 18px rgba(0,0,0,0.05);
        }

        .ds-section {
          margin-bottom: 20px;
          padding-bottom: 12px;
          border-bottom: 1px solid #f0f0f0;
        }

        .ds-heading {
          font-size: 17px;
          font-weight: 700;
          margin-bottom: 6px;
          color: #444;
        }

        .ds-list li {
          margin-bottom: 6px;
          padding: 8px 10px;
          background: #f8fafc;
          border-radius: 6px;
          border: 1px solid #e2e8f0;
        }

        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </>
  );
}
