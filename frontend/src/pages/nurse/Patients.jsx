import { useEffect, useState } from 'react';
import NurseNav from '../../components/NurseNav';
import { useNavigate } from 'react-router-dom';
import http from '../../api/http';

export default function Patients() {
  const [list, setList] = useState([]);
  const [form, setForm] = useState({
    firstName:'', lastName:'', age:'', gender:'male', email:'', phone:'',
    height:'', weight:'', conditionType:'other'
  });
  const [files, setFiles] = useState([]);
  const [msg, setMsg] = useState('');

const load = async () => {
  try {
    const { data } = await http.get('/nurse/patients');

    const normalized = (data || []).map(d => {
      const id = d.id || d._id;
      const personal = d.personalInfo || {};

      const fullName = d.name || '';
      const [firstFromName, ...restLast] = fullName.split(' ').filter(Boolean);

      const firstName = personal.firstName || firstFromName || '';
      const lastName = personal.lastName || (restLast.length ? restLast.join(' ') : '');
      const phone = personal.phone || d.phone || '';
      const age = personal.age ?? null;
      const gender = personal.gender || '';

      const photo =
        (Array.isArray(d.photos) && d.photos[0]?.url) ||
        personal.photo ||
        '';

      // ⭐ AI fields
      const woundAI = d.woundCareAI || null;
      const skinAI  = d.skinCareAI || null;

      // ⭐ Rural AI
      const ruralAIArray = Array.isArray(d.ruralCareAssessment)
        ? d.ruralCareAssessment
        : [];

      const latestRuralAI =
        ruralAIArray.length > 0 ? ruralAIArray[ruralAIArray.length - 1] : null;

      // ⭐ Final flags
      const hasAI = !!(
        woundAI ||
        skinAI ||
        ruralAIArray.length > 0
      );

      const aiSummary = woundAI || skinAI || latestRuralAI;

      return {
        id,
        patientId: d.patientId,
        firstName,
        lastName,
        phone,
        age,
        gender,
        conditionType: d.conditionType || 'other',
        photo,
        createdAt: d.createdAt,
        hasAI,
        aiSummary,
        woundCareAI: woundAI,
        skinCareAI: skinAI,
        ruralCareAssessment: ruralAIArray
      };
    });

    setList(normalized);

  } catch (e) {
    console.error("Failed loading patients", e);
    setList([]);
  }
};


  useEffect(() => { load(); }, []);

  const onPick = (e) => setFiles(Array.from(e.target.files || []));

  const create = async (e) => {
    e.preventDefault();
    setMsg('');
    if ((form.conditionType === 'skin' || form.conditionType === 'wound') && files.length === 0) {
      setMsg('Please attach at least one image for skin/wound');
      return;
    }
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k,v]) => fd.append(k, v));
      files.forEach(f => fd.append('photos', f));
      await http.post('/nurse/patients', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      setMsg('Patient registered successfully');
      setForm({ firstName:'', lastName:'', age:'', gender:'male', email:'', phone:'', height:'', weight:'', conditionType:'other' });
      setFiles([]);
      load();
    } catch (e) {
      setMsg(e.response?.data?.message || 'Failed');
    }
  };
  const navigate = useNavigate();
  return (
    <div className="patients-page">
      <style>{`
       /* =========================================
   PATIENTS – STRICT PALETTE GLASS UI
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

  /* Neutrals via opacity (no extra hex) */
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
   LAYOUT / HEADER
   ========================================= */

.patients-page {
  min-height: 100vh;
  background:
    radial-gradient(circle at top left, rgba(255, 255, 255, 0.92), #ffffff 60%),
    #ffffff;
}

.patients-container {
  padding: 24px;
  max-width: 1400px;
  margin: 0 auto 48px;
  position: relative;
}

/* Glass workspace plate behind content */
.patients-container::before {
  content: "";
  position: absolute;
  inset: 24px 0 0;
  margin: 0 auto;
  max-width: 1300px;
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

.patients-header {
  margin-bottom: 28px;
}

.patients-header h1 {
  font-size: clamp(2rem, 3vw, 2.4rem);
  font-weight: 800;
  color: var(--text-strong);
  margin: 0 0 8px 0;
  letter-spacing: -0.03em;
  display: inline-flex;
  align-items: center;
  gap: 8px;
}


.patients-header p {
  color: var(--text-muted);
  font-size: 0.95rem;
  margin: 0;
}

/* =========================================
   REGISTER PATIENT – FORM CARD
   ========================================= */

.patients-form-card {
  background: var(--glass-bg-strong);
  border-radius: 20px;
  padding: 28px 26px 26px;
  box-shadow: var(--shadow-soft);
  border: 1.5px solid rgba(0,0,0,0.03);
  backdrop-filter: blur(14px);
  margin-bottom: 28px;
}

.patients-form-card:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-softer);
  border-color: rgba(0, 0, 0, 0.12);
}

.patients-form-card h2 {
  font-size: 1.1rem;
  font-weight: 700;
  color: var(--text-strong);
  margin: 0 0 20px 0;
  display: flex;
  align-items: center;
  gap: 8px;
}

/* Grid layout */
.form-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 18px 20px;
  margin-bottom: 20px;
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

/* Inputs / selects – glass with visible border */
.form-group input,
.form-group select {
  padding: 10px 14px;
  border-radius: 14px;
  border: 1.5px solid var(--glass-border-strong);
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

/* Focus ring (neutral glow) */
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

.form-group.full-width {
  grid-column: 1 / -1;
}

/* =========================================
   FILE UPLOAD ZONE
   ========================================= */

.file-upload-zone {
  grid-column: 1 / -1;
  border: 2px dashed rgba(0, 0, 0, 0.08);
  border-radius: 16px;
  padding: 26px 22px;
  text-align: center;
  background: rgba(255, 255, 255, 0.96);
  transition: all 0.3s ease;
  cursor: pointer;
}

.file-upload-zone:hover {
  border-color: rgba(0, 0, 0, 0.2);
  background: rgba(255, 255, 255, 1);
}

.file-upload-zone.has-files {
  border-color: rgba(0, 0, 0, 0.2);
}

.upload-icon {
  font-size: 40px;
  margin-bottom: 10px;
}

.file-list {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 14px;
}

.file-item {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 10px;
  background: #ffffff;
  border: 1px solid var(--glass-border-soft);
  border-radius: 10px;
  font-size: 0.85rem;
}

/* =========================================
   PRIMARY BUTTON
   ========================================= */

.btn-primary {
  position: relative;
  padding: 0.85rem 2.3rem;
  background: linear-gradient(
    135deg,
    var(--btn-gradient-from) 0%,
    var(--btn-gradient-to) 100%
  );
  color: #ffffff;
  border: none;
  border-radius: 999px;
  font-weight: 600;
  font-size: 0.95rem;
  cursor: pointer;
  transition:
    transform 220ms ease,
    box-shadow 220ms ease,
    opacity 160ms ease;
  display: inline-flex;
  align-items: center;
  gap: 6px;
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

.btn-primary:active {
  transform: translateY(-1px);
}

/* =========================================
   ALERTS
   ========================================= */

.alert {
  padding: 12px 14px;
  border-radius: 12px;
  margin-bottom: 16px;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.9rem;
}

/* Success uses #e8f5e9 */
.alert-success {
  background: #e8f5e9;
  color: var(--text-main);
  border: 1px solid rgba(0, 0, 0, 0.08);
}

/* Error uses #ffebee */
.alert-error {
  background: #ffebee;
  color: var(--text-main);
  border: 1px solid rgba(0, 0, 0, 0.08);
}

/* =========================================
   TABLE CARD / TABLE
   ========================================= */

.patients-table-card {
  background: var(--glass-bg-strong);
  border-radius: 20px;
  padding: 26px 24px;
  box-shadow: var(--shadow-soft);
  border: 1.5px solid rgba(0,0,0,0.03);
  backdrop-filter: blur(14px);
}

.patients-table-card:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-softer);
  border-color: rgba(0, 0, 0, 0.12);
}

.patients-table-card h2 {
  font-size: 1.1rem;
  font-weight: 700;
  color: var(--text-strong);
  margin: 0 0 18px 0;
}

/* Table layout */
.patients-table {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
}

/* Table header */
.patients-table thead th {
  background: rgba(255, 255, 255, 0.96);
  padding: 14px 16px;
  text-align: left;
  font-weight: 600;
  font-size: 0.82rem;
  color: var(--text-main);
  border-bottom: 2px solid rgba(0, 0, 0, 0.06);
}

.patients-table thead th:first-child {
  border-top-left-radius: 10px;
}

.patients-table thead th:last-child {
  border-top-right-radius: 10px;
}

/* Table body */
.patients-table tbody td {
  padding: 14px 16px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
  font-size: 0.9rem;
  color: var(--text-main);
}

.patients-table tbody tr {
  background: rgba(255, 255, 255, 0.98);
  transition: background 0.18s ease, box-shadow 0.18s ease,
    transform 0.18s ease;
}

.patients-table tbody tr:hover {
  background: #ffffff;
  transform: translateY(-2px);
  box-shadow: 0 10px 34px -18px rgba(0, 0, 0, 0.3);
}

/* Patient avatar */
.patient-avatar {
  width: 46px;
  height: 46px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid rgba(0, 0, 0, 0.08);
}

/* Name text */
.patient-name {
  font-weight: 600;
  color: var(--text-strong);
}

/* Condition badge */
.badge {
  display: inline-flex;
  align-items: center;
  padding: 5px 10px;
  border-radius: 999px;
  font-size: 0.8rem;
  font-weight: 500;
}

/* Use success bg for condition pill */
.badge-condition {
  background: #e8f5e9;
  color: var(--text-main);
}

/* =========================================
   TABLE ACTION / ICON BUTTONS
   ========================================= */

.btn-icon {
  padding: 6px 12px;
  background: rgba(255, 255, 255, 0.98);
  border: 1px solid var(--glass-border-soft);
  border-radius: 10px;
  cursor: pointer;
  transition:
    background 0.18s ease,
    border-color 0.18s ease,
    color 0.18s ease,
    transform 0.18s ease,
    box-shadow 0.18s ease;
  font-size: 0.85rem;
  color: var(--text-main);
}

/* Hover: subtle lift */
.btn-icon:hover {
  background: #ffffff;
  border-color: rgba(0, 0, 0, 0.16);
  color: var(--text-strong);
  transform: translateY(-2px);
  box-shadow: 0 8px 24px -14px rgba(0, 0, 0, 0.3);
}

/* =========================================
   EMPTY STATE
   ========================================= */

.empty-state {
  text-align: center;
  padding: 50px 16px;
  color: var(--text-muted);
}

.empty-state-icon {
  font-size: 3rem;
  margin-bottom: 10px;
  opacity: 0.5;
}

/* =========================================
   RESPONSIVE
   ========================================= */

@media (max-width: 768px) {
  .form-grid {
    grid-template-columns: 1fr;
  }

  .patients-container {
    padding: 20px 16px 40px;
  }

  .patients-container::before {
    inset: 16px 0 0;
  }

  .patients-table {
    display: block;
    overflow-x: auto;
  }
}

      `}</style>
      
      <NurseNav />
      <div className="patients-container" style={{ marginTop: "80px" }}>
        <div className="patients-header">
          <h1>👥 Patient Registry</h1>
          <p>Register and manage patient information</p>
        </div>

        <div className="patients-form-card">
          <h2>📋 Register New Patient</h2>
          {msg && (
            <div className={`alert ${msg.includes('success') || msg.includes('✓') ? 'alert-success' : 'alert-error'}`}>
              <span>{msg.includes('success') || msg.includes('✓') ? '✓' : '⚠'}</span>
              {msg}
            </div>
          )}
          <form onSubmit={create}>
            <div className="form-grid">
              <div className="form-group">
                <label>First Name *</label>
                <input placeholder="Enter first name" value={form.firstName} onChange={e=>setForm({...form, firstName:e.target.value})} required/>
              </div>
              <div className="form-group">
                <label>Last Name *</label>
                <input placeholder="Enter last name" value={form.lastName} onChange={e=>setForm({...form, lastName:e.target.value})} required/>
              </div>
              <div className="form-group">
                <label>Age</label>
                <input placeholder="Age" type="number" value={form.age} onChange={e=>setForm({...form, age:e.target.value})}/>
              </div>
              <div className="form-group">
                <label>Gender *</label>
                <select value={form.gender} onChange={e=>setForm({...form, gender:e.target.value})}>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div className="form-group">
                <label>Email</label>
                <input placeholder="email@example.com" type="email" value={form.email} onChange={e=>setForm({...form, email:e.target.value})}/>
              </div>
              <div className="form-group">
                <label>Phone</label>
                <input placeholder="+91 XXXXXXXXXX" value={form.phone} onChange={e=>setForm({...form, phone:e.target.value})}/>
              </div>
              <div className="form-group">
                <label>Height (cm)</label>
                <input placeholder="170" type="number" value={form.height} onChange={e=>setForm({...form, height:e.target.value})}/>
              </div>
              <div className="form-group">
                <label>Weight (kg)</label>
                <input placeholder="70" type="number" value={form.weight} onChange={e=>setForm({...form, weight:e.target.value})}/>
              </div>
              <div className="form-group full-width">
                <label>Condition Type *</label>
                <select value={form.conditionType} onChange={e=>setForm({...form, conditionType:e.target.value})}>
                  <option value="other">Other</option>
                  <option value="skin">Skin</option>
                  <option value="wound">Wound</option>
                </select>
                {(form.conditionType === 'skin' || form.conditionType === 'wound') && (
                  <p style={{margin:'6px 0 0 0', fontSize:13, color:'hsl(4 90% 50%)'}}>⚠ Image required for skin/wound conditions</p>
                )}
              </div>
              
              <div className={`file-upload-zone ${files.length > 0 ? 'has-files' : ''}`} onClick={()=>document.getElementById('file-input').click()}>
                <input id="file-input" type="file" multiple accept="image/*" onChange={onPick} style={{display:'none'}}/>
                <div className="upload-icon">📷</div>
                <div style={{fontSize:16, fontWeight:500, marginBottom:6}}>
                  {files.length > 0 ? `${files.length} file(s) selected` : 'Click to upload patient images'}
                </div>
                <div style={{fontSize:14, color:'hsl(215 16% 47%)'}}>
                  Supports JPG, PNG, HEIC (Required for skin/wound)
                </div>
                {files.length > 0 && (
                  <div className="file-list">
                    {files.map((f, i) => (
                      <div key={i} className="file-item">📎 {f.name}</div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            
            <button type="submit" className="btn-primary">
             Register Patient
            </button>
          </form>
        </div>

        <div className="patients-table-card">
          <h2>📊 Registered Patients ({list.length})</h2>
          {list.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">👤</div>
              <h3>No patients registered yet</h3>
              <p>Start by registering your first patient above</p>
            </div>
          ) : (
            <table className="patients-table">
              <thead>
                <tr>
                  <th>Patient</th>
                  <th>ID</th>
                  <th>Contact</th>
                  <th>Age/Gender</th>
                  <th>Condition</th>
                  <th>Actions</th>
                  <th>AI-Assistance</th>    
                  <th>AI Summary</th>       
                </tr>
              </thead>
              <tbody>
                {list.map(p=>(
                  <tr key={p.id || p.patientId}>
                    <td>
                      <div style={{display:'flex', alignItems:'center', gap:12}}>
                        {p.photo ? (
                          <img src={p.photo} alt="" className="patient-avatar"/>
                        ) : (
                          <div className="patient-avatar" style={{display:'flex', alignItems:'center', justifyContent:'center', background:'hsl(174 62% 95%)', color:'hsl(174 62% 47%)', fontWeight:600}}>
                            {p.firstName?.[0]}{p.lastName?.[0]}
                          </div>
                        )}
                        <div className="patient-name">
                          {p.firstName} {p.lastName}
                        </div>
                      </div>
                    </td>
                    <td style={{fontFamily:'monospace', fontSize:14}}>{p.patientId}</td>
                    <td>{p.phone || '—'}</td>
                    <td>{p.age || '?'} • {p.gender || '?'}</td>
                    <td>
                      <span className="badge badge-condition">
                        {p.conditionType || 'other'}
                      </span>
                    </td>
                    <td>
  <button
    className="btn-icon"
    onClick={() => navigate(`/nurse/patient/edit?ref=${encodeURIComponent(p.patientId || p.id)}`)}
  >
    ✏️ Edit
  </button>
</td>
<td>

 <a className="btn-icon" href={
  ((p.conditionType || 'other').toLowerCase() === 'skin')
    ? `/ai/skin?ref=${encodeURIComponent(p.patientId || p.id)}`
    : ((p.conditionType || 'other').toLowerCase() === 'wound')
      ? `/ai/wound?ref=${encodeURIComponent(p.patientId || p.id)}`
      : `/ai/rural?ref=${encodeURIComponent(p.patientId || p.id)}`
 } style={{textDecoration: "None"}}>
  🤖 Assist
 </a>
</td>



<td>
  {(p.woundCareAI ||
    p.skinCareAI ||
    (p.ruralCareAssessment && p.ruralCareAssessment.length > 0)
   ) ? (
    <button
      className="btn-icon"
     onClick={() => {
  const isSkinOrWound = p.skinCareAI || p.woundCareAI;
  const path = isSkinOrWound
    ? "/nurse/patient/ai-summary-sw"
    : "/nurse/patient/ai-summary";

  navigate(`${path}?ref=${encodeURIComponent(p.patientId)}`, {
    state: { patient: p }  // safe for all
  });
}}


    >
      📋 View
    </button>
  ) : (
    <span style={{ color: "gray", fontSize: 14 }}>—</span>
  )}
</td>




                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

