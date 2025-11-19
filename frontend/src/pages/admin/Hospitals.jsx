import { useEffect, useState } from 'react';
import AdminNav from '../../components/AdminNav';
import http from '../../api/http';

export default function Hospitals() {
  const [list, setList] = useState([]);
  const [form, setForm] = useState({
    name: '',
    ownerFirstName: '',
    ownerLastName: '',
    ownerPhone: '',
    ownerEmail: '',
    tempPassword: '',
    paymentRequiredBeforeConsult: true,
    city: '',
    state: 'Telangana',
    pincode: '',
  });
  const [msg, setMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const load = async () => {
    try {
      const { data } = await http.get('/admin/hospitals');
      setList(data || []);
    } catch (e) {
      setList([]);
    }
  };

  useEffect(() => { load(); }, []);

  const create = async (e) => {
    e.preventDefault();
    setMsg('');
    setLoading(true);
    try {
      await http.post('/admin/hospitals', {
        name: form.name,
        owner: {
          firstName: form.ownerFirstName,
          lastName: form.ownerLastName,
          phone: form.ownerPhone,
          email: form.ownerEmail,
        },
        address: { city: form.city, state: form.state, pincode: form.pincode },
        paymentRequiredBeforeConsult: form.paymentRequiredBeforeConsult,
        tempPassword: form.tempPassword || 'Owner@12345',
      });
      setMsg('✅ Hospital created successfully!');
      setForm({
        name: '', ownerFirstName:'', ownerLastName:'', ownerPhone:'', ownerEmail:'',
        tempPassword:'', paymentRequiredBeforeConsult:true, city:'', state:'Telangana', pincode:''
      });
      load();
    } catch (e) {
      setMsg('❌ ' + (e.response?.data?.message || 'Failed to create hospital'));
    } finally {
      setLoading(false);
    }
  };

  const toggleStatus = async (id, status) => {
    try {
      await http.patch(`/admin/hospitals/${id}/status`, { status });
      load();
    } catch {}
  };

  return (
    <>
      <style>{`

:root {
  --color-white: #ffffff;
  --color-success-bg: #e8f5e9;
  --color-error-bg: #ffebee;

  /* Primary button gradient (allowed) */
  --btn-gradient-from: #0d47a1;
  --btn-gradient-to: #1565c0;

  /* Neutral using opacity only */
  --glass-bg-strong: rgba(255, 255, 255, 0.96);
  --glass-bg-soft: rgba(255, 255, 255, 0.88);
  --glass-border-strong: rgba(255, 255, 255, 0.9);
  --glass-border-soft: rgba(255, 255, 255, 0.7);

  --shadow-soft: 0 10px 40px -10px rgba(0, 0, 0, 0.08);
  --shadow-softer: 0 18px 45px -18px rgba(0, 0, 0, 0.12);

  --text-strong: rgba(0, 0, 0, 0.85);
  --text-main: rgba(0, 0, 0, 0.72);
  --text-muted: rgba(0, 0, 0, 0.5);

  --radius-md: 10px;
  --radius-lg: 20px;
}

/* ===========
   1. RESET / TYPOGRAPHY
   =========== */

*,
*::before,
*::after {
  box-sizing: border-box;
}

html {
  font-size: 16px;
  scroll-behavior: smooth;
}

body {
  margin: 0;
  font-family: system-ui, -apple-system, BlinkMacSystemFont, "Inter",
    "Roboto", sans-serif;
  color: var(--text-main);
  background: #ffffff;
  line-height: 1.5;
}

h1,
h2,
h3,
h4,
h5,
h6,
p {
  margin: 0;
}

a {
  color: inherit;
  text-decoration: none;
}

a:hover {
  text-decoration: underline;
}

img,
svg {
  max-width: 100%;
  height: auto;
  display: block;
}

/* Smooth transitions for interactive elements */

.form-card,
.table-card {
  border: 2px solid #0a3d91; /* Use your primary blue for a modern accent */
  box-shadow: 0 8px 32px -8px rgba(10, 61, 145, 0.10), 0 1.5px 8px rgba(31,101,217,0.07);
}
button,
.hospitals-table tbody tr {
  transition:
    transform 220ms ease,
    box-shadow 220ms ease,
    background 220ms ease,
    border-color 220ms ease,
    opacity 180ms ease;
}

/* ===========
   2. PAGE LAYOUT
   =========== */

.hospitals-page {
  min-height: 100vh;
  background:
    radial-gradient(circle at top left, rgba(255, 255, 255, 0.9), #ffffff 60%),
    #ffffff;
  padding-bottom: 40px;
}

.hospitals-container {
  max-width: 1400px;
  margin: 0 auto;
  padding: 3rem 1.5rem 4rem;
  position: relative;
}

/* Glass workspace plate */
.hospitals-container::before {
  content: "";
  position: absolute;
  inset: 24px 0 0;
  margin: 0 auto;
  max-width: 1300px;
  border-radius: 24px;
  background: linear-gradient(
    135deg,
    rgba(255, 255, 255, 0.98),
    rgba(255, 255, 255, 0.9)
  );
  border: 2px solid rgba(0, 0, 0, 0.03);
  box-shadow: var(--shadow-soft);
  backdrop-filter: blur(18px);
  z-index: -1;
}

/* Header section */
.page-header {
  margin-bottom: 2.5rem;
  position: relative;
}

.page-title {
  font-size: clamp(1.9rem, 3vw, 2.4rem);
  font-weight: 800;
  letter-spacing: -0.03em;
  color: var(--text-strong);
  display: inline-flex;
  align-items: center;
  gap: 10px;
}


.page-subtitle {
  margin-top: 0.6rem;
  font-size: 0.95rem;
  color: var(--text-muted);
  max-width: 520px;
}

/* ===========
   3. CARDS / FORM
   =========== */

.form-card,
.table-card {
  background: var(--glass-bg-strong);
  padding: 2.1rem 2rem;
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-soft);
  border: 2px solid rgba(0,0,0,0.03);
  backdrop-filter: blur(14px);
  margin-bottom: 1.8rem;
}

/* Card hover */
.form-card:hover,
.table-card:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-softer);
}

.form-section-title {
  font-size: 1.08rem;
  font-weight: 700;
  color: var(--text-strong);
  margin-bottom: 1.5rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.form-section-title span {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  border-radius: 999px;
  background: rgba(0, 0, 0, 0.06);
  font-size: 0.85rem;
}

/* Form grid */
.form-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 1.25rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-label {
  font-weight: 500;
  color: var(--text-main);
  font-size: 0.875rem;
}

/* Inputs – glassy */
.form-input {
  padding: 0.75rem 1rem;
  border-radius: 14px;
 border: 2px solid rgba(0, 0, 0, 0.06);
  font-size: 0.9rem;
  background: rgba(255, 255, 255, 0.95);
  color: var(--text-main);
  transition:
    border-color 180ms ease,
    box-shadow 180ms ease,
    background 180ms ease,
    transform 180ms ease;
}

/* Focus ring with neutral glow */
.form-input:focus {
  outline: none;
  border-color: rgba(0, 0, 0, 0.24);
  background: #ffffff;
  box-shadow:
    0 0 0 1px rgba(255, 255, 255, 0.9),
    0 0 0 4px rgba(0, 0, 0, 0.08),
    0 10px 30px -14px rgba(0, 0, 0, 0.3);
  transform: translateY(-1px);
}

/* Checkbox group – pill */
.checkbox-group {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.85rem 1rem;
  background: rgba(255, 255, 255, 0.92);
  border-radius: 999px;
  margin-top: 1.4rem;
  border: 1px solid var(--glass-border-soft);
}

.checkbox-input {
  width: 1.1rem;
  height: 1.1rem;
  cursor: pointer;
}

.checkbox-label {
  font-weight: 500;
  color: var(--text-main);
  cursor: pointer;
  font-size: 0.9rem;
}

/* ===========
   4. BUTTONS
   =========== */

button {
  font-family: inherit;
}

.submit-btn {
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
  cursor: pointer;
  transition:
    transform 220ms ease,
    box-shadow 220ms ease,
    opacity 160ms ease;
  font-size: 0.95rem;
  margin-top: 0.9rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.3rem;
  box-shadow:
    0 0 0 1px rgba(255, 255, 255, 0.7),
    0 12px 30px -10px rgba(0, 0, 0, 0.35);
  overflow: hidden;
}

/* Glow halo */
.submit-btn::before {
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

/* Hover: lift + glow */
.submit-btn:hover:not(:disabled) {
  transform: translateY(-5px);
  box-shadow:
    0 0 0 1px rgba(255, 255, 255, 0.9),
    0 16px 45px -12px rgba(0, 0, 0, 0.45);
}

.submit-btn:hover:not(:disabled)::before {
  opacity: 0.65;
  transform: translate3d(8px, -8px, 0);
}

/* Disabled */
.submit-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
  box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.12);
}

/* Action buttons in table – simple pills */
.action-btn {
  padding: 0.5rem 1.1rem;
  border-radius: 999px;
  border: none;
  font-weight: 500;
  cursor: pointer;
  transition:
    transform 200ms ease,
    box-shadow 200ms ease,
    opacity 160ms ease,
    background 160ms ease;
  font-size: 0.8rem;
  color: var(--text-strong);
  background: rgba(255, 255, 255, 0.96);
  border: 1px solid var(--glass-border-soft);
}

/* Suspend / activate use allowed backgrounds */
.action-btn.suspend {
  background: #ffebee;
}

.action-btn.activate {
  background: #e8f5e9;
}

.action-btn:hover {
  transform: translateY(-3px);
  box-shadow: 0 10px 28px -14px rgba(0, 0, 0, 0.35);
}

/* ===========
   5. TABLE
   =========== */

.table-card {
  overflow: hidden;
}

.table-header {
  padding: 1.4rem 2rem 1.2rem;
  border-bottom: 1px solid var(--glass-border-soft);
}

.table-title {
  font-size: 1.02rem;
  font-weight: 700;
  color: var(--text-strong);
}

.hospitals-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.9rem;
}

.hospitals-table th,
.hospitals-table td {
  padding: 1rem 1.5rem;
}

.hospitals-table th {
  background: rgba(255, 255, 255, 0.96);
  text-align: left;
  font-weight: 600;
  color: var(--text-main);
  font-size: 0.8rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.hospitals-table td {
  border-top: 1px solid rgba(255, 255, 255, 0.8);
  color: var(--text-main);
}

.hospitals-table tbody tr {
  background: rgba(255, 255, 255, 0.96);
}

.hospitals-table tbody tr:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 34px -18px rgba(0, 0, 0, 0.35);
}

/* Status badge */
.status-badge {
  display: inline-block;
  padding: 0.35rem 0.9rem;
  border-radius: 999px;
  font-size: 0.75rem;
  font-weight: 600;
}

/* Active / suspended using allowed colors */
.status-badge.active {
  background: #e8f5e9;
  color: var(--text-main);
}

.status-badge.suspended {
  background: #ffebee;
  color: var(--text-main);
}

/* Empty state */
.empty-state {
  padding: 4rem 1.25rem;
  text-align: center;
  color: var(--text-muted);
}

.empty-icon {
  font-size: 3rem;
  margin-bottom: 0.75rem;
}

/* ===========
   6. MESSAGES / ALERTS
   =========== */

.message {
  padding: 1rem;
  border-radius: var(--radius-md);
  margin-top: 1rem;
  font-weight: 500;
  font-size: 0.9rem;
}

/* Use allowed backgrounds for success/error */
.message.success {
  background: #e8f5e9;
  color: var(--text-main);
}

.message.error {
  background: #ffebee;
  color: var(--text-main);
}

/* ===========
   7. RESPONSIVE
   =========== */

@media (max-width: 639px) {
  .hospitals-container {
    padding: 2rem 1rem 3rem;
  }

  .hospitals-container::before {
    inset: 16px 0 0;
  }

  .form-card,
  .table-card {
    padding: 1.6rem 1.3rem;
  }

  .hospitals-table,
  .hospitals-table thead,
  .hospitals-table tbody,
  .hospitals-table th,
  .hospitals-table td,
  .hospitals-table tr {
    display: block;
  }

  .hospitals-table thead {
    display: none;
  }

  .hospitals-table tr {
    margin-bottom: 1rem;
    border-radius: var(--radius-md);
    overflow: hidden;
    background: #ffffff;
    box-shadow: 0 10px 30px -16px rgba(0, 0, 0, 0.25);
  }

  .hospitals-table td {
    border: none;
    border-top: 1px solid rgba(255, 255, 255, 0.8);
    position: relative;
    padding: 0.75rem 1rem 0.75rem 7rem;
  }

  .hospitals-table td:first-child {
    border-top: none;
  }

  .hospitals-table td::before {
    content: attr(data-label);
    position: absolute;
    left: 1rem;
    top: 50%;
    transform: translateY(-50%);
    font-weight: 600;
    font-size: 0.75rem;
    text-transform: uppercase;
    color: var(--text-muted);
  }
}

@media (min-width: 640px) and (max-width: 1023px) {
  .hospitals-container {
    padding-inline: 1.5rem;
  }

  .form-card,
  .table-card {
    padding-inline: 1.75rem;
  }
}

      `}</style>
      
      <div className="hospitals-page">
        <AdminNav />
        
        <div className="hospitals-container" style={{ marginTop: "40px" }}>
          <div className="page-header">
            <h1 className="page-title">Hospital Management</h1>
            <p className="page-subtitle">Create and manage hospital accounts with owner credentials</p>
          </div>
          
          <div className="form-card">
            <h3 className="form-section-title">
              <span>➕</span> Create New Hospital
            </h3>
            
            <form onSubmit={create}>
              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">Hospital Name *</label>
                  <input 
                    className="form-input" 
                    placeholder="Enter hospital name" 
                    value={form.name} 
                    onChange={e=>setForm({...form, name:e.target.value})}
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label className="form-label">Owner First Name *</label>
                  <input 
                    className="form-input" 
                    placeholder="First name" 
                    value={form.ownerFirstName} 
                    onChange={e=>setForm({...form, ownerFirstName:e.target.value})}
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label className="form-label">Owner Last Name *</label>
                  <input 
                    className="form-input" 
                    placeholder="Last name" 
                    value={form.ownerLastName} 
                    onChange={e=>setForm({...form, ownerLastName:e.target.value})}
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label className="form-label">Owner Phone *</label>
                  <input 
                    className="form-input" 
                    placeholder="Phone number" 
                    value={form.ownerPhone} 
                    onChange={e=>setForm({...form, ownerPhone:e.target.value})}
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label className="form-label">Owner Email *</label>
                  <input 
                    type="email"
                    className="form-input" 
                    placeholder="Email address" 
                    value={form.ownerEmail} 
                    onChange={e=>setForm({...form, ownerEmail:e.target.value})}
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label className="form-label">Temporary Password</label>
                  <input 
                    type="text"
                    className="form-input" 
                    placeholder="Default: Owner@12345" 
                    value={form.tempPassword} 
                    onChange={e=>setForm({...form, tempPassword:e.target.value})}
                  />
                </div>
                
                <div className="form-group">
                  <label className="form-label">City *</label>
                  <input 
                    className="form-input" 
                    placeholder="City" 
                    value={form.city} 
                    onChange={e=>setForm({...form, city:e.target.value})}
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label className="form-label">State *</label>
                  <input 
                    className="form-input" 
                    placeholder="State" 
                    value={form.state} 
                    onChange={e=>setForm({...form, state:e.target.value})}
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label className="form-label">Pincode *</label>
                  <input 
                    className="form-input" 
                    placeholder="Pincode" 
                    value={form.pincode} 
                    onChange={e=>setForm({...form, pincode:e.target.value})}
                    required
                  />
                </div>
              </div>
              
              <div className="checkbox-group" style={{marginTop: 20}}>
                <input 
                  type="checkbox" 
                  id="payment-required"
                  className="checkbox-input"
                  checked={form.paymentRequiredBeforeConsult}
                  onChange={e=>setForm({...form, paymentRequiredBeforeConsult:e.target.checked})}
                />
                <label htmlFor="payment-required" className="checkbox-label">
                  💳 Require payment before consultation
                </label>
              </div>
              
              <button type="submit" className="submit-btn" disabled={loading}>
                {loading ? 'Creating...' : '✓ Create Hospital'}
              </button>
              
              {msg && (
                <div className={`message ${msg.includes('✅') ? 'success' : 'error'}`}>
                  {msg}
                </div>
              )}
            </form>
          </div>
          
          <div className="table-card">
            <div className="table-header">
              <h3 className="table-title">All Hospitals</h3>
            </div>
            
            <table className="hospitals-table">
              <thead>
                <tr>
                  <th>Hospital Name</th>
                  <th>Owner Email</th>
                  <th>Status</th>
                  <th>Created</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {list.map(h => (
                  <tr key={h._id}>
                    <td style={{fontWeight: 600}}>{h.name}</td>
                    <td>{h.ownerEmail}</td>
                    <td>
                      <span className={`status-badge ${h.status}`}>
                        {h.status === 'active' ? '✓ Active' : '⏸ Suspended'}
                      </span>
                    </td>
                    <td>{new Date(h.createdAt).toLocaleDateString()}</td>
                    <td>
                      {h.status === 'active' ? (
                        <button 
                          onClick={()=>toggleStatus(h._id, 'suspended')} 
                          className="action-btn suspend"
                        >
                          Suspend
                        </button>
                      ) : (
                        <button 
                          onClick={()=>toggleStatus(h._id, 'active')} 
                          className="action-btn activate"
                        >
                          Activate
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
                {list.length === 0 && (
                  <tr>
                    <td colSpan="5">
                      <div className="empty-state">
                        <div className="empty-icon">🏥</div>
                        <div>No hospitals registered yet</div>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
}

