import { useEffect, useState } from 'react';
import DoctorNav from '../../components/DoctorNav';
import http from '../../api/http';
import { useLocation } from 'react-router-dom';

export default function PrescriptionEditor() {
  const location = useLocation();
  const [ref, setRef] = useState('');
 const [meds, setMeds] = useState([
  { name:'', code: undefined, qty:'1', dosage:'', frequency:'', duration:'', instructions:'' }
]);

  const [notes, setNotes] = useState('');
  const [msg, setMsg] = useState('');
  const [saving, setSaving] = useState(false);

  // catalog state
  const [catalog, setCatalog] = useState([]);
  const [search, setSearch] = useState('');

  const loadCatalog = async (term='') => {
    try {
      // let server infer hospitalId from token; pass q for filtering
      const { data } = await http.get(`/medicine/catalog`, { params: { hospitalId: 'SELF', q: term } });
      setCatalog(Array.isArray(data) ? data : []);
    } catch {
      setCatalog([]);
    }
  };
  useEffect(()=>{ loadCatalog(); }, []);

const add = () => setMeds([...meds, { name:'', code: undefined, qty:'1', dosage:'', frequency:'', duration:'', instructions:'' }]);

  const remove = (i) => setMeds(meds.filter((_,idx)=>idx!==i));

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const initialRef = params.get('ref');
    if (initialRef) setRef(initialRef);
  }, [location.search]);

  const save = async () => {
    setMsg('');
    setSaving(true);
    try {
const payload = {
  consultationRef: ref.trim(),
  medications: meds
    .filter(m=>m.name && m.dosage && m.frequency && m.duration && Number(m.qty) > 0)
    .map(m => ({
      name: m.name,
      code: m.code,
      qty: Number(m.qty || 1),             // include qty
      dosage: m.dosage,
      frequency: m.frequency,
      duration: m.duration,
      instructions: m.instructions
    })),
  notes
};

      await http.post('/prescriptions', payload);

      // Trigger Rx bill build so nurse gets the charge immediately
      try {
        await http.post(`/rx/${encodeURIComponent(ref.trim())}/charge/build`);
      } catch (e) {
        console.warn('RX build trigger failed:', e?.response?.data?.message || e?.message);
      }

      setMsg('Prescription saved successfully');
      setTimeout(()=>{
        window.location.href = '/doctor/in-progress';
      }, 1500);
    } catch (e) {
      setMsg(e.response?.data?.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="rx-editor-page">
      <style>{`
        /* =========================================
   DOCTOR – PRESCRIPTION EDITOR (STUNNING GLASS)
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

.rx-editor-page {
  min-height: 100vh;
  background:
    radial-gradient(circle at top left, rgba(255, 255, 255, 0.96), #ffffff 65%),
    #ffffff;
}

.rx-editor-container {
  padding: 28px 24px 64px;
  max-width: 1200px;
  margin: 0 auto;
  position: relative;
  animation: fadeInUp 0.45s ease-out;
}

/* Respect navbar spacing (you already add inline padding-top) */
.rx-editor-container.with-navbar {
  padding-top: calc(80px + 4rem) !important;
}

/* Glass workspace sheet */
.rx-editor-container::before {
  content: "";
  position: absolute;
  inset: 32px -6px 0;
  margin: 0 auto;
  max-width: 1200px;
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

/* =========================================
   PAGE HEADER
   ========================================= */

.page-header {
  margin-bottom: 26px;
}

.page-header h1 {
  font-size: clamp(2.05rem, 3vw, 2.35rem);
  font-weight: 850;
  color: var(--text-strong);
  margin: 0 0 6px 0;
  display: inline-flex;
  align-items: center;
  gap: 10px;
  letter-spacing: -0.035em;
}

.page-header p {
  color: var(--text-muted);
  font-size: 0.95rem;
  margin: 0;
}

/* =========================================
   MAIN CARD
   ========================================= */

.rx-card {
  background: var(--glass-bg-strong);
  border-radius: 22px;
  padding: 22px 22px 24px;
  box-shadow: var(--shadow-soft);
  border: 1.5px solid var(--glass-border-strong);
  backdrop-filter: blur(16px);
  margin-bottom: 24px;
}

/* =========================================
   CONSULTATION REF + SAVE (TOP BAR)
   ========================================= */

.consultation-input-section {
  display: flex;
  align-items: flex-end;
  gap: 16px;
  margin-bottom: 20px;
  padding: 18px 16px;
  background: var(--glass-bg-soft);
  border-radius: 18px;
  border: 1.5px solid var(--glass-border-soft);
}

/* Form group */
.form-group {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.form-group label {
  font-size: 0.86rem;
  font-weight: 600;
  color: var(--text-main);
}

.form-group input {
  padding: 11px 14px;
  border: 1px solid var(--glass-border-strong);
  border-radius: 12px;
  font-size: 0.9rem;
  font-family: system-ui, -apple-system, BlinkMacSystemFont, "Inter", sans-serif;
  transition:
    border-color 180ms ease,
    box-shadow 180ms ease,
    background 180ms ease,
    transform 180ms ease;
  background: #ffffff;
  color: var(--text-main);
}

.form-group input:focus {
  outline: none;
  border-color: rgba(0, 0, 0, 0.24);
  box-shadow:
    0 0 0 1px rgba(255, 255, 255, 0.9),
    0 0 0 4px rgba(0, 0, 0, 0.08),
    0 10px 30px -14px rgba(0, 0, 0, 0.3);
  transform: translateY(-1px);
}

/* =========================================
   SAVE BUTTON (TOP + BOTTOM)
   ========================================= */

.btn-save {
  position: relative;
  padding: 0.85rem 2.1rem;
  background: linear-gradient(
    135deg,
    var(--btn-gradient-from),
    var(--btn-gradient-to)
  );
  color: #ffffff;
  border: none;
  border-radius: 999px;
  font-weight: 640;
  font-size: 0.95rem;
  cursor: pointer;
  transition:
    transform 220ms ease,
    box-shadow 220ms ease,
    opacity 160ms ease;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  box-shadow:
    0 0 0 1px rgba(255, 255, 255, 0.7),
    0 14px 36px -12px rgba(0, 0, 0, 0.4);
  overflow: hidden;
}

/* Glow */
.btn-save::before {
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

.btn-save:hover:not(:disabled) {
  transform: translateY(-4px);
  box-shadow:
    0 0 0 1px rgba(255, 255, 255, 0.9),
    0 20px 50px -18px rgba(0, 0, 0, 0.55);
}

.btn-save:hover:not(:disabled)::before {
  opacity: 0.7;
  transform: translate3d(9px, -9px, 0);
}

.btn-save:disabled {
  opacity: 0.55;
  cursor: not-allowed;
  transform: none;
  box-shadow:
    0 0 0 1px rgba(255, 255, 255, 0.7),
    0 8px 20px -10px rgba(0, 0, 0, 0.25);
}

/* =========================================
   ALERTS
   ========================================= */

.alert {
  padding: 12px 14px;
  border-radius: 14px;
  margin-bottom: 20px;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.9rem;
}

.alert-success {
  background: #e8f5e9;
  color: var(--text-main);
  border: 1px solid rgba(0, 0, 0, 0.08);
}

.alert-error {
  background: #ffebee;
  color: var(--text-main);
  border: 1px solid rgba(0, 0, 0, 0.08);
}

/* =========================================
   SECTION HEADERS
   ========================================= */

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 18px;
}

.section-header h2 {
  font-size: 1.05rem;
  font-weight: 740;
  color: var(--text-strong);
  margin: 0;
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

/* Add medicine button */
.btn-add {
  padding: 0.6rem 1.3rem;
  background: #e8f5e9;
  color: var(--text-main);
  border: 1px solid var(--glass-border-soft);
  border-radius: 999px;
  font-weight: 600;
  font-size: 0.85rem;
  cursor: pointer;
  transition:
    background 160ms ease,
    border-color 160ms ease,
    transform 160ms ease,
    box-shadow 160ms ease;
}

.btn-add:hover {
  background: #ffffff;
  border-color: rgba(0, 0, 0, 0.18);
  transform: translateY(-2px);
  box-shadow: 0 12px 26px -16px rgba(0, 0, 0, 0.32);
}

/* =========================================
   MEDICATION CARDS
   ========================================= */

.med-cards {
  display: flex;
  flex-direction: column;
  gap: 14px;
  margin-bottom: 24px;
}

/* Each medicine tile */
.med-card {
  position: relative;
  padding: 18px 16px 16px;
  background: var(--glass-bg-soft);
  border-radius: 18px;
  border: 1.5px solid var(--glass-border-soft);
  transition:
    transform 200ms ease,
    box-shadow 200ms ease,
    border-color 200ms ease,
    background 200ms ease;
  backdrop-filter: blur(14px);
}

.med-card:hover {
  transform: translateY(-3px);
  box-shadow: var(--shadow-soft);
  border-color: rgba(0, 0, 0, 0.16);
  background: rgba(255, 255, 255, 0.98);
}

/* Card header: # + remove */
.med-card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.med-number {
  font-size: 1rem;
  font-weight: 720;
  color: var(--text-strong);
}

/* Remove button */
.btn-remove {
  padding: 4px 10px;
  background: #ffebee;
  color: var(--text-main);
  border: 1px solid rgba(0, 0, 0, 0.08);
  border-radius: 999px;
  font-size: 0.78rem;
  font-weight: 600;
  cursor: pointer;
  transition:
    background 160ms ease,
    color 160ms ease,
    border-color 160ms ease,
    transform 160ms ease,
    box-shadow 160ms ease;
}

.btn-remove:hover {
  background: #ffffff;
  border-color: rgba(0, 0, 0, 0.16);
  transform: translateY(-1px);
  box-shadow: 0 10px 24px -16px rgba(0, 0, 0, 0.35);
}

/* =========================================
   MEDICATION GRID FIELDS
   ========================================= */

.med-grid {
  display: grid;
  grid-template-columns: 2.2fr 0.7fr 1.1fr 1.1fr 1.1fr;
  gap: 10px;
  margin-bottom: 8px;
  align-items: flex-start;
}

/* Allow grid children to shrink nicely on small viewports and prevent inputs
   from forcing the card to overflow. Inputs should use border-box sizing. */
.med-grid > * { min-width: 0; }

/* General inputs/selects in med-grid */
.med-grid input,
.med-grid select {
  padding: 9px 12px;
  border: 1px solid var(--glass-border-strong);
  border-radius: 10px;
  font-size: 0.86rem;
  font-family: system-ui, -apple-system, BlinkMacSystemFont, "Inter", sans-serif;
  background: #ffffff;
  color: var(--text-main);
  transition:
    border-color 180ms ease,
    box-shadow 180ms ease,
    background 180ms ease,
    transform 180ms ease;
  box-sizing: border-box;
  min-width: 0;
}

.med-grid input:focus,
.med-grid select:focus {
  outline: none;
  border-color: rgba(0, 0, 0, 0.24);
  box-shadow:
    0 0 0 1px rgba(255, 255, 255, 0.9),
    0 0 0 4px rgba(0, 0, 0, 0.08),
    0 10px 30px -14px rgba(0, 0, 0, 0.3);
  transform: translateY(-1px);
}

/* Medicine picker row (search + select) */
.med-grid > div:first-child {
  display: flex;
  gap: 6px;
}

/* Instructions full-width */
.med-instructions {
  grid-column: 1 /-1;
}

.med-instructions input {
  width: 100%;
  box-sizing: border-box;
}

/* =========================================
   NOTES
   ========================================= */

.notes-section textarea {
  width: 100%;
  min-height: 150px;
  padding: 14px 14px;
  border: 1px solid var(--glass-border-strong);
  border-radius: 16px;
  font-size: 0.92rem;
  font-family: system-ui, -apple-system, BlinkMacSystemFont, "Inter", sans-serif;
  resize: vertical;
  transition:
    border-color 180ms ease,
    box-shadow 180ms ease,
    background 180ms ease,
    transform 180ms ease;
  background: #ffffff;
  color: var(--text-main);
}

.notes-section textarea:focus {
  outline: none;
  border-color: rgba(0, 0, 0, 0.24);
  box-shadow:
    0 0 0 1px rgba(255, 255, 255, 0.9),
    0 0 0 4px rgba(0, 0, 0, 0.08),
    0 10px 30px -14px rgba(0, 0, 0, 0.3);
  transform: translateY(-1px);
}

/* =========================================
   STICKY SAVE BAR (BOTTOM)
   ========================================= */

.save-bar {  
  position: sticky;
  bottom: 0;
  background: rgba(255, 255, 255, 0.98);
  padding: 14px 20px;
  border-radius: 18px 18px 0 0;
  box-shadow:
    0 -14px 40px -20px rgba(0, 0, 0, 0.4),
    0 0 0 1px rgba(255, 255, 255, 0.7);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  backdrop-filter: blur(18px);
}

.save-bar-info {
  font-size: 0.88rem;
  color: var(--text-muted);
}

/* =========================================
   RESPONSIVE
   ========================================= */

@media (max-width: 900px) {
  .med-grid {
    grid-template-columns: 1.8fr 0.7fr 1.1fr;
    grid-auto-rows: auto;
  }

  /* Push some fields to next rows on medium screens */
  .med-grid input:nth-of-type(3),
  .med-grid input:nth-of-type(4) {
    grid-column: span 1;
  }
}

@media (max-width: 768px) {
  .rx-editor-container {
    padding: 22px 16px 48px;
  }

  .rx-editor-container::before {
    inset: 24px -4px 0;
  }

  .consultation-input-section {
    flex-direction: column;
    align-items: stretch;
  }

  .med-grid {
    grid-template-columns: 1fr;
  }

  .save-bar {
    flex-direction: column;
    align-items: flex-start;
  }

  .save-bar .btn-save {
    width: 100%;
    justify-content: center;
  }
}

      `}</style>

      <DoctorNav />
      <div className="rx-editor-container with-navbar" style={{ paddingTop: 'calc(80px + 4rem)' }}>
        <div className="page-header">
          <h1>
            <span>💊</span>
            Prescription Editor
          </h1>
          <p>Create a new prescription for consultation</p>
        </div>

        <div className="rx-card">
          <div className="consultation-input-section">
            <div className="form-group">
              <label>Consultation ID / Reference *</label>
              <input
                placeholder="CON000001"
                value={ref}
                onChange={e=>setRef(e.target.value)}
              />
            </div>
            <button onClick={save} className="btn-save" disabled={saving}>
              {saving ? '💾 Saving...' : '💾 Save Prescription'}
            </button>
          </div>

          {msg && (
            <div className={`alert ${msg.includes('✓') || msg.includes('success') ? 'alert-success' : 'alert-error'}`}>
              {msg.includes('✓') || msg.includes('success') ? '✓' : '⚠'} {msg}
            </div>
          )}

          <div className="section-header">
            <h2>💊 Medications</h2>
            <button onClick={add} className="btn-add">+ Add Medicine</button>
          </div>

          <div className="med-cards">
            {meds.map((m, i)=>(
              <div key={i} className="med-card">
                <div className="med-card-header">
                  <div className="med-number">#{i + 1}</div>
                  {meds.length > 1 && (
                    <button onClick={()=>remove(i)} className="btn-remove">✕ Remove</button>
                  )}
                </div>

<div className="med-grid">
  {/* Medicine picker: search + select from catalog */}
  <div style={{ display: 'flex', gap: 6 }}>
    <input
      placeholder="Search medicine"
      value={search}
      onChange={async e => {
        setSearch(e.target.value);
        await loadCatalog(e.target.value);
      }}
    />
    <select
      value={m.code || m.name}
      onChange={e => {
        const val = e.target.value;
        const picked = catalog.find(x => x.code === val) || catalog.find(x => x.name === val);
        const x = [...meds];
        if (picked) {
          x[i].name = picked.name;
          x[i].code = picked.code || undefined;
        } else {
          x[i].name = val;
          x[i].code = undefined;
        }
        setMeds(x);
      }}
      style={{ color: !m.code && !m.name ? '#aaa' : undefined }}
    >
      <option value="" disabled style={{ color: '#aaa' }}>Select from catalog</option>
      {catalog.map(item => (
        <option key={(item.code || item.name) + item._id} value={item.code || item.name}>
          {item.name} {item.strength ? `— ${item.strength}` : ''} — ₹{Number(item.unitPrice || 0).toLocaleString('en-IN')}
        </option>
      ))}
    </select>
  </div>

  {/* Qty input */}
  <input
    type="number"
    min="1"
    placeholder="Qty *"
    value={m.qty}
    onChange={e=>{ 
      const x=[...meds]; 
      const val = e.target.value;
      x[i].qty = val.replace(/[^\d]/g,'') || '1';
      setMeds(x); 
    }}
    required
  />

  <input
    placeholder="Dosage *"
    value={m.dosage}
    onChange={e=>{ const x=[...meds]; x[i].dosage=e.target.value; setMeds(x); }}
  />
  <input
    placeholder="Frequency *"
    value={m.frequency}
    onChange={e=>{ const x=[...meds]; x[i].frequency=e.target.value; setMeds(x); }}
  />
  <input
    placeholder="Duration *"
    value={m.duration}
    onChange={e=>{ const x=[...meds]; x[i].duration=e.target.value; setMeds(x); }}
  />
  <div className="med-instructions">
    <input
      placeholder="Special instructions (optional)"
      value={m.instructions}
      onChange={e=>{ const x=[...meds]; x[i].instructions=e.target.value; setMeds(x); }}
    />
  </div>
</div>

              </div>
            ))}
          </div>

          <div className="section-header">
            <h2>📝 Additional Notes</h2>
          </div>
          <div className="notes-section">
            <textarea
              placeholder="Add any additional instructions, precautions, or notes for the patient..."
              value={notes}
              onChange={e=>setNotes(e.target.value)}
            />
          </div>
        </div>

        <div className="save-bar">
          <div className="save-bar-info">
            {meds.filter(m=>m.name && m.dosage && m.frequency && m.duration).length} medication(s) ready
          </div>
          <button onClick={save} className="btn-save" disabled={saving}>
            {saving ? '💾 Saving...' : '💾 Save Prescription'}
          </button>
        </div>
      </div>
    </div>
  );
}
