import { useEffect, useState } from 'react';
import NurseNav from '../../components/NurseNav';
import http from '../../api/http';

const toast = (msg) => {
  const d = document.createElement('div');
  d.textContent = msg;
  d.className = 'ay-toast';
  document.body.appendChild(d);
  setTimeout(() => d.remove(), 3000);
};


export default function NurseConsults() {
  const [consults, setConsults] = useState([]);
  const [form, setForm] = useState({ patientRef:'', chiefComplaint:'', conditionType:'other', priority:'normal' });
  const [msg, setMsg] = useState('');
  const [pay, setPay] = useState({ consultationId:'', amount:'200' });
  const [orderInfo, setOrderInfo] = useState(null);
  const [prRef, setPrRef] = useState('');

  const load = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        toast('Session expired. Please log in again.');
        window.location.href = '/login';
        return;
      }
      const { data } = await http.get('/nurse/consultations');
      setConsults(data);
    } catch {
      setConsults([]);
    }
  };

  useEffect(()=>{ load(); }, []);
  useEffect(() => {
    if (!window.Razorpay) {
      const s = document.createElement('script');
      s.src = 'https://checkout.razorpay.com/v1/checkout.js';
      s.async = true;
      document.body.appendChild(s);
    }
  }, []);

  const createConsult = async (e) => {
    e.preventDefault();
    setMsg('');
    try {
      const { data } = await http.post('/nurse/consultations', form);
      setMsg(data.paymentRequired ? 'Consultation created. Payment required ⚠' : 'Consultation created successfully ✓');
      setForm({ patientRef:'', chiefComplaint:'', conditionType:'other', priority:'normal' });
      load();
    } catch (e) {
      setMsg(e.response?.data?.message || 'Failed');
    }
  };

 const createOrder = async () => {
  const cid = (pay.consultationId || '').trim();
  if (!cid || !pay.amount) { alert('Enter consultationId and amount'); return; }
  try {
    const { data } = await http.post('/payments/orders', {
      consultationRef: cid,
      amountInRupees: pay.amount
    });
    setOrderInfo({ ...data, consultationRef: cid }); // keep ref for optimistic updates
    toast('Payment order created');
  } catch (e) {
    alert(e.response?.data?.message || 'Order creation failed');
  }
};





const openRazorpay = () => {
  if (!orderInfo) return;
  if (!window.Razorpay) { alert('Razorpay not loaded yet'); return; }

  const options = {
    key: process.env.REACT_APP_RAZORPAY_KEY_ID, // from .env
    amount: orderInfo.amount,
    currency: orderInfo.currency,
    name: 'AyuSahayak',
    description: 'Consultation Payment',
    order_id: orderInfo.orderId,
    handler: async (response) => {
      try {
        await http.post('/payments/verify', {
          razorpay_order_id: response.razorpay_order_id,
          razorpay_payment_id: response.razorpay_payment_id,
          razorpay_signature: response.razorpay_signature
        });
        toast('Payment successful ✓');
        // optimistic flip for the corresponding row
        setConsults(prev => prev.map(x =>
          x.consultationId === orderInfo.consultationRef ? { ...x, payReady: true } : x
        ));
        setOrderInfo(null);
        setPay({ consultationId:'', amount:'200' });
        load();
      } catch (e) {
        alert(e.response?.data?.message || 'Payment verification failed');
      }
    },
    theme: { color: '#00897B' }
  };
  const rzp = new window.Razorpay(options);
  rzp.open();
};
const initiateCash = async (consultationRef, amount) => {
  try {
    const { data } = await http.post('/payments/cash/initiate', {
      consultationRef,
      amountInRupees: Number(amount || 200)
    });
    return data.paymentId;
  } catch (e) {
    alert(e.response?.data?.message || 'Cash initiation failed');
    return null;
  }
};

const verifyCash = async (paymentId, consultationRef) => {
  try {
    await http.post('/payments/cash/verify', { paymentId });
    toast('Cash payment verified ✓');

    setConsults(prev => prev.map(x =>
      (x.consultationId === consultationRef) ? { ...x, payReady: true } : x
    ));
  } catch (e) {
    alert(e.response?.data?.message || 'Cash verification failed');
  }
};


  const viewPrescription = (consultationIdOrRef) => {
    setPrRef(consultationIdOrRef);
    window.location.href = `/nurse/prescription?ref=${encodeURIComponent(consultationIdOrRef)}`;
  };

const enableVideo = async (id) => {
  try {
    await http.post(`/nurse/consultations/${id}/video/start`);
    toast('Video enabled ✓');
    load();
  } catch (e) {
    alert(e.response?.data?.message || 'Failed');
  }
};
const canViewRx = (c) => c.status === 'completed';
// Doctor accepted => not 'in_queue'; also block when 'declined'
const canVideo = (c) => c.status !== 'in_queue' && c.status !== 'declined';


const onRxClick = (c) => {
  if (!canViewRx(c)) { toast('Prescription visible after completion'); return; }
  viewPrescription(c.consultationId || c.id);
};

const onVideoClick = async (c) => {
  if (!canVideo(c)) return;
  // Optional: start the video room first, then navigate
  try {
    await enableVideo(c.id);
  } catch {}
  window.location.href = `/video?ref=${encodeURIComponent(c.consultationId || c.id)}`;
};



  return (
    <div className="consults-page">
      <style>{`
        /* =========================================
   NURSE CONSULTS – STRICT PALETTE GLASS UI
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
   PAGE LAYOUT
   ========================================= */

.consults-page {
  min-height: 100vh;
  background:
    radial-gradient(circle at top left, rgba(255, 255, 255, 0.92), #ffffff 60%),
    #ffffff;
}

.consults-container {
  padding: 24px;
  max-width: 1400px;
  margin: 0 auto 56px;
  position: relative;
  animation: fadeInUp 0.5s ease-out;
}

/* Glass workspace plate */
.consults-container::before {
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

/* Animations */
@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(20px); }
  to   { opacity: 1; transform: translateY(0); }
}

@keyframes slideIn {
  from { opacity: 0; transform: translateX(50px); }
  to   { opacity: 1; transform: translateX(0); }
}

/* =========================================
   TOAST
   ========================================= */

.ay-toast {
  position: fixed;
  bottom: 24px;
  right: 24px;
  padding: 14px 18px;
  max-width: 320px;
  background: rgba(0, 0, 0, 0.84);
  color: #ffffff;
  border-radius: 14px;
  box-shadow: 0 10px 30px -12px rgba(0, 0, 0, 0.4);
  z-index: 9999;
  font-weight: 500;
  font-size: 0.9rem;
  backdrop-filter: blur(10px);
  animation: slideIn 0.3s ease-out;
}

/* =========================================
   HEADER
   ========================================= */

.page-header {
  margin-bottom: 28px;
}

.page-header h1 {
  font-size: clamp(2rem, 3vw, 2.4rem);
  font-weight: 800;
  color: var(--text-strong);
  margin: 0 0 8px 0;
  letter-spacing: -0.03em;
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.page-header p {
  color: var(--text-muted);
  font-size: 0.95rem;
  margin: 0;
}

.consults-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
  margin-bottom: 32px;
}

/* Shared card style */
.card {
  background: var(--glass-bg-strong);
  border-radius: 20px;
  padding: 26px 24px;
  box-shadow: var(--shadow-soft);
  border: 1.5px solid rgba(0,0,0,0.03);
  backdrop-filter: blur(14px);
  transition:
    transform 220ms ease,
    box-shadow 220ms ease,
    border-color 220ms ease;
}

.card:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-softer);
  border-color: rgba(0, 0, 0, 0.12);
}

.card h2 {
  font-size: 1.06rem;
  font-weight: 700;
  color: var(--text-strong);
  margin: 0 0 20px 0;
  display: flex;
  align-items: center;
  gap: 8px;
}

/* =========================================
   FORM ELEMENTS
   ========================================= */

.form-group {
  margin-bottom: 18px;
}

.form-group label {
  display: block;
  font-size: 0.85rem;
  font-weight: 500;
  color: var(--text-main);
  margin-bottom: 6px;
}

.form-group input,
.form-group select,
.form-group textarea {
  width: 90%;
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

.form-group textarea {
  resize: vertical;
  min-height: 96px;

}

/* Focus ring – neutral glow */
.form-group input:focus,
.form-group select:focus,
.form-group textarea:focus {
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
   BUTTONS
   ========================================= */

.btn {
  padding: 0.75rem 1.6rem;
  border-radius: 999px;
  font-weight: 600;
  font-size: 0.9rem;
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

/* Secondary (online payment create) – neutral filled */
.btn-secondary {
  background: #0d47a1 ;
  color: #ffffff;
  box-shadow: 0 12px 30px -12px #0d48a1de;
}

.btn-secondary:hover {
  transform: translateY(-3px);
  box-shadow: 0 16px 40px -14px rgba(0, 0, 0, 0.6);
}

/* Outline (cash) */
.btn-outline {
  background: rgba(255, 255, 255, 0.98);
  border: 1px solid var(--glass-border-soft);
  color: var(--text-main);
}

.btn-outline:hover {
  background: #ffffff;
  border-color: rgba(0, 0, 0, 0.16);
  transform: translateY(-2px);
  box-shadow: 0 10px 26px -14px rgba(0, 0, 0, 0.3);
}

/* Small buttons */
.btn-sm {
  padding: 6px 12px;
  font-size: 0.8rem;
  border-radius: 999px;
}

/* Disabled styling via inline opacity is already in JSX */

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

.alert-success {
  background: #e8f5e9;
  color: var(--text-main);
  border: 1px solid rgba(0, 0, 0, 0.08);
}

.alert-warning {
  background: #ffebee; /* reuse error palette for warning, still soft */
  color: var(--text-main);
  border: 1px solid rgba(0, 0, 0, 0.08);
}

.alert-error {
  background: #ffebee;
  color: var(--text-main);
  border: 1px solid rgba(0, 0, 0, 0.08);
}

/* =========================================
   TABLE CARD / CONSULTS TABLE
   ========================================= */

.table-card {
  background: var(--glass-bg-strong);
  border-radius: 20px;
  padding: 26px 24px;
  box-shadow: var(--shadow-soft);
  border: 1.5px solid var(--glass-border-strong);
  backdrop-filter: blur(14px);
}

.table-card:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-softer);
  border-color: rgba(0, 0, 0, 0.12);
}

.table-card h2 {
  font-size: 1.06rem;
  font-weight: 700;
  color: var(--text-strong);
  margin: 0 0 18px 0;
}

/* Table structure */
.consults-table {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
}

.consults-table thead th {
  background: rgba(255, 255, 255, 0.96);
  padding: 14px 16px;
  text-align: left;
  font-weight: 600;
  font-size: 0.82rem;
  color: var(--text-main);
  border-bottom: 2px solid rgba(0, 0, 0, 0.06);
}

.consults-table tbody td {
  padding: 14px 16px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
  font-size: 0.9rem;
  color: var(--text-main);
}

.consults-table tbody tr {
  background: rgba(255, 255, 255, 0.98);
  transition:
    background 0.18s ease,
    box-shadow 0.18s ease,
    transform 0.18s ease;
}

.consults-table tbody tr:hover {
  background: #ffffff;
  transform: translateY(-2px);
  box-shadow: 0 10px 34px -18px rgba(0, 0, 0, 0.3);
}

/* =========================================
   BADGES
   ========================================= */

.badge {
  display: inline-flex;
  align-items: center;
  padding: 5px 10px;
  border-radius: 999px;
  font-size: 0.8rem;
  font-weight: 500;
  gap: 4px;
}

/* Status badges – use success/error backgrounds only */
.badge-queue {
  background: #ffebee;
  color: var(--text-main);
}

.badge-progress {
  background: #ffebee;
  color: var(--text-main);
}

.badge-completed {
  background: #e8f5e9;
  color: var(--text-main);
}

/* Payment badges */
.badge-paid {
  background: #e8f5e9;
  color: var(--text-main);
}

.badge-pending {
  background: #ffebee;
  color: var(--text-main);
}

/* =========================================
   ACTION BUTTONS (RX / VIDEO)
   ========================================= */

.action-buttons {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

/* btn + btn-outline + btn-sm already define look */

/* =========================================
   EMPTY STATE
   ========================================= */

.empty-state {
  text-align: center;
  padding: 60px 20px;
  color: var(--text-muted);
}

.empty-icon {
  font-size: 3.5rem;
  margin-bottom: 14px;
  opacity: 0.55;
}

@media (max-width: 1024px) {
  .consults-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .consults-container {
    padding: 20px 16px 40px;
  }

  .consults-container::before {
    inset: 16px 0 0;
  }

  .consults-table {
    display: block;
    overflow-x: auto;
  }

  .btn {
    white-space: nowrap;
  }
}

      `}</style>
      
      <NurseNav />
      <div className="consults-container" style={{ marginTop: "80px" }}>
        <div className="page-header">
          <h1>🩺 Consultations</h1>
          <p>Manage patient consultations and payments</p>
        </div>

        <div className="consults-grid">
          <div className="card">
            <h2>📝 Create Consultation</h2>
            {msg && (
              <div className={`alert ${msg.includes('✓') || msg.includes('success') ? 'alert-success' : msg.includes('⚠') ? 'alert-warning' : 'alert-error'}`}>
                {msg}
              </div>
            )}
            <form onSubmit={createConsult}>
              <div className="form-group">
                <label>Patient ID / Reference *</label>
                <input 
                  placeholder="PAT000001 or MongoDB _id" 
                  value={form.patientRef} 
                  onChange={e=>setForm({...form, patientRef:e.target.value})} 
                  required
                />
              </div>
              <div className="form-group">
                <label>Chief Complaint</label>
                <textarea 
                  placeholder="Describe patient's main concern..." 
                  value={form.chiefComplaint} 
                  onChange={e=>setForm({...form, chiefComplaint:e.target.value})}
                />
              </div>
              <div className="form-group">
                <label>Condition Type</label>
                <select value={form.conditionType} onChange={e=>setForm({...form, conditionType:e.target.value})}>
                  <option value="other">Other</option>
                  <option value="skin">Skin</option>
                  <option value="wound">Wound</option>
                </select>
              </div>
              <div className="form-group">
                <label>Priority</label>
                <select value={form.priority} onChange={e=>setForm({...form, priority:e.target.value})}>
                  <option value="normal">Normal</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>
              <button type="submit" className="btn btn-primary">
               Create Consultation
              </button>
            </form>
          </div>

<div className="card">
  <h2>💳 Process Payment</h2>

  <div className="form-group">
    <label>Consultation ID *</label>
    <input
      placeholder="CON000001 or MongoDB _id"
      value={pay.consultationId}
      onChange={e=>setPay({...pay, consultationId:e.target.value})}
    />
  </div>

  <div className="form-group">
    <label>Amount (₹) *</label>
    <input
      placeholder="200"
      value={pay.amount}
      onChange={e=>setPay({...pay, amount:e.target.value})}
    />
  </div>

  <div style={{display:'flex', gap:12, flexWrap:'wrap'}}>
    {/* Razorpay path */}
    <button onClick={createOrder} className="btn btn-secondary">
      Create Online Payment
    </button>
    {orderInfo && (
      <button onClick={openRazorpay} className="btn btn-primary">
        💳 Pay Now
      </button>
    )}

    {/* Cash path */}
    <button
      className="btn btn-outline"
      title="Record cash payment and verify"
      onClick={async () => {
        const cid = (pay.consultationId || '').trim();
        if (!cid || !pay.amount) { alert('Enter consultationId and amount'); return; }
        const paymentId = await (async () => {
          try {
            const { data } = await http.post('/payments/cash/initiate', {
              consultationRef: cid,
              amountInRupees: Number(pay.amount || 200)
            });
            return data.paymentId;
          } catch (e) {
            alert(e.response?.data?.message || 'Cash initiation failed');
            return null;
          }
        })();
        if (paymentId) {
          try {
            await http.post('/payments/cash/verify', { paymentId });
            toast('Cash payment verified ✓');
            // optimistic flip in table
            setConsults(prev => prev.map(x =>
              (x.consultationId === cid) ? { ...x, payReady: true } : x
            ));
            // optional: setTimeout(load, 800);
          } catch (e) {
            alert(e.response?.data?.message || 'Cash verification failed');
          }
        }
      }}
    >
      💵 Cash
    </button>
  </div>

  {orderInfo && (
    <div style={{marginTop:16, padding:12, background:'hsl(210 40% 98%)', borderRadius:8, fontSize:14}}>
      <div><strong>Order ID:</strong> {orderInfo.orderId}</div>
      <div><strong>Amount:</strong> ₹{orderInfo.amount / 100}</div>
    </div>
  )}
</div>

        </div>

        <div className="table-card">
          <h2>📊 All Consultations ({consults.length})</h2>
          {consults.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">🩺</div>
              <h3>No consultations yet</h3>
              <p>Create your first consultation above</p>
            </div>
          ) : (
            <table className="consults-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Patient</th>
                  <th>Status</th>
                  <th>Payment</th>
                  <th>Created</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {consults.map(c=>(
                  <tr key={c.id}>
                    <td style={{fontFamily:'monospace', fontSize:13}}>{c.consultationId}</td>
                    <td>{c.patient?.name || '—'}</td>
                    <td>
                      <span className={`badge badge-${c.status === 'completed' ? 'completed' : c.status === 'in_progress' ? 'progress' : 'queue'}`}>
                        {c.status === 'in_queue' }
                        {c.status === 'in_progress' }
                        {c.status === 'completed' }
                        {' '}{c.status}
                      </span>
                    </td>
                    <td>
                    <span className={`badge badge-${c.payReady ? 'paid' : 'pending'}`}>
                     {c.payReady ? '✓ Paid' : '⏳ Pending'}
                     </span>
                     </td>

                    <td style={{fontSize:13, color:'hsl(215 16% 47%)'}}>
                      {new Date(c.createdAt).toLocaleDateString()}
                    </td>
                    <td>
  <div className="action-buttons">
    <button className="btn btn-outline btn-sm" onClick={() => onRxClick(c)}
      title={canViewRx(c) ? 'View Prescription' : 'Prescription visible after completion'}>
      📄 Rx
    </button>
    <button className="btn btn-outline btn-sm" onClick={() => onVideoClick(c)}
      disabled={!canVideo(c)}
      title={canVideo(c) ? 'Start Video Call' : 'Doctor has not accepted the case'}
      style={{ opacity: canVideo(c) ? 1 : 0.6, cursor: canVideo(c) ? 'pointer' : 'not-allowed' }}>
      📹 Video
    </button>
  </div>
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

