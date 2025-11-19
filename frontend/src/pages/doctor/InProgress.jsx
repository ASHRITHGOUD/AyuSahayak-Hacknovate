import { useEffect, useState } from 'react';
import DoctorNav from '../../components/DoctorNav';
import http from '../../api/http';

export default function InProgress() {
  const [list, setList] = useState([]);
  const [msg, setMsg] = useState('');

  const load = async () => {
    try {
      const { data } = await http.get('/doctor/consultations/in-progress');
      setList(data);
    } catch { setList([]); }
  };

  useEffect(()=>{ load(); const t=setInterval(load, 8000); return ()=>clearInterval(t); }, []);

  const complete = async (id) => {
    setMsg('');
    if (!window.confirm('Mark this consultation as completed?')) return;
    try {
      await http.patch(`/doctor/consultations/${id}/complete`);
      load();
    } catch (e) {
      setMsg(e.response?.data?.message || 'Failed');
    }
  };

  const getElapsedTime = (startedAt) => {
    if (!startedAt) return '—';
    const diff = Date.now() - new Date(startedAt).getTime();
    const mins = Math.floor(diff / 60000);
    return `${mins} min${mins !== 1 ? 's' : ''}`;
  };

  return (
    <div className="in-progress-page">
      <style>{`
       /* =========================================
   DOCTOR – IN PROGRESS (STUNNING GLASS)
   Palette:
   #ffffff, #ffebee, #e8f5e9 + black via opacity
   Primary gradient: #0d47a1 → #1565c0
   ========================================= */

:root {
  --color-white: #ffffff;
  --color-success-bg: #e8f5e9;
  --color-error-bg: #ffebee;

  --btn-gradient-from: #0d47a1;
  --btn-gradient-to: #1565c0;

  --glass-bg-strong: rgba(255, 255, 255, 0.97);
  --glass-bg-soft: rgba(255, 255, 255, 0.92);
  --glass-border-strong: rgba(0, 0, 0, 0.08);
  --glass-border-soft: rgba(0, 0, 0, 0.06);

  --shadow-soft: 0 14px 40px -18px rgba(0, 0, 0, 0.16);
  --shadow-softer: 0 22px 60px -26px rgba(0, 0, 0, 0.26);

  --text-strong: rgba(0, 0, 0, 0.88);
  --text-main: rgba(0, 0, 0, 0.74);
  --text-muted: rgba(0, 0, 0, 0.52);
}

/* =========================================
   PAGE / CONTAINER
   ========================================= */

.in-progress-page {
  min-height: 100vh;
  background:
    radial-gradient(circle at top left, rgba(255, 255, 255, 0.96), #ffffff 65%),
    #ffffff;
}

.progress-container {
  padding: 28px 24px 64px;
  max-width: 1400px;
  margin: 0 auto;
  position: relative;
  animation: fadeInUp 0.45s ease-out;
}

/* Glass workspace sheet */
.progress-container::before {
  content: "";
  position: absolute;
  inset: 32px -6px 0;
  margin: 0 auto;
  max-width: 1360px;
  border-radius: 26px;
  background: linear-gradient(
    135deg,
    rgba(255, 255, 255, 0.99),
    rgba(255, 255, 255, 0.94)
  );
  border: 1px solid rgba(255, 255, 255, 0.9);
  box-shadow:
    0 32px 80px -40px rgba(0, 0, 0, 0.32),
    0 0 0 1px rgba(255, 255, 255, 0.6);
  backdrop-filter: blur(22px);
  z-index: -1;
}

@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(22px); }
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
  margin-bottom: 26px;
}

.page-header h1 {
  font-size: clamp(2.05rem, 3vw, 2.35rem);
  font-weight: 850;
  color: var(--text-strong);
  margin: 0;
  display: inline-flex;
  align-items: center;
  gap: 10px;
  letter-spacing: -0.035em;
}

/* Underline accent */
.page-header h1::after {
  content: "";
  height: 3px;
  width: 80px;
  border-radius: 999px;
  background: rgba(0, 0, 0, 0.14);
  display: inline-block;
}

/* Refresh indicator */
.refresh-indicator {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.86rem;
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
  border-radius: 14px;
  margin-bottom: 20px;
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
   GRID / CARDS
   ========================================= */

.progress-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
  gap: 24px;
}

/* Glass in-progress card */
.progress-card {
  position: relative;
  background: var(--glass-bg-strong);
  border-radius: 20px;
  padding: 22px 20px 18px;
  box-shadow: var(--shadow-soft);
  border: 1.5px solid var(--glass-border-strong);
  backdrop-filter: blur(16px);
  transition:
    transform 220ms ease,
    box-shadow 220ms ease,
    border-color 220ms ease;
}

/* Subtle glow stripe on left */
.progress-card::before {
  content: "";
  position: absolute;
  inset: 0;
  border-radius: 20px;
  background: linear-gradient(
    135deg,
    rgba(0, 0, 0, 0.04),
    transparent 60%
  );
  opacity: 0.8;
  pointer-events: none;
}

.progress-card:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-softer);
  border-color: rgba(0, 0, 0, 0.16);
}

/* =========================================
   CARD HEADER (ID + TIMER)
   ========================================= */

.card-header {
  position: relative;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 16px;
  z-index: 1;
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

/* Timer pill */
.timer-badge {
  display: inline-flex;
  align-items: center;
  padding: 7px 12px;
  border-radius: 999px;
  font-size: 0.86rem;
  font-weight: 620;
  background: #e8f5e9;
  color: var(--text-main);
  gap: 6px;
  border: 1px solid var(--glass-border-soft);
}

/* Priority pill */
.priority-indicator {
  display: inline-flex;
  align-items: center;
  padding: 6px 11px;
  border-radius: 999px;
  font-size: 0.82rem;
  font-weight: 580;
  background: #ffebee;
  color: var(--text-main);
  gap: 6px;
  margin-bottom: 14px;
  position: relative;
  z-index: 1;
}

/* =========================================
   STARTED INFO
   ========================================= */

.started-info {
  position: relative;
  padding: 10px 10px;
  background: var(--glass-bg-soft);
  border-radius: 14px;
  margin-bottom: 18px;
  font-size: 0.86rem;
  color: var(--text-main);
  border: 1px solid var(--glass-border-soft);
  z-index: 1;
}

.started-info strong {
  font-weight: 600;
  color: var(--text-strong);
}

/* =========================================
   ACTIONS / BUTTONS
   ========================================= */

.card-actions {
  position: relative;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
  z-index: 1;
}

/* Base button */
.btn {
  padding: 0.8rem 1.3rem;
  border-radius: 999px;
  font-weight: 640;
  font-size: 0.92rem;
  cursor: pointer;
  border: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  transition:
    transform 220ms ease,
    box-shadow 220ms ease,
    background 160ms ease,
    border-color 160ms ease,
    color 160ms ease,
    opacity 160ms ease;
}

/* Primary – Write Rx, use global gradient */
.btn-primary {
  position: relative;
  background: linear-gradient(
    135deg,
    var(--btn-gradient-from),
    var(--btn-gradient-to)
  );
  color: #ffffff;
  box-shadow:
    0 0 0 1px rgba(255, 255, 255, 0.7),
    0 14px 36px -12px rgba(0, 0, 0, 0.4);
  overflow: hidden;
}

.btn-primary::before {
  content: "";
  position: absolute;
  inset: -40%;
  background: radial-gradient(
    circle at 0 0,
    rgba(255, 255, 255, 0.35),
    transparent 60%
  );
  opacity: 0.45;
  transition: opacity 200ms ease, transform 220ms ease;
}

.btn-primary:hover {
  transform: translateY(-4px);
  box-shadow:
    0 0 0 1px rgba(255, 255, 255, 0.9),
    0 20px 50px -18px rgba(0, 0, 0, 0.55);
}

.btn-primary:hover::before {
  opacity: 0.7;
  transform: translate3d(9px, -9px, 0);
}

/* Complete – success gradient using success bg */
.btn-complete {
  position: relative;
  background: #e8f5e9;
  color: var(--text-main);
  border: 1px solid var(--glass-border-soft);
}

.btn-complete:hover {
  background: #ffffff;
  border-color: rgba(0, 0, 0, 0.18);
  transform: translateY(-3px);
  box-shadow: 0 16px 36px -18px rgba(0, 0, 0, 0.5);
}

/* Outline – View details (full width) */
.btn-outline {
  background: rgba(255, 255, 255, 0.98);
  border: 1px solid var(--glass-border-soft);
  color: var(--text-main);
  grid-column: 1 / -1;
}

.btn-outline:hover {
  background: #ffffff;
  border-color: rgba(0, 0, 0, 0.18);
  color: var(--text-strong);
  transform: translateY(-2px);
  box-shadow: 0 14px 32px -18px rgba(0, 0, 0, 0.48);
}

/* =========================================
   EMPTY STATE
   ========================================= */

.empty-state {
  grid-column: 1 / -1;
  text-align: center;
  padding: 80px 20px;
}

.empty-icon {
  font-size: 3.4rem;
  margin-bottom: 16px;
  opacity: 0.4;
}

.empty-state h3 {
  font-size: 1.45rem;
  color: var(--text-strong);
  margin: 0 0 6px 0;
}

.empty-state p {
  color: var(--text-muted);
  font-size: 0.96rem;
}

/* =========================================
   RESPONSIVE
   ========================================= */

@media (max-width: 768px) {
  .progress-container {
    padding: 22px 16px 48px;
  }

  .progress-container::before {
    inset: 24px -4px 0;
  }

  .page-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }

  .progress-grid {
    grid-template-columns: 1fr;
  }
}

      `}</style>
      
      <DoctorNav />
      <div className="progress-container">
        <div className="page-header">
          <h1>
            <span>🔄</span>
            Active Consultations ({list.length})
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

        <div className="progress-grid">
          {list.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">💼</div>
              <h3>No active consultations</h3>
              <p>Check your queue for new cases to accept</p>
            </div>
          ) : (
            list.map(c=>(
              <div key={c.id} className="progress-card">
                <div className="card-header">
                  <div className="consult-id">{c.consultationId}</div>
                  <div className="timer-badge">
                    <span>⏱️</span>
                    {getElapsedTime(c.startedAt)}
                  </div>
                </div>

                <div className="priority-indicator">
                  {c.priority === 'urgent' ? '🔴' : '🟢'} {c.priority}
                </div>

                <div className="started-info">
                  <strong>Started:</strong> {c.startedAt ? new Date(c.startedAt).toLocaleString('en-IN', {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  }) : '—'}
                </div>

                <div className="card-actions">
                  <button 
                    className="btn btn-primary" 
                    onClick={()=>window.location.href=`/doctor/prescription?ref=${encodeURIComponent(c.consultationId)}`}
                  >
                    <span>📝</span> Write Rx
                  </button>
                  <button className="btn btn-complete" onClick={()=>complete(c.id)}>
                    <span>✓</span> Complete
                  </button>
                  <button 
                    className="btn btn-outline" 
                    onClick={()=>window.location.href=`/doctor/consultations/${c.id}`}
                  >
                    👁️ View Details
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

