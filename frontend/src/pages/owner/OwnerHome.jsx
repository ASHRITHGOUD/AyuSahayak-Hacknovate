import { useEffect, useState } from 'react';
import OwnerNav from '../../components/OwnerNav';
import http from '../../api/http';


export default function OwnerHome() {
  const [hospital, setHospital] = useState(null);
  const [stats, setStats] = useState(null);

  useEffect(() => {
    const loadHospitalAndStats = async () => {
      try {
        const [{ data: hospitalData }, { data: statsData }] = await Promise.all([
          http.get('/hospital/me'),
          http.get('/hospital/owner/dashboard'),
        ]);
        setHospital(hospitalData);
        setStats(statsData);
      } catch (e) {
        console.warn('Failed to load hospital or stats', e?.response?.status, e?.response?.data);
        setHospital(null);
        setStats(null);
      }
    };
    loadHospitalAndStats();
  }, []);
  return (
    <>
      <style>{`
        /* =========================================
   NURSE/OWNER DASHBOARD – UNIFIED STYLES
   Uses same visual language for Nurse and Owner dashboards
   ========================================= */

:root {
  --color-white: #ffffff;
  --color-success-bg: #e8f5e9;
  --color-error-bg: #ffebee;

  --btn-gradient-from: #0d47a1;
  --btn-gradient-to: #1565c0;

  --glass-bg-strong: rgba(255, 255, 255, 0.96);
  --glass-bg-soft: rgba(255, 255, 255, 0.9);
  --glass-border-strong: rgba(0, 0, 0, 0.02);
  --glass-border-soft: rgba(0, 0, 0, 0.07);

  --shadow-soft: 0 10px 40px -10px rgba(0, 0, 0, 0.08);
  --shadow-softer: 0 18px 45px -18px rgba(0, 0, 0, 0.12);

  --text-strong: rgba(0, 0, 0, 0.85);
  --text-main: rgba(0, 0, 0, 0.72);
  --text-muted: rgba(0, 0, 0, 0.5);
}

/* Base typography for both nurse and owner dashboards */
.nurse-home, .owner-home, body {
  font-family: system-ui, -apple-system, BlinkMacSystemFont, "Inter", "Roboto", sans-serif;
}

.nurse-home, .owner-home {
  min-height: 100vh;
  background: radial-gradient(circle at top left, rgba(255,255,255,0.9), #ffffff 60%), #ffffff;
  padding-bottom: 40px;
}

.nurse-content, .owner-content {
  max-width: 1400px;
  margin: 0 auto;
  padding: 48px 24px 56px;
  position: relative;
}

.nurse-content::before, .owner-content::before {
  content: "";
  position: absolute;
  inset: 20px 0 0;
  margin: 0 auto;
  max-width: 1300px;
  border-radius: 24px;
  background: linear-gradient(135deg, rgba(255,255,255,0.98), rgba(255,255,255,0.9));
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

.stat-card[style] { border-left-width: 0 !important; }

.stat-card:hover {
  transform: translateY(-5px);
  box-shadow: var(--shadow-softer);
  border-color: rgba(0, 0, 0, 0.12);
}

.stat-icon { font-size: 32px; margin-bottom: 14px; }

.stat-value { font-size: 2.3rem; font-weight: 800; letter-spacing: -0.04em; color: var(--text-strong); margin-bottom: 6px; }

.stat-label { color: var(--text-muted); font-size: 0.8rem; font-weight: 600; letter-spacing: 0.12em; text-transform: uppercase; }

.quick-actions { background: var(--glass-bg-soft); padding: 24px 22px 26px; border-radius: 20px; box-shadow: var(--shadow-soft); border: 1px solid rgba(0,0,0,0.02); backdrop-filter: blur(14px); }

.quick-actions h3 { margin-bottom: 18px !important; font-size: 1.02rem; font-weight: 700; color: var(--text-strong); }

.quick-actions > div { display: flex; gap: 16px; flex-wrap: wrap; }

.action-btn { position: relative; padding: 0.8rem 1.8rem; border-radius: 999px; border: none; cursor: pointer; font-size: 0.9rem; font-weight: 600; letter-spacing: 0.04em; text-transform: uppercase; color: #ffffff; background: linear-gradient(135deg, var(--btn-gradient-from), var(--btn-gradient-to)); box-shadow: 0 0 0 1px rgba(255,255,255,0.7), 0 12px 30px -10px rgba(0,0,0,0.35); overflow: hidden; display: inline-flex; align-items: center; gap: 0.35rem; transition: transform 220ms ease, box-shadow 220ms ease, opacity 160ms ease; }

.action-btn::before { content: ""; position: absolute; inset: -40%; background: radial-gradient(circle at 0 0, rgba(255,255,255,0.35), transparent 60%); opacity: 0.4; transition: opacity 200ms ease, transform 220ms ease; }

.action-btn:hover { transform: translateY(-5px); box-shadow: 0 0 0 1px rgba(255,255,255,0.9), 0 16px 45px -12px rgba(0,0,0,0.45); }
.action-btn:hover::before { opacity: 0.65; transform: translate3d(8px, -8px, 0); }
.action-btn:disabled { opacity: 0.6; cursor: not-allowed; transform: none; box-shadow: 0 0 0 1px rgba(0,0,0,0.12); }

@media (max-width: 768px) {
  .nurse-content, .owner-content { padding: 40px 16px 48px; }
  .nurse-content::before, .owner-content::before { inset: 16px 0 0; }
  .stats-grid { gap: 18px; margin: 28px 0 32px; }
  .stat-card { padding: 22px 20px; }
  .quick-actions { padding: 20px 18px 22px; }
  .quick-actions > div { flex-direction: column; }
  .action-btn { width: 100%; justify-content: center; }
}

      `}</style>
      
      <div className="owner-home">
        <OwnerNav />
        <div className="owner-content" style={{marginTop: "45px"}}>
          <div className="page-header">
            <h1 className="page-title">
              {`${hospital?.name} Hospital Dashboard`|| 'Hospital Dashboard'}
            </h1>
            <h3 className="page-subtitle" style={{color: "rgba(0, 0, 0, 0.75)"}}>
              {hospital?.name ? `Manage ${hospital.name} staff and operations` : 'Manage your hospital staff and operations'}
            </h3>
          </div>
          <div className="stats-grid" style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:24,marginBottom:24}}>
            <div className="stat-card">
              <div className="stat-icon">👨‍⚕️</div>
              <div className="stat-value">{stats?.activeStaff ?? '--'}</div>
              <div className="stat-label">ACTIVE STAFF</div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">🏥</div>
              <div className="stat-value">{stats?.totalPatients ?? '--'}</div>
              <div className="stat-label">TOTAL PATIENTS</div>
            </div>
              <div className="stat-card">
              <div className="stat-icon">💰</div>
              <div className="stat-value">₹{stats?.revenue?.toLocaleString('en-IN') ?? '--'}</div>
              <div className="stat-label">TOTAL REVENUE</div>
            </div>

          </div>
          <div className="stats-grid" style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:24,marginBottom:48}}>            
            <div className="stat-card">
              <div className="stat-icon">📊</div>
              <div className="stat-value">{stats?.totalConsultations ?? '--'}</div>
              <div className="stat-label">TOTAL CONSULTATIONS</div>
            </div>

            <div className="stat-card">
              <div className="stat-icon">⚠️</div>
              <div className="stat-value">{stats?.outOfStock?.length ?? '--'}</div>
              <div className="stat-label">OUT OF STOCK MEDICINES</div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">🔻</div>
              <div className="stat-value">{stats?.lowStock?.length ?? '--'}</div>
              <div className="stat-label">LOW STOCK MEDICINES</div>
            </div>
          </div>
        </div>
          
          {/* <div className="quick-actions">
            <h3 className="section-title">Quick Actions</h3>
            
            <div className="action-list">
              <div className="action-item">
                <div className="action-info">
                  <div className="action-icon">👨‍⚕️</div>
                  <div>
                    <h4 style={{margin:0, fontWeight:600}}>Manage Staff</h4>
                    <p style={{margin: '4px 0 0 0', fontSize: 13, color: 'var(--color-gray-400)'}}>
                      Create and manage nurse and doctor accounts
                    </p>
                  </div>
                </div>
                <button className="action-btn" onClick={() => window.location.href = '/owner/staff'}>
                  Manage →
                </button>
              </div>
              
              <div className="action-item">
                <div className="action-info">
                  <div className="action-icon">💳</div>
                  <div>
                    <h4 style={{margin:0, fontWeight:600}}>Payments & Audit</h4>
                    <p style={{margin: '4px 0 0 0', fontSize: 13, color: 'var(--color-gray-400)'}}>
                      View revenue and transaction history
                    </p>
                  </div>
                </div>
                <button className="action-btn" style={{opacity: 0.5}} disabled>
                  Coming Soon
                </button>
              </div>
            </div>
          </div> */}
        </div>
    </>
  );
}

