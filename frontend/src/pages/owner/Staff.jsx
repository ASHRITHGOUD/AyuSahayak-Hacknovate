import { useEffect, useState } from 'react';
import OwnerNav from '../../components/OwnerNav';
import http from '../../api/http';

export default function Staff() {
  const [list, setList] = useState([]);
  const [form, setForm] = useState({
    role: 'nurse',
    email: '',
    tempPassword: 'Pass@12345',
    firstName: '',
    lastName: '',
    phone: '',
    qualification: '',
    specialization: '',
    regNo: ''
  });
  const [signatureFile, setSignatureFile] = useState(null);
  const [signaturePreview, setSignaturePreview] = useState('');
  const [msg, setMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const load = async () => {
    try {
      const { data } = await http.get('/hospital/users');
      setList(data);
    } catch (e) { setList([]); }
  };
  
  useEffect(() => { load(); }, []);

  const createUser = async (e) => {
    e.preventDefault();
    setMsg('');
    setLoading(true);
    try {
      if (form.role === 'doctor') {
        const fd = new FormData();
        Object.entries(form).forEach(([k, v]) => fd.append(k, v));
        if (signatureFile) fd.append('signature', signatureFile);
        await http.post('/hospital/users', fd);
      } else {
        await http.post('/hospital/users', form);
      }
      setMsg('✅ User created successfully');
      setForm({
        role: 'nurse', email: '', tempPassword: 'Pass@12345', firstName: '',
        lastName: '', phone: '', qualification: '', specialization: '', regNo: ''
      });
      setSignatureFile(null);
      setSignaturePreview('');
      load();
    } catch (e) {
      setMsg('❌ ' + (e.response?.data?.message || 'Failed to create user'));
    } finally {
      setLoading(false);
    }
  };

  const toggle = async (id, isActive) => {
    try {
      await http.patch(`/hospital/users/${id}/status`, { isActive });
      load();
    } catch {}
  };

  const remove = async (id) => {
    if (!window.confirm('Delete this account? This cannot be undone.')) return;
    try {
      await http.delete(`/hospital/users/${id}`);
      load();
    } catch (e) {
      alert(e.response?.data?.message || 'Delete failed');
    }
  };

  const onSignatureChange = (e) => {
    const f = e.target.files?.[0] || null;
    setSignatureFile(f);
    if (f) {
      const url = URL.createObjectURL(f);
      setSignaturePreview(url);
    } else {
      setSignaturePreview('');
    }
  };

  return (
    <>
      <style>{`
        /* =========================================
   OWNER – STAFF MANAGEMENT (GLASS)
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

.staff-page {
  min-height: 100vh;
  background:
    radial-gradient(circle at top left, rgba(255, 255, 255, 0.96), #ffffff 65%),
    #ffffff;
}

.staff-container {
  max-width: 1400px;
  margin: 0 auto;
  padding: 48px 24px 64px;
  position: relative;
}

/* Glass workspace sheet */
.staff-container::before {
  content: "";
  position: absolute;
  inset: 32px -6px 0;
  margin: 0 auto;
  max-width: 1400px;
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

/* =========================================
   HEADER
   ========================================= */

.page-header {
  margin-bottom: 32px;
}

.page-title {
  font-size: clamp(2.1rem, 3.2vw, 2.5rem);
  font-weight: 850;
  color: var(--text-strong);
  margin-bottom: 6px;
  letter-spacing: -0.035em;
}

.page-subtitle {
  color: var(--text-main);
  font-size: 0.96rem;
  margin: 0;
}

/* =========================================
   FORM CARD – CREATE STAFF
   ========================================= */

.form-card {
  background: var(--glass-bg-strong);
  padding: 24px 24px 26px;
  border-radius: 22px;
  box-shadow: var(--shadow-soft);
  border: 1.5px solid var(--glass-border-strong);
  backdrop-filter: blur(16px);
  margin-bottom: 28px;
}

.form-section-title {
  font-size: 1.05rem;
  font-weight: 740;
  color: var(--text-strong);
  margin-bottom: 18px;
}

/* Grid */
.form-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 18px;
}

/* Form group */
.form-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.form-label {
  font-weight: 550;
  color: var(--text-main);
  font-size: 0.86rem;
}

/* Inputs / selects */
.form-input,
.form-select {
  padding: 10px 12px;
  border: 1px solid var(--glass-border-strong);
  border-radius: 12px;
  font-size: 0.9rem;
  background: #ffffff;
  transition:
    border-color 180ms ease,
    box-shadow 180ms ease,
    background 180ms ease,
    transform 180ms ease;
  font-family: system-ui, -apple-system, BlinkMacSystemFont, "Inter", sans-serif;
  color: var(--text-main);
}

.form-input:focus,
.form-select:focus {
  outline: none;
  border-color: rgba(0, 0, 0, 0.24);
  box-shadow:
    0 0 0 1px rgba(255, 255, 255, 0.9),
    0 0 0 4px rgba(0, 0, 0, 0.08),
    0 10px 30px -14px rgba(0, 0, 0, 0.3);
  transform: translateY(-1px);
}

/* Signature upload */
.signature-upload {
  grid-column: 1 / -1;
  padding: 16px 14px;
  border-radius: 16px;
  border: 1.5px dashed var(--glass-border-strong);
  background: var(--glass-bg-soft);
  text-align: center;
}

.signature-preview {
  margin-top: 12px;
  display: inline-block;
}

.signature-preview img {
  max-height: 80px;
  border: 2px solid var(--glass-border-soft);
  border-radius: 10px;
  background: #ffffff;
}

/* Submit button (primary gradient) */
.submit-btn {
  position: relative;
  padding: 0.8rem 2rem;
  margin-top: 14px;
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
  gap: 6px;
  box-shadow:
    0 0 0 1px rgba(255, 255, 255, 0.7),
    0 14px 36px -12px rgba(0, 0, 0, 0.4);
  overflow: hidden;
}

.submit-btn::before {
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

.submit-btn:hover:not(:disabled) {
  transform: translateY(-4px);
  box-shadow:
    0 0 0 1px rgba(255, 255, 255, 0.9),
    0 20px 50px -18px rgba(0, 0, 0, 0.55);
}

.submit-btn:hover:not(:disabled)::before {
  opacity: 0.7;
  transform: translate3d(9px, -9px, 0);
}

.submit-btn:disabled {
  opacity: 0.55;
  cursor: not-allowed;
  transform: none;
  box-shadow:
    0 0 0 1px rgba(255, 255, 255, 0.7),
    0 8px 22px -10px rgba(0, 0, 0, 0.25);
}

/* =========================================
   MESSAGES
   ========================================= */

.message {
  padding: 10px 12px;
  border-radius: 12px;
  margin-top: 12px;
  font-size: 0.9rem;
}

.message.success {
  background: #e8f5e9;
  color: var(--text-main);
  border: 1px solid rgba(0, 0, 0, 0.08);
}

.message.error {
  background: #ffebee;
  color: var(--text-main);
  border: 1px solid rgba(0, 0, 0, 0.08);
}

/* =========================================
   TABLE CARD
   ========================================= */

.table-card {
  background: var(--glass-bg-strong);
  border-radius: 22px;
  box-shadow: var(--shadow-soft);
  border: 1.5px solid var(--glass-border-strong);
  overflow: hidden;
  backdrop-filter: blur(16px);
}

.table-header {
  padding: 18px 22px;
  border-bottom: 1px solid var(--glass-border-soft);
}

.table-title {
  font-size: 1.02rem;
  font-weight: 740;
  color: var(--text-strong);
  margin: 0;
}

/* Table */
.staff-table {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
}

.staff-table th {
  background: #1565c0;
  padding: 12px 18px;
  text-align: left;
  font-weight: 700;
  font-size: 0.75rem;
  text-transform: uppercase;
  color: #ffffff;
  letter-spacing: 0.12em;
}

.staff-table td {
  padding: 14px 18px;
  border-top: 1px solid var(--glass-border-soft);
  font-size: 0.9rem;
  color: var(--text-main);
}

.staff-table tbody tr:hover {
  background: rgba(255, 255, 255, 0.9);
}

/* Role badge */
.role-badge {
  display: inline-block;
  padding: 6px 12px;
  border-radius: 999px;
  font-size: 0.8rem;
  font-weight: 600;
  background: #ffffff;
  border: 1px solid var(--glass-border-soft);
  color: var(--text-main);
}

/* Status badge */
.status-badge {
  display: inline-block;
  padding: 6px 12px;
  border-radius: 999px;
  font-size: 0.8rem;
  font-weight: 600;
}

.status-badge.active {
  background: #e8f5e9;
  color: var(--text-main);
}

.status-badge.suspended {
  background: #ffebee;
  color: var(--text-main);
}

/* Action buttons */
.action-btn-group {
  display: flex;
  gap: 6px;
}

.action-btn {
  padding: 7px 14px;
  border-radius: 999px;
  border: none;
  font-weight: 600;
  cursor: pointer;
  font-size: 0.8rem;
  transition:
    transform 180ms ease,
    box-shadow 180ms ease,
    background 160ms ease,
    color 160ms ease,
    border-color 160ms ease;
}

/* All action buttons use neutral glass; text indicates intent */
.action-btn.suspend,
.action-btn.activate,
.action-btn.delete {
  background: #ffffff;
  color: var(--text-main);
  border: 1px solid var(--glass-border-soft);
}

.action-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 10px 26px -16px rgba(0, 0, 0, 0.4);
  border-color: rgba(0, 0, 0, 0.18);
}

/* =========================================
   EMPTY STATE
   ========================================= */

.empty-state {
  padding: 60px 20px;
  text-align: center;
  color: var(--text-muted);
}

/* =========================================
   RESPONSIVE
   ========================================= */

@media (max-width: 1024px) {
  .staff-container {
    padding: 40px 18px 56px;
  }

  .staff-container::before {
    inset: 24px -4px 0;
  }
}

@media (max-width: 768px) {
  .staff-container {
    padding: 32px 16px 48px;
  }

  .staff-container::before {
    inset: 20px -4px 0;
  }

  .staff-table th,
  .staff-table td {
    padding: 10px 12px;
  }

  .action-btn-group {
    flex-direction: column;
  }
}

      `}</style>
      
      <div className="staff-page">
        <OwnerNav />
        
        <div className="staff-container" style={{marginTop: "50px"}} >
          <div className="page-header" >
            <h1 className="page-title" >Staff Management</h1>
            <p className="page-subtitle">Create and manage nurse and doctor accounts</p>
          </div>
          
          <div className="form-card">
            <h3 className="form-section-title"> Create New Staff Member</h3>
            
            <form onSubmit={createUser}>
              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">Role *</label>
                  <select className="form-select" value={form.role} onChange={e=>setForm({...form, role:e.target.value})}>
                    <option value="nurse">👩‍⚕️ Nurse</option>
                    <option value="doctor">👨‍⚕️ Doctor</option>
                  </select>
                </div>
                
                <div className="form-group">
                  <label className="form-label">Email *</label>
                  <input className="form-input" placeholder="Email address" value={form.email} onChange={e=>setForm({...form, email:e.target.value})} required/>
                </div>
                
                <div className="form-group">
                  <label className="form-label">Temporary Password</label>
                  <input className="form-input" placeholder="Default: Pass@12345" value={form.tempPassword} onChange={e=>setForm({...form, tempPassword:e.target.value})}/>
                </div>
                
                <div className="form-group">
                  <label className="form-label">First Name *</label>
                  <input className="form-input" placeholder="First name" value={form.firstName} onChange={e=>setForm({...form, firstName:e.target.value})} required/>
                </div>
                
                <div className="form-group">
                  <label className="form-label">Last Name *</label>
                  <input className="form-input" placeholder="Last name" value={form.lastName} onChange={e=>setForm({...form, lastName:e.target.value})} required/>
                </div>
                
                <div className="form-group">
                  <label className="form-label">Phone *</label>
                  <input className="form-input" placeholder="Phone number" value={form.phone} onChange={e=>setForm({...form, phone:e.target.value})} required/>
                </div>
                
                {form.role === 'doctor' && (
                  <>
                    <div className="form-group">
                      <label className="form-label">Qualification</label>
                      <input className="form-input" placeholder="MBBS, MD, etc." value={form.qualification} onChange={e=>setForm({...form, qualification:e.target.value})}/>
                    </div>
                    
                    <div className="form-group">
                      <label className="form-label">Specialization</label>
                      <input className="form-input" placeholder="Dermatology, etc." value={form.specialization} onChange={e=>setForm({...form, specialization:e.target.value})}/>
                    </div>
                    
                    <div className="form-group">
                      <label className="form-label">Registration No</label>
                      <input className="form-input" placeholder="Medical registration number" value={form.regNo} onChange={e=>setForm({...form, regNo:e.target.value})}/>
                    </div>
                    
                    <div className="signature-upload">
                      <label style={{fontWeight: 600, display: 'block', marginBottom: 8}}>📝 Doctor Signature (JPG)</label>
                      <input type="file" accept="image/jpeg" onChange={onSignatureChange} />
                      {signaturePreview && (
                        <div className="signature-preview">
                          <img src={signaturePreview} alt="signature preview" />
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
              
              <button type="submit" className="submit-btn" disabled={loading}>
                {loading ? 'Creating...' : 'Create'}
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
              <h3 className="table-title">All Staff Members</h3>
            </div>
            
            <table className="staff-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Role</th>
                  <th>Email</th>
                  <th>Status</th>
                  <th>Created</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {list.map(u => (
                  <tr key={u.id}>
                    <td style={{fontWeight: 600}}>{u.name}</td>
                    <td>
                      <span className={`role-badge ${u.role}`}>
                        {u.role === 'nurse' ? '👩‍⚕️ Nurse' : '👨‍⚕️ Doctor'}
                      </span>
                    </td>
                    <td>{u.email}</td>
                    <td>
                      <span className={`status-badge ${u.isActive ? 'active' : 'suspended'}`}>
                        {u.isActive ? '✓ Active' : '⏸ Suspended'}
                      </span>
                    </td>
                    <td>{new Date(u.createdAt).toLocaleDateString()}</td>
                    <td>
                      <div className="action-btn-group">
                        {u.isActive ? (
                          <button onClick={()=>toggle(u.id, false)} className="action-btn suspend">Suspend</button>
                        ) : (
                          <button onClick={()=>toggle(u.id, true)} className="action-btn activate">Activate</button>
                        )}
                        <button onClick={()=>remove(u.id)} className="action-btn delete">Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
                {list.length === 0 && (
                  <tr>
                    <td colSpan="6">
                      <div className="empty-state">
                        <div style={{fontSize: 64, marginBottom: 16}}>👥</div>
                        <div>No staff members yet</div>
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

