import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import NurseNav from '../../components/NurseNav';
import http from '../../api/http';

export default function EditPatient() {
  const navigate = useNavigate();
  const params = new URLSearchParams(useLocation().search);
  const ref = params.get('ref') || '';
  const [p, setP] = useState(null);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    (async () => {
      try {
        if (!ref) { setMsg('Missing patient ref'); return; }
        const { data } = await http.get(`/patients/${encodeURIComponent(ref)}`);
        setP({
          id: data.id,
          patientId: data.patientId,
          firstName: data.personalInfo.firstName,
          lastName: data.personalInfo.lastName,
          age: data.personalInfo.age ?? '',
          gender: data.personalInfo.gender || '',
          height: data.personalInfo.height ?? '',
          weight: data.personalInfo.weight ?? '',
          phone: data.personalInfo.phone || ''
        });
      } catch (e) {
        setMsg(e.response?.data?.message || 'Load failed');
      }
    })();
  }, [ref]);

  const save = async (e) => {
    e.preventDefault();
    setMsg('');
    try {
      await http.put(`/patients/${p.id}`, {
        personalInfo: {
          firstName: p.firstName,
          lastName: p.lastName,
          age: p.age === '' ? null : Number(p.age),
          gender: p.gender,
          height: p.height === '' ? null : Number(p.height),
          weight: p.weight === '' ? null : Number(p.weight),
          phone: p.phone
        }
      });
      navigate('/nurse/patients'); 
    } catch (e) {
      setMsg(e.response?.data?.message || 'Update failed');
    }
  };

  if (!p) return (
    <div>
      <NurseNav />
      <div style={{ padding: 16 }}>
        <button onClick={()=>navigate(-1)}>&larr; Back</button>
        <h3 style={{ marginTop: 12 }}>Edit Patient</h3>
        {msg ? <p>{msg}</p> : <p>Loading...</p>}
      </div>
    </div>
  );

  return (
    <div className="edit-patient-page">
      <style>{`
        /* =========================================
   EDIT PATIENT – STRICT PALETTE GLASS UI
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

  /* Neutrals via opacity only */
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
   PAGE WRAPPER
   ========================================= */

.edit-patient-page {
  min-height: 100vh;
  background:
    radial-gradient(circle at top left, rgba(255, 255, 255, 0.92), #ffffff 60%),
    #ffffff;
}

/* Main container – glass workspace */
.edit-container {
  padding: 24px;
  max-width: 900px;
  margin: 0 auto 56px;
  position: relative;
  animation: fadeInUp 0.5s ease-out;
}

/* Glass plate behind content */
.edit-container::before {
  content: "";
  position: absolute;
  inset: 24px 0 0;
  margin: 0 auto;
  max-width: 860px;
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

/* Entrance animation */
@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(20px); }
  to   { opacity: 1; transform: translateY(0); }
}

/* =========================================
   BREADCRUMB
   ========================================= */

.breadcrumb {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 20px;
  font-size: 0.85rem;
  color: var(--text-muted);
}

.breadcrumb a {
  color: var(--text-main);
  text-decoration: none;
  border-bottom: 1px solid transparent;
  padding-bottom: 1px;
  transition: border-color 0.2s ease, color 0.2s ease;
}

.breadcrumb a:hover {
  border-color: rgba(0, 0, 0, 0.3);
  color: var(--text-strong);
}

/* =========================================
   PAGE HEADER
   ========================================= */

.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 28px;
  gap: 16px;
}

.page-header h1 {
  font-size: clamp(2rem, 3vw, 2.4rem);
  font-weight: 800;
  color: var(--text-strong);
  margin: 0;
  letter-spacing: -0.03em;
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

/* Patient ID pill */
.patient-id {
  font-family: monospace;
  font-size: 0.8rem;
  color: var(--text-main);
  background: rgba(255, 255, 255, 0.98);
  padding: 8px 12px;
  border-radius: 999px;
  border: 1px solid var(--glass-border-soft);
}

/* =========================================
   EDIT CARD
   ========================================= */

.edit-card {
  background: var(--glass-bg-strong);
  border-radius: 20px;
  padding: 28px 26px;
  box-shadow: var(--shadow-soft);
  border: 1.5px solid var(--glass-border-strong);
  backdrop-filter: blur(14px);
  transition:
    transform 220ms ease,
    box-shadow 220ms ease,
    border-color 220ms ease;
}

.edit-card:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-softer);
  border-color: rgba(0, 0, 0, 0.12);
}

/* =========================================
   ALERT (ERROR)
   ========================================= */

.alert {
  padding: 12px 14px;
  border-radius: 12px;
  margin-bottom: 18px;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.9rem;
}

.alert-error {
  background: #ffebee;
  color: var(--text-main);
  border: 1px solid rgba(0, 0, 0, 0.08);
}

/* =========================================
   FORM GRID / FIELDS
   ========================================= */

.form-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px 22px;
  margin-bottom: 24px;
  
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.form-group label {
  font-size: 0.85rem;
  font-weight: 500;
  color: var(--text-main);
}

/* Inputs / selects – visible borders, glass background */
.form-group input,
.form-group select {
  padding: 10px 14px;
  border: 1.5px solid var(--glass-border-strong);
  border-radius: 14px;
  font-size: 0.9rem;
  transition:
    border-color 180ms ease,
    box-shadow 180ms ease,
    background 180ms ease,
    transform 180ms ease;
  font-family: system-ui, -apple-system, BlinkMacSystemFont, "Inter",
    "Roboto", sans-serif;
  background: rgba(255, 255, 255, 0.96);
  color: var(--text-main);
}

/* Focus ring – neutral glow */
.form-group input:focus,
.form-group select:focus {
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
   FORM ACTIONS / BUTTONS
   ========================================= */

.form-actions {
  display: flex;
  gap: 12px;
  padding-top: 20px;
  border-top: 1px solid var(--glass-border-soft);
}

/* Base button */
.btn {
  padding: 0.85rem 2.2rem;
  border-radius: 999px;
  font-weight: 600;
  font-size: 0.95rem;
  cursor: pointer;
  transition:
    transform 220ms ease,
    box-shadow 220ms ease,
    opacity 160ms ease,
    background 160ms ease,
    border-color 160ms ease;
  border: none;
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

/* Primary gradient button */
.btn-primary {
  position: relative;
  background: linear-gradient(
    135deg,
    var(--btn-gradient-from) 0%,
    var(--btn-gradient-to) 100%
  );
  color: #ffffff;
  box-shadow:
    0 0 0 1px rgba(255, 255, 255, 0.7),
    0 12px 30px -10px rgba(0, 0, 0, 0.35);
  overflow: hidden;
}

/* Glow halo */
.btn-primary::before {
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

.btn-primary:hover {
  transform: translateY(-5px);
  box-shadow:
    0 0 0 1px rgba(255, 255, 255, 0.9),
    0 16px 45px -12px rgba(0, 0, 0, 0.45);
}

.btn-primary:hover::before {
  opacity: 0.65;
  transform: translate3d(8px, -8px, 0);
}

/* Secondary (Cancel) */
.btn-secondary {
  background: rgba(255, 255, 255, 0.98);
  border: 1px solid var(--glass-border-soft);
  color: var(--text-main);
}

.btn-secondary:hover {
  background: #ffffff;
  border-color: rgba(0, 0, 0, 0.16);
  transform: translateY(-2px);
  box-shadow: 0 10px 26px -14px rgba(0, 0, 0, 0.3);
}

/* =========================================
   RESPONSIVE
   ========================================= */

@media (max-width: 768px) {
  .form-grid {
    grid-template-columns: 1fr;
  }

  .page-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }

  .edit-container {
    padding: 20px 16px 40px;
  }

  .edit-container::before {
    inset: 16px 0 0;
  }
}

      `}</style>
      
      <NurseNav />
      <div className="edit-container" style={{marginTop: "80px"}}>
        <div className="breadcrumb">
          <a href="/nurse/home">Home</a>
          <span>/</span>
          <a href="/nurse/patients">Patients</a>
          <span>/</span>
          <span>Edit</span>
        </div>
        
        <div className="page-header">
          <h1><i class="fa-solid fa-pen-to-square"></i>Edit Patient</h1>
          <div className="patient-id">{p.patientId}</div>
        </div>

        <div className="edit-card">
          {msg && (
            <div className="alert alert-error">
              <span>⚠</span>
              {msg}
            </div>
          )}
          
          <form onSubmit={save}>
            <div className="form-grid">
              <div className="form-group">
                <label>First Name *</label>
                <input 
                  placeholder="First name" 
                  value={p.firstName} 
                  onChange={e=>setP({...p, firstName:e.target.value})} 
                  required
                />
              </div>
              <div className="form-group">
                <label>Last Name *</label>
                <input 
                  placeholder="Last name" 
                  value={p.lastName} 
                  onChange={e=>setP({...p, lastName:e.target.value})} 
                  required
                />
              </div>
              <div className="form-group">
                <label>Age</label>
                <input 
                  placeholder="Age" 
                  type="number"
                  value={p.age} 
                  onChange={e=>setP({...p, age:e.target.value})}
                />
              </div>
              <div className="form-group">
                <label>Gender *</label>
                <select value={p.gender} onChange={e=>setP({...p, gender:e.target.value})}>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div className="form-group">
                <label>Height (cm)</label>
                <input 
                  placeholder="Height in cm" 
                  type="number"
                  value={p.height} 
                  onChange={e=>setP({...p, height:e.target.value})}
                />
              </div>
              <div className="form-group">
                <label>Weight (kg)</label>
                <input 
                  placeholder="Weight in kg" 
                  type="number"
                  value={p.weight} 
                  onChange={e=>setP({...p, weight:e.target.value})}
                />
              </div>
              <div className="form-group">
                <label>Phone</label>
                <input 
                  placeholder="+91 XXXXXXXXXX" 
                  value={p.phone} 
                  onChange={e=>setP({...p, phone:e.target.value})}
                />
              </div>
            </div>
            
            <div className="form-actions">
              <button type="submit" className="btn btn-primary">
               Save Changes
              </button>
              <button 
                type="button" 
                className="btn btn-secondary" 
                onClick={()=>navigate('/nurse/patients')}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

