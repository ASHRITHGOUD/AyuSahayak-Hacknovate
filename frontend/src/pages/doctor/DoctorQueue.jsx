import { useEffect, useState } from 'react';
import DoctorNav from '../../components/DoctorNav';
import http from '../../api/http';

export default function DoctorQueue() {
  const [list, setList] = useState([]);
  const [msg, setMsg] = useState('');

  const load = async () => {
    try {
      const { data } = await http.get('/doctor/consultations?status=in_queue');
      setList(data);
    } catch { setList([]); }
  };

  useEffect(()=>{ load(); const t=setInterval(load, 8000); return ()=>clearInterval(t); }, []);

  const accept = async (id) => {
    setMsg('');
    try {
      await http.patch(`/doctor/consultations/${id}/accept`);
      window.location.href = '/doctor/in-progress';
    } catch (e) { setMsg(e.response?.data?.message || 'Failed'); }
  };

  const decline = async (id) => {
    const reason = prompt('Reason for decline?') || 'no reason';
    try {
      await http.patch(`/doctor/consultations/${id}/decline`, { reason });
      load();
    } catch (e) {}
  };

  return (
    <div className="queue-page">
      <style>{`
/* =========================================
   DOCTOR QUEUE – STRICT PALETTE GLASS UI
   Allowed colors:
   #ffffff (#fff), #ffebee, #e8f5e9
   Button gradient: #0d47a1 → #1565c0
   ========================================= */

:root {
  --color-white: #ffffff;
  --color-success-bg: #e8f5e9;
  --color-error-bg: #ffebee;

  --btn-gradient-from: #0d47a1;
  --btn-gradient-to: #1565c0;

  /* Neutrals via opacity */
  --glass-bg-strong: rgba(255, 255, 255, 0.97);
  --glass-bg-soft: rgba(255, 255, 255, 0.92);
  --glass-border-strong: rgba(0, 0, 0, 0.08);
  --glass-border-soft: rgba(0, 0, 0, 0.06);

  --shadow-soft: 0 10px 40px -10px rgba(0, 0, 0, 0.08);
  --shadow-softer: 0 18px 45px -18px rgba(0, 0, 0, 0.12);

  --text-strong: rgba(0, 0, 0, 0.85);
  --text-main: rgba(0, 0, 0, 0.72);
  --text-muted: rgba(0, 0, 0, 0.5);
}

/* =========================================
   PAGE / CONTAINER
   ========================================= */

.queue-page {
  min-height: 100vh;
  background:
    radial-gradient(circle at top left, rgba(255, 255, 255, 0.92), #ffffff 60%),
    #ffffff;
}

.queue-container {
  padding: 24px;
  max-width: 1400px;
  margin: 0 auto 56px;
  position: relative;
  animation: fadeInUp 0.5s ease-out;
}

/* Glass workspace plate */
.queue-container::before {
  content: "";
  position: absolute;
  inset: 24px 0 0;
  margin: 0 auto;
  max-width: 1360px;
  border-radius: 24px;
  background: linear-gradient(
    135deg,
    rgba(255, 255, 255, 0.99),
    rgba(255, 255, 255, 0.92)
  );
  border: 1px solid rgba(255, 255, 255, 0.9);
  box-shadow: var(--shadow-soft);
  backdrop-filter: blur(18px);
  z-index: -1;
}

/* Animations */
@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(20px); }
  to   { opacity: 1; transform: translateY(0); }
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50%      { opacity: 0.6; }
}

/* =========================================
   HEADER
   ========================================= */

.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 28px;
}

.page-header h1 {
  font-size: clamp(2rem, 3vw, 2.2rem);
  font-weight: 800;
  color: var(--text-strong);
  margin: 0;
  display: inline-flex;
  align-items: center;
  gap: 10px;
  letter-spacing: -0.03em;
}

.page-header h1::after {
  content: "";
  height: 3px;
  width: 72px;
  border-radius: 999px;
  background: rgba(0, 0, 0, 0.12);
  display: inline-block;
}

/* Refresh indicator */
.refresh-indicator {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.85rem;
  color: var(--text-muted);
}

.live-dot {
  width: 8px;
  height: 8px;
  background: rgba(0, 0, 0, 0.85);
  border-radius: 50%;
  animation: pulse 2s infinite;
}

/* =========================================
   ALERT
   ========================================= */

.alert {
  padding: 12px 14px;
  border-radius: 12px;
  margin-bottom: 18px;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 8px;
  background: #ffebee;
  color: var(--text-main);
  border: 1px solid rgba(0, 0, 0, 0.08);
  font-size: 0.9rem;
}

/* =========================================
   GRID / QUEUE CARDS
   ========================================= */

.queue-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(360px, 1fr));
  gap: 24px;
}

/* Glass card */
.queue-card {
  background: var(--glass-bg-strong);
  border-radius: 20px;
  padding: 22px 20px 18px;
  box-shadow: var(--shadow-soft);
  border: 1.5px solid var(--glass-border-strong);
  backdrop-filter: blur(14px);
  transition:
    transform 220ms ease,
    box-shadow 220ms ease,
    border-color 220ms ease;
}

.queue-card:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-softer);
  border-color: rgba(0, 0, 0, 0.14);
}

/* Urgent variant: subtle emphasis */
.queue-card.urgent {
  border-color: rgba(0, 0, 0, 0.16);
  box-shadow:
    0 0 0 1px rgba(0, 0, 0, 0.06),
    0 18px 45px -18px rgba(0, 0, 0, 0.18);
}

/* Card header (ID + priority) */
.card-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 16px;
}

.consult-id {
  font-family: monospace;
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--text-main);
  background: rgba(255, 255, 255, 0.98);
  padding: 6px 10px;
  border-radius: 999px;
  border: 1px solid var(--glass-border-soft);
}

/* Priority badge */
.priority-badge {
  display: inline-flex;
  align-items: center;
  padding: 5px 10px;
  border-radius: 999px;
  font-size: 0.8rem;
  font-weight: 600;
  gap: 4px;
}

.priority-normal {
  background: #e8f5e9;
  color: var(--text-main);
}

.priority-urgent {
  background: #ffebee;
  color: var(--text-main);
  animation: pulse 2s infinite;
}

/* =========================================
   PATIENT SECTION
   ========================================= */

.patient-section {
  margin-bottom: 16px;
  padding: 14px 12px;
  background: var(--glass-bg-soft);
  border-radius: 16px;
  border: 1px solid var(--glass-border-soft);
}

.patient-info {
  display: flex;
  align-items: center;
  gap: 14px;
  margin-bottom: 10px;
}

.patient-avatar {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid rgba(255, 255, 255, 0.98);
  box-shadow: 0 6px 18px -10px rgba(0, 0, 0, 0.55);
}

/* Patient details */
.patient-details h3 {
  font-size: 1rem;
  font-weight: 700;
  color: var(--text-strong);
  margin: 0 0 4px 0;
}

.patient-meta {
  font-size: 0.85rem;
  color: var(--text-muted);
}

/* Complaint box */
.complaint-box {
  padding: 10px 10px;
  background: #ffffff;
  border-radius: 12px;
  border-left: 3px solid rgba(0, 0, 0, 0.18);
}

.complaint-label {
  font-size: 0.7rem;
  font-weight: 600;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.06em;
  margin-bottom: 4px;
}

.complaint-text {
  font-size: 0.9rem;
  color: var(--text-main);
  line-height: 1.5;
}

/* =========================================
   CARD META (TIME)
   ========================================= */

.card-meta {
  display: flex;
  align-items: center;
  gap: 14px;
  margin-bottom: 14px;
  font-size: 0.8rem;
  color: var(--text-muted);
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 6px;
}

/* =========================================
   BUTTONS / ACTIONS
   ========================================= */

.card-actions {
  display: flex;
  gap: 10px;
}

/* Base button */
.btn {
  flex: 1;
  padding: 0.75rem 1.2rem;
  border-radius: 999px;
  font-weight: 600;
  font-size: 0.9rem;
  cursor: pointer;
  transition:
    transform 220ms ease,
    box-shadow 220ms ease,
    background 160ms ease,
    border-color 160ms ease,
    color 160ms ease;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
}

/* Accept – use primary gradient */
.btn-accept {
  position: relative;
  background: linear-gradient(
    135deg,
    var(--btn-gradient-from),
    var(--btn-gradient-to)
  );
  color: #ffffff;
  box-shadow:
    0 0 0 1px rgba(255, 255, 255, 0.7),
    0 12px 30px -10px rgba(0, 0, 0, 0.35);
  overflow: hidden;
}

.btn-accept::before {
  content: "";
  position: absolute;
  inset: -40%;
  background: radial-gradient(
    circle at 0 0,
    rgba(255, 255, 255, 0.35),
    transparent 60%
  );
  opacity: 0.4;
  transition: opacity 200ms ease, transform 220ms ease;
}

.btn-accept:hover {
  transform: translateY(-4px);
  box-shadow:
    0 0 0 1px rgba(255, 255, 255, 0.9),
    0 16px 45px -12px rgba(0, 0, 0, 0.45);
}

.btn-accept:hover::before {
  opacity: 0.65;
  transform: translate3d(8px, -8px, 0);
}

/* Decline – outline, uses error bg on hover */
.btn-decline {
  background: rgba(255, 255, 255, 0.98);
  border: 1px solid var(--glass-border-soft);
  color: var(--text-main);
}

.btn-decline:hover {
  background: #ffebee;
  border-color: rgba(0, 0, 0, 0.14);
  transform: translateY(-2px);
  box-shadow: 0 8px 22px -14px rgba(0, 0, 0, 0.3);
}

/* View details – full width secondary */
.btn-details {
  margin-top: 10px;
  width: 100%;
  padding: 0.7rem 1.2rem;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.98);
  border: 1px solid var(--glass-border-soft);
  color: var(--text-main);
  font-weight: 600;
  font-size: 0.9rem;
  cursor: pointer;
  transition:
    transform 220ms ease,
    box-shadow 220ms ease,
    border-color 160ms ease,
    color 160ms ease,
    background 160ms ease;
}

.btn-details:hover {
  background: #ffffff;
  border-color: rgba(0, 0, 0, 0.16);
  color: var(--text-strong);
  transform: translateY(-2px);
  box-shadow: 0 8px 22px -14px rgba(0, 0, 0, 0.3);
}

/* =========================================
   EMPTY STATE
   ========================================= */

.empty-state {
  grid-column: 1 / -1;
  text-align: center;
  padding: 70px 20px;
}

.empty-icon {
  font-size: 3.5rem;
  margin-bottom: 16px;
  opacity: 0.4;
}

.empty-state h3 {
  font-size: 1.4rem;
  color: var(--text-strong);
  margin: 0 0 6px 0;
}

.empty-state p {
  color: var(--text-muted);
  font-size: 0.95rem;
}

/* =========================================
   RESPONSIVE
   ========================================= */

@media (max-width: 768px) {
  .queue-container {
    padding: 20px 16px 40px;
  }

  .queue-container::before {
    inset: 16px 0 0;
  }

  .queue-grid {
    grid-template-columns: 1fr;
  }

  .card-actions {
    flex-direction: column;
  }
}

      `}</style>
      
      <DoctorNav />
      <div className="queue-container">
        <div className="page-header">
          <h1>
            <span>📋</span>
            Consultation Queue ({list.length})
          </h1>
          <div className="refresh-indicator">
            <div className="live-dot"></div>
            Auto-refreshing
          </div>
        </div>

        {msg && (
          <div className="alert">
            <span>⚠</span>
            {msg}
          </div>
        )}

        <div className="queue-grid">
          {list.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">🩺</div>
              <h3>No cases in queue</h3>
              <p>All consultations have been handled. Great work!</p>
            </div>
          ) : (
            list.map(c=>(
              <div key={c.id} className={`queue-card ${c.priority === 'urgent' ? 'urgent' : ''}`}>
                <div className="card-header">
                  <div className="consult-id">{c.consultationId}</div>
                  <span className={`priority-badge priority-${c.priority}`}>
                    {c.priority === 'urgent' && '🔴'}
                    {c.priority === 'normal' && '🟢'}
                    {' '}{c.priority}
                  </span>
                </div>

                {c.patient && (
                  <div className="patient-section">
                    <div className="patient-info">
                      {c.patient.photo ? (
                        <img src={c.patient.photo} alt="" className="patient-avatar"/>
                      ) : (
                        <div className="patient-avatar" style={{display:'flex', alignItems:'center', justifyContent:'center', background:'linear-gradient(135deg, #0d47a1 ,#0d47a1 ', color:'white', fontSize:24, fontWeight:700}}>
                          {c.patient.name?.[0] || '?'}
                        </div>
                      )}
                      <div className="patient-details">
                        <h3>{c.patient.name}</h3>
                        <div className="patient-meta">
                          {c.patient.gender} • {c.patient.age} years • {c.patient.conditionType}
                        </div>
                      </div>
                    </div>
                    
                    {c.chiefComplaint && (
                      <div className="complaint-box">
                        <div className="complaint-label">Chief Complaint</div>
                        <div className="complaint-text">{c.chiefComplaint}</div>
                      </div>
                    )}
                  </div>
                )}

                <div className="card-meta">
                  <div className="meta-item">
                    <span>🕒</span>
                    {new Date(c.createdAt).toLocaleString('en-IN', {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </div>
                </div>

                <div className="card-actions">
                  <button className="btn btn-accept" onClick={()=>accept(c.id)}>
                    <span>✓</span> Accept
                  </button>
                  <button className="btn btn-decline" onClick={()=>decline(c.id)}>
                    <span>✕</span> Decline
                  </button>
                </div>
                <button 
                  className="btn btn-details" 
                  onClick={()=>window.location.href=`/doctor/consultations/${c.id}`}
                  style={{marginTop:10, width:'100%'}}
                >
                  👁️ View Details
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

