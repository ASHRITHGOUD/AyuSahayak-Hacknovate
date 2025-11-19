import AdminNav from '../../components/AdminNav';
import { useEffect, useState } from 'react';
import http from '../../api/http';


export default function AdminHome() {
  const [stats, setStats] = useState({
  hospitalsCount: 0,
  doctorsCount: 0,
  nursesCount: 0,
  totalRevenue: 0,
  patientsPerHospital: [],
  revenuePerHospital: []
});
useEffect(() => {
  (async () => {
    try {
      const { data } = await http.get('/admin/stats');
      setStats(data || {});
    } catch {
      setStats(prev => ({ ...prev }));
    }
  })();
}, []);

  return (
    <>
      <style>{`
        /* =========================================
   GLOBAL FOUNDATION – STRICT PALETTE
   Allowed colors:
   #ffffff (#fff), #ffebee, #e8f5e9
   Button gradient: #0d47a1 → #1565c0
   ========================================= */

:root {
  /* Base colors */
  --color-white: #ffffff;
  --color-error-bg: #ffebee;
  --color-success-bg: #e8f5e9;

  /* Primary button gradient (allowed exception) */
  --btn-gradient-from: #0d47a1;
  --btn-gradient-to: #1565c0;

  /* Neutrals built from white only (using opacity) */
  --glass-bg-strong: rgba(255, 255, 255, 0.92);
  --glass-bg-soft: rgba(255, 255, 255, 0.8);
  --glass-border-strong: rgba(255, 255, 255, 0.9);
  --glass-border-soft: rgba(255, 255, 255, 0.6);
  --shadow-soft: 0 10px 40px -10px rgba(0, 0, 0, 0.08);
  --shadow-softer: 0 18px 45px -18px rgba(0, 0, 0, 0.12);

  /* Text (using black with opacity only) */
  --text-strong: rgba(0, 0, 0, 0.85);
  --text-main: rgba(0, 0, 0, 0.72);
  --text-muted: rgba(0, 0, 0, 0.5);
}

/* Modern, clinical typography */
body {
  font-family: system-ui, -apple-system, BlinkMacSystemFont, "Inter",
    "Roboto", sans-serif;
  background: #ffffff;
  color: var(--text-main);
}

/* Smooth transitions for interactive elements */
button,
a,
.stat-card,
.pph-card,
.action-item {
  transition:
    transform 220ms ease,
    box-shadow 220ms ease,
    background 220ms ease,
    border-color 220ms ease,
    filter 220ms ease,
    opacity 180ms ease;
}

/* =========================================
   ADMIN HOME SHELL
   ========================================= */

.admin-home {
  min-height: 100vh;
  /* White base with a very subtle white vignette */
  background:
    radial-gradient(circle at top left, rgba(255, 255, 255, 0.9), #ffffff 60%),
    #ffffff;
  padding-bottom: 40px;
}

/* Slight glass strip behind AdminNav if it’s fixed */
.admin-home .admin-nav,
.admin-home header {
  backdrop-filter: blur(12px);
}

/* Main content container: glass "workspace" on white */
.admin-content {
  max-width: 1400px;
  margin: 0 auto;
  padding: 56px 24px 64px;
  position: relative;
}

/* Soft halo behind dashboard content */
.admin-content::before {
  content: "";
  position: absolute;
  inset: 0;
  margin: 40px auto 0;
  max-width: 1280px;
  background: radial-gradient(
    circle at top,
    rgba(255, 255, 255, 1),
    rgba(255, 255, 255, 0.8) 55%,
    rgba(255, 255, 255, 0.6) 80%
  );
  opacity: 0.9;
  z-index: -2;
}

/* Glass panel wrapper */
.admin-content::after {
  content: "";
  position: absolute;
  inset: 32px 16px 24px;
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

/* =========================================
   HEADER – TITLE / SUBTITLE
   ========================================= */

.admin-header {
  margin-bottom: 40px;
  position: relative;
  padding-bottom: 12px;
}

.admin-title {
  font-size: clamp(2rem, 3vw, 2.6rem);
  font-weight: 800;
  letter-spacing: -0.03em;
  color: var(--text-strong);
  display: inline-flex;
  align-items: center;
  gap: 10px;
}

/* Subtle underline built from white & shadow 
.admin-title::after {
  content: "";
  height: 3px;
  width: 72px;
  border-radius: 999px;
  background: rgba(0, 0, 0, 0.1);
  display: inline-block;
} */

.admin-subtitle {
  margin-top: 10px;
  font-size: 0.98rem;
  font-weight: 400;
  color: var(--text-muted);
  max-width: 520px;
}

/* =========================================
   STATS GRID – GLASS CARDS
   ========================================= */

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 24px;
  margin-bottom: 32px;
}

/* Glassmorphic stat card */
.stat-card {
  position: relative;
  padding: 26px 24px 24px;
  border-radius: 22px;
  background: linear-gradient(
    135deg,
    rgba(255, 255, 255, 0.98),
    rgba(255, 255, 255, 0.9)
  );
  border: 1px solid var(--glass-border-strong);
  box-shadow: var(--shadow-soft);
  backdrop-filter: blur(12px);
  overflow: hidden;
}

/* Remove harsh borderLeft from inline styles */
.stat-card[style] {
  border-left-width: 0 !important;
}

/* Hover: elevate + shadow expansion */
.stat-card:hover {
  transform: translateY(-5px);
  box-shadow: var(--shadow-softer);
}

/* Stat icon – white glass block */
.stat-icon {
  width: 52px;
  height: 52px;
  border-radius: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 26px;
  margin-bottom: 18px;
  background: linear-gradient(
    135deg,
    rgba(255, 255, 255, 1),
    rgba(255, 255, 255, 0.9)
  );
  box-shadow: 0 10px 30px -12px rgba(0, 0, 0, 0.25);
  color: var(--text-strong);
}

/* Stat value – big, confident number */
.stat-value {
  font-size: 2.4rem;
  font-weight: 800;
  letter-spacing: -0.04em;
  line-height: 1.05;
  color: var(--text-strong);
  margin-bottom: 6px;
}

/* Stat label – uppercased, subtle */
.stat-label {
  font-size: 0.8rem;
  font-weight: 600;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--text-muted);
}

/* =========================================
   PATIENTS / REVENUE CARDS (pph-card)
   ========================================= */

.pph-card {
  background: var(--glass-bg-strong) !important;
  color: var(--text-main) !important;
  border-radius: 22px;
  padding: 24px 22px;
  border: 1px solid var(--glass-border-strong);
  box-shadow: var(--shadow-soft);
  backdrop-filter: blur(16px);
  position: relative;
  overflow: hidden;
}

/* Gentle white vignette inside card */
.pph-card::before {
  content: "";
  position: absolute;
  inset: 0;
  background: radial-gradient(
    circle at top right,
    rgba(255, 255, 255, 1),
    rgba(255, 255, 255, 0.75) 55%,
    transparent 80%
  );
  opacity: 0.7;
  pointer-events: none;
  z-index: -1;
}

.pph-title {
  color: var(--text-strong) !important;
  margin: 0 0 18px 0;
  font-size: 1.02rem;
  font-weight: 700;
  letter-spacing: -0.01em;
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

/* Tiny neutral dot left of title */
.pph-title::before {
  content: "";
  width: 8px;
  height: 8px;
  border-radius: 999px;
  background: rgba(0, 0, 0, 0.12);
}

/* Hover lift for card */
.pph-card:hover {
  transform: translateY(-5px);
  box-shadow: var(--shadow-softer);
}

/* List layout */
.pph-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  gap: 12px;
}

/* Each hospital row – soft pill */
.pph-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 14px;
  background: rgba(255, 255, 255, 0.95) !important;
  border-radius: 16px;
  border: 1px solid var(--glass-border-soft);
  box-shadow: 0 12px 32px -20px rgba(0, 0, 0, 0.25);
}

/* Hover: elevate row */
.pph-item:hover {
  transform: translateY(-3px);
  box-shadow: 0 14px 36px -18px rgba(0, 0, 0, 0.3);
  background: #ffffff !important;
}

/* Left cluster (icon + text) */
.pph-left {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
}

/* Icon capsule */
.pph-icon {
  width: 40px;
  height: 40px;
  display: grid;
  place-items: center;
  border-radius: 14px;
  background: linear-gradient(
    145deg,
    rgba(255, 255, 255, 1),
    rgba(255, 255, 255, 0.9)
  );
  border: 1px solid var(--glass-border-soft);
  box-shadow: 0 10px 25px -14px rgba(0, 0, 0, 0.3);
  font-size: 18px;
}

/* Name / ID text */
.pph-name {
  color: var(--text-strong) !important;
  font-weight: 600;
  font-size: 0.95rem;
}

.pph-id {
  color: var(--text-muted) !important;
  font-size: 0.76rem;
}

/* Count pill – use white + opacity only */
.pph-count {
  color: var(--text-strong) !important;
  font-weight: 700;
  white-space: nowrap;
  font-size: 0.92rem;
  padding: 6px 12px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.9);
  border: 1px solid var(--glass-border-soft);
}

/* Empty state – using allowed red/green backgrounds */
.pph-empty {
  padding: 22px 20px;
  border-radius: 18px;
  border: 1px dashed rgba(0, 0, 0, 0.12);
  color: var(--text-main) !important;
  background: #ffebee !important; /* use error background for empty state */
  display: flex;
  align-items: center;
  gap: 10px;
}

.pph-empty-icon {
  font-size: 20px;
}

/* =========================================
   QUICK ACTIONS (IF USED)
   ========================================= */

.quick-actions {
  background: var(--glass-bg-soft);
  padding: 24px 22px;
  border-radius: 20px;
  box-shadow: var(--shadow-soft);
  border: 1px solid var(--glass-border-strong);
  backdrop-filter: blur(14px);
}

.section-title {
  font-size: 1rem;
  font-weight: 700;
  color: var(--text-strong);
  margin-bottom: 18px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.section-title span {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  border-radius: 999px;
  background: rgba(0, 0, 0, 0.08);
  color: var(--text-main);
  font-size: 0.78rem;
}

/* Action list items */
.action-list {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.action-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 18px;
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.95);
  border: 1px solid var(--glass-border-soft);
}

/* Card hover: lift */
.action-item:hover {
  transform: translateY(-4px);
  box-shadow: 0 14px 40px -18px rgba(0, 0, 0, 0.3);
  background: #ffffff;
}

/* Icon in action item */
.action-icon {
  width: 40px;
  height: 40px;
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.95);
  border: 1px solid var(--glass-border-soft);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
}

/* Action text */
.action-text h4 {
  margin: 0;
  font-size: 0.96rem;
  font-weight: 600;
  color: var(--text-strong);
}

.action-text p {
  margin: 4px 0 0;
  font-size: 0.82rem;
  color: var(--text-muted);
}

/* =========================================
   BUTTONS – PRIMARY GLOW CTA
   ========================================= */

.action-btn {
  position: relative;
  padding: 10px 24px;
  border-radius: 999px;
  border: none;
  cursor: pointer;
  font-size: 0.86rem;
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
}

/* Inner glow halo (white only) */
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

/* Hover: lift, glow, slight shift */
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

/* Focus ring */
.action-btn:focus-visible {
  outline: none;
  box-shadow:
    0 0 0 2px #ffffff,
    0 0 0 6px rgba(0, 0, 0, 0.25),
    0 16px 45px -12px rgba(0, 0, 0, 0.45);
}

/* Disabled state */
.action-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
  box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.12);
}

/* =========================================
   INPUTS – FUTURE-PROOF (WHITE ONLY)
   ========================================= */

input[type="text"],
input[type="email"],
input[type="number"],
select {
  border-radius: 14px;
  border: 1px solid var(--glass-border-soft);
  background: rgba(255, 255, 255, 0.95);
  padding: 10px 12px;
  font-size: 0.9rem;
  color: var(--text-main);
  transition:
    border-color 180ms ease,
    box-shadow 180ms ease,
    background 180ms ease,
    transform 180ms ease;
}

/* Focus ring */
input[type="text"]:focus,
input[type="email"]:focus,
input[type="number"]:focus,
select:focus {
  outline: none;
  border-color: rgba(0, 0, 0, 0.25);
  background: #ffffff;
  box-shadow:
    0 0 0 1px rgba(255, 255, 255, 0.9),
    0 0 0 4px rgba(0, 0, 0, 0.08),
    0 10px 30px -14px rgba(0, 0, 0, 0.3);
  transform: translateY(-1px);
}

/* =========================================
   RESPONSIVE TWEAKS
   ========================================= */

@media (max-width: 768px) {
  .admin-content {
    padding: 40px 16px 48px;
  }

  .admin-content::after {
    inset: 20px 8px 16px;
  }

  .stats-grid {
    gap: 16px;
  }

  .stat-card {
    padding: 22px 20px;
  }

  .pph-card {
    padding: 20px 18px;
  }

  .pph-item {
    padding: 10px 12px;
  }

  .admin-title::after {
    width: 52px;
  }
}



      `}</style>
      
      <div className="admin-home">
        <AdminNav />
        
        <div className="admin-content" style={{ marginTop: "40px" }}>
          <div className="admin-header">
            <h1 className="admin-title">Admin Dashboard</h1>
            <p className="admin-subtitle">Manage hospitals, monitor activity, and oversee platform operations</p>
          </div>
          
        <div className="stats-grid">
  <div className="stat-card">
    <div className="stat-icon">🏥</div>
    <div className="stat-value">{stats.hospitalsCount ?? 0}</div>
    <div className="stat-label">Hospitals</div>
  </div>

  <div className="stat-card" style={{borderLeftColor: 'var(--color-primary)'}}>
    <div className="stat-icon" style={{background: 'linear-gradient(135deg, #E3F2FD 0%, #BBDEFB 100%)'}}>👨‍⚕️</div>
    <div className="stat-value" style={{color: 'var(--color-primary)'}}>{stats.doctorsCount ?? 0}</div>
    <div className="stat-label">Doctors</div>
  </div>

  <div className="stat-card" style={{borderLeftColor: 'var(--color-success)'}}>
    <div className="stat-icon" style={{background: 'linear-gradient(135deg, #E8F5E9 0%, #C8E6C9 100%)'}}>🧑‍⚕️</div>
    <div className="stat-value" style={{color: 'var(--color-success)'}}>{stats.nursesCount ?? 0}</div>
    <div className="stat-label">Nurses</div>
  </div>

  <div className="stat-card" style={{borderLeftColor: '#f59e0b'}}>
    <div className="stat-icon" style={{background: 'linear-gradient(135deg, #FFF7ED 0%, #FFEDD5 100%)'}}>💰</div>
    <div className="stat-value" style={{color: '#f59e0b'}}>₹{Number(stats.totalRevenue || 0).toLocaleString('en-IN')}</div>
    <div className="stat-label">Total Revenue</div>
  </div>
</div>

<div className="pph-card">
  <h3 className="pph-title">Patients per Hospital</h3>

  {Array.isArray(stats.patientsPerHospital) && stats.patientsPerHospital.length > 0 ? (
    <ul className="pph-list">
      {stats.patientsPerHospital.map(row => (
        <li key={row.hospitalId} className="pph-item">
          <div className="pph-left">
            <div className="pph-icon">🏥</div>
            <div>
              <div className="pph-name">{row.hospitalName}</div>
              <div className="pph-id">ID: {row.hospitalId}</div>
            </div>
          </div>
          <div className="pph-count">{row.count} patients</div>
        </li>
      ))}
    </ul>
  ) : (
    <div className="pph-empty">
      <div className="pph-empty-icon">ℹ️</div>
      <div>No patient registrations yet</div>
    </div>
  )}
</div>

<div className="pph-card" style={{ marginTop: 24 }}>
  <h3 className="pph-title">Revenue per Hospital</h3>

  {Array.isArray(stats.revenuePerHospital) && stats.revenuePerHospital.length > 0 ? (
    <ul className="pph-list">
      {stats.revenuePerHospital.map(row => (
        <li key={row.hospitalId} className="pph-item">
          <div className="pph-left">
            <div className="pph-icon">💰</div>
            <div>
              <div className="pph-name">{row.hospitalName}</div>
              <div className="pph-id">ID: {row.hospitalId}</div>
            </div>
          </div>
          <div className="pph-count">
            ₹{Number(row.total || 0).toLocaleString('en-IN')}
          </div>
        </li>
      ))}
    </ul>
  ) : (
    <div className="pph-empty">
      <div className="pph-empty-icon">ℹ️</div>
      <div>No revenue records yet</div>
    </div>
  )}
</div>





          
        </div>
      </div>
    </>
  );
}

