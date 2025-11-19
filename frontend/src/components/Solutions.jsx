
import "./Solutions.css";

export default function Solutions() {
  return (
    <section className="solutions-section">

      {/* Header */}
      <div className="solutions-header">
        <h1>AyuSahayak Solutions</h1>
        <p>
          Powerful AI-driven healthcare ecosystem connecting village nurses, doctors, 
          and hospitals for seamless and affordable medical services.
        </p>
      </div>

      {/* GRID BLOCKS */}
      <div className="solutions-grid">

        {/* 1. Skin AI */}
        <div className="solution-card">
          <div className="icon">🩺</div>
          <h3>Skin AI Detection</h3>
          <p>
            Upload skin photos and get AI-based preliminary analysis for 30+ common skin issues, 
            helping doctors make faster and accurate decisions.
          </p>
        </div>

        {/* 2. Wound AI */}
        <div className="solution-card">
          <div className="icon">🩹</div>
          <h3>Wound AI Assessment</h3>
          <p>
            Smart AI evaluates wound condition, infection risk, and healing progress to assist rural nurses and doctors.
          </p>
        </div>

        {/* 3. Rural AI */}
        <div className="solution-card">
          <div className="icon">🤖</div>
          <h3>Rural AI – Symptom Detection</h3>
          <p>
            AI-based symptom checker helps nurses identify possible conditions and provide 
            quick first-aid support before the doctor joins.
          </p>
        </div>

        {/* 4. Video Consultation */}
        <div className="solution-card">
          <div className="icon">📞</div>
          <h3>Digital Video Consultation</h3>
          <p>
            Seamless village-to-hospital video consultations assisted by trained nurses for accurate diagnosis.
          </p>
        </div>

        {/* 5. Hospital Telemedicine */}
        <div className="solution-card">
          <div className="icon">🏥</div>
          <h3>Hospital Telemedicine Integration</h3>
          <p>
            Hospitals can digitally serve rural regions, reduce workload, and expand reach without new branches.
          </p>
        </div>

        {/* 6. Emergency Alerts */}
        <div className="solution-card">
          <div className="icon">⚠</div>
          <h3>AI Emergency Triage</h3>
          <p>
            Automatically detects critical symptoms, sends urgent alerts to doctors, and prioritizes patient handling.
          </p>
        </div>

        {/* 7. Payments */}
        <div className="solution-card">
          <div className="icon">💳</div>
          <h3>Integrated Payments</h3>
          <p>
            Razorpay-powered payment gateway ensures secure billing and generates automatic receipts.
          </p>
        </div>

        {/* 8. EHR Records */}
        <div className="solution-card">
          <div className="icon">📂</div>
          <h3>Electronic Health Records</h3>
          <p>
            Every patient gets a permanent digital medical history containing consultations, prescriptions, and reports.
          </p>
        </div>

        {/* 9. Hospital Owner Dashboard */}
        <div className="solution-card">
          <div className="icon">📊</div>
          <h3>Hospital Admin Dashboard</h3>
          <p>
            Provides analytics, staff management, revenue insights, and audit logs for hospital owners.
          </p>
        </div>

        {/* 10. Nurse Module */}
        <div className="solution-card">
          <div className="icon">👩‍⚕</div>
          <h3>Nurse Operations Module</h3>
          <p>
            Nurses can register patients, upload vitals, initiate payments, and begin consultations with hospitals.
          </p>
        </div>

        {/* 11. Doctor Module */}
        <div className="solution-card">
          <div className="icon">👨‍⚕</div>
          <h3>Doctor Consultation Suite</h3>
          <p>
            Doctors access patient data, join video calls, view AI scans, and provide e-prescriptions instantly.
          </p>
        </div>

        {/* 12. Chat & Notifications */}
        <div className="solution-card">
          <div className="icon">🔔</div>
          <h3>Real-time Chat & Alerts</h3>
          <p>
            In-app chat + push notifications for new consultations, prescriptions, payments, and emergencies.
          </p>
        </div>

        {/* 13. Admin / Developer Controls */}
        <div className="solution-card">
          <div class="icon">🛠</div>
          <h3>Developer Admin Panel</h3>
          <p>
            Controls hospital onboarding, account creation, audit monitoring, and system-wide security.
          </p>
        </div>

      </div>
    </section>
  );
}