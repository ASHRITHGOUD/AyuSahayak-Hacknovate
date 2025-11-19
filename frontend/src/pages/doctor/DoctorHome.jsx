import { useEffect, useState } from 'react';
import DoctorNav from '../../components/DoctorNav';
import http from '../../api/http';

export default function DoctorHome() {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    const loadStats = async () => {
      try {
        const { data } = await http.get('/doctor/dashboard/stats');
        setStats(data);
      } catch (e) {
        console.warn('Failed to load doctor stats', e?.response?.status, e?.response?.data);
        setStats(null);
      }
    };
    loadStats();
  }, []);

  return (
    <>
      <style>{`
        .doctor-home,
        body {
          font-family: system-ui, -apple-system, BlinkMacSystemFont, "Inter", "Roboto", sans-serif;
        }

:root {
  --color-white: #ffffff;
  --color-success-bg: #e8f5e9;
  --color-error-bg: #ffebee;
  --btn-gradient-from: #0d47a1;
  --btn-gradient-to: #1565c0;
  --glass-bg-strong: rgba(255, 255, 255, 0.96);
  --glass-bg-soft: rgba(255, 255, 255, 0.9);
  --glass-border-strong: rgba(255, 255, 255, 0.9);
  --glass-border-soft: rgba(255, 255, 255, 0.7);
  --shadow-soft: 0 10px 40px -10px rgba(0, 0, 0, 0.08);
  --shadow-softer: 0 18px 45px -18px rgba(0, 0, 0, 0.12);
  --text-strong: rgba(0, 0, 0, 0.85);
  --text-main: rgba(0, 0, 0, 0.72);
  --text-muted: rgba(0, 0, 0, 0.5);
}

.doctor-home {
  min-height: 100vh;
  background:
    radial-gradient(circle at top left, rgba(255, 255, 255, 0.9), #ffffff 60%),
    #ffffff;
  padding-bottom: 40px;
}

.doctor-content {
  max-width: 1400px;
  margin: 0 auto;
  padding: 48px 24px 56px;
  position: relative;
}

.doctor-content::before {
  content: "";
  position: absolute;
  inset: 20px 0 0;
  margin: 0 auto;
  max-width: 1300px;
  border-radius: 24px;
  background: linear-gradient(
    135deg,
    rgba(255, 255, 255, 0.98),
    rgba(255, 255, 255, 0.9)
  );
  border: 1px solid var(--glass-border-strong);
  box-shadow: var(--shadow-soft);
  backdrop-filter: blur(18px);
  z-index: -1;
}

.page-title {
  font-size: clamp(2rem, 3vw, 2.4rem);
  font-weight: 800;
  letter-spacing: -0.03em;
  color: var(--text-strong);
  margin-bottom: 8px;
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 24px;
  margin: 40px 0;
}

.stat-card {
  position: relative;
  padding: 26px 24px 24px;
  border-radius: 20px;
  background: var(--glass-bg-strong);
  border: 1.5px solid rgba(0, 0, 0, 0.02);
  box-shadow: var(--shadow-soft);
  backdrop-filter: blur(12px);
  overflow: hidden;
}

.stat-card[style] {
  border-left-width: 0 !important;
}

.stat-card:hover {
  transform: translateY(-5px);
  box-shadow: var(--shadow-softer);
  border-color: rgba(0, 0, 0, 0.12);
}

.stat-icon {
  font-size: 32px;
  margin-bottom: 14px;
}

.stat-value {
  font-size: 2.3rem;
  font-weight: 800;
  letter-spacing: -0.04em;
  color: var(--text-strong);
  margin-bottom: 6px;
}

.stat-label {
  color: var(--text-muted);
  font-size: 0.8rem;
  font-weight: 600;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.quick-actions {
  background: var(--glass-bg-soft);
  padding: 24px 22px 26px;
  border-radius: 20px;
  box-shadow: var(--shadow-soft);
  border: 1px solid rgba(0,0,0,0.02);
  backdrop-filter: blur(14px);
}

.quick-actions h3 {
  margin-bottom: 18px !important;
  font-size: 1.02rem;
  font-weight: 700;
  color: var(--text-strong);
}

.quick-actions > div {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
}

.action-btn {
  position: relative;
  padding: 0.8rem 1.8rem;
  border-radius: 999px;
  border: none;
  cursor: pointer;
  font-size: 0.9rem;
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: #ffffff;
  background: linear-gradient(
    135deg,
    var(--btn-gradient-from),
    var(--btn-gradient-to)
  );
  box-shadow:
    0 0 0 1px rgba(255, 255, 255, 0.7),
    0 12px 30px -10px rgba(0, 0, 0, 0.35);
  overflow: hidden;
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  transition:
    transform 220ms ease,
    box-shadow 220ms ease,
    opacity 160ms ease;
}

.action-btn::before {
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

.action-btn:hover {
  transform: translateY(-5px);
  box-shadow:
    0 0 0 1px rgba(255, 255, 255, 0.9),
    0 16px 45px -12px rgba(0, 0, 0, 0.45);
}

.action-btn:hover::before {
  opacity: 0.65;
  transform: translate3d(8px, -8px, 0);
}

.action-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
  box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.12);
}

@media (max-width: 768px) {
  .doctor-content {
    padding: 40px 16px 48px;
  }

  .doctor-content::before {
    inset: 16px 0 0;
  }

  .stats-grid {
    gap: 18px;
    margin: 28px 0 32px;
  }

  .stat-card {
    padding: 22px 20px;
  }

  .quick-actions {
    padding: 20px 18px 22px;
  }

  .quick-actions > div {
    flex-direction: column;
  }

  .action-btn {
    width: 100%;
    justify-content: center;
  }
}

      `}</style>

      <div className="doctor-home">
        <DoctorNav />
        <div className="doctor-content" style={{ marginTop: "40px" }}>
          <h1 className="page-title">Doctor Dashboard</h1>
          <p style={{color: 'var(--color-gray-400)', marginBottom: 32}}>Review consultations and provide expert medical care</p>

          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon">⏳</div>
              <div className="stat-value">{stats?.inQueue ?? 0}</div>
              <div className="stat-label">IN QUEUE</div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">🔄</div>
              <div className="stat-value">{stats?.inProgress ?? 0}</div>
              <div className="stat-label">IN PROGRESS</div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">✅</div>
              <div className="stat-value">{stats?.completedToday ?? 0}</div>
              <div className="stat-label">COMPLETED TODAY</div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">📊</div>
              <div className="stat-value">{stats?.totalConsultations ?? 0}</div>
              <div className="stat-label">TOTAL CONSULTATIONS</div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">👥</div>
              <div className="stat-value">{stats?.totalPatients ?? 0}</div>
              <div className="stat-label">TOTAL PATIENTS</div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">🚫</div>
              <div className="stat-value">{stats?.declined ?? 0}</div>
              <div className="stat-label">DECLINED CONSULTATIONS</div>
            </div>
          </div>

          <div className="quick-actions">
            <h3 style={{marginBottom: 24}}>Quick Actions</h3>
            <div style={{display: 'flex', gap: 16}}>
              <button className="action-btn" onClick={() => window.location.href = '/doctor/queue'}>
                View Queue
              </button>
              <button className="action-btn" onClick={() => window.location.href = '/doctor/in-progress'}>
                In Progress Cases
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
