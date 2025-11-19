import { useEffect, useState } from 'react';
// import { useLocation, useNavigate } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import NurseNav from '../../components/NurseNav';
import http from '../../api/http';

export default function PrescriptionView() {
  // const location = useLocation();
  const navigate = useNavigate();
  const [rx, setRx] = useState(null);
  const [err, setErr] = useState('');
  const [charge, setCharge] = useState(null);
  const [order, setOrder] = useState(null);
  const [locked, setLocked] = useState(false);
  const [msg, setMsg] = useState('');


  const ref = new URLSearchParams(window.location.search).get('ref') || '';

    const loadPrescription = async () => {
    try {
      const { data } = await http.get(`/prescriptions/by-consultation/${encodeURIComponent(ref)}`);
      setRx(data);
      setLocked(false);
    } catch (e) {
      if (e?.response?.status === 403) {
        setLocked(true);
      } else {
        setRx(null);
      }
    }
  };

  
const loadCharge = async (consultationId) => {
  try {
    const { data } = await http.get(`/rx/${encodeURIComponent(consultationId)}/charge`);
    setCharge(data);
    return data; // important
  } catch {
    setCharge(null);
    return null;
  }
};

  
  const rxCreateOrder = async (consultationId) => {
    const { data } = await http.post(`/rx/${encodeURIComponent(consultationId)}/pay/razorpay/create-order`);
    setOrder(data); // { orderId, amount, currency, paymentRecordId }
    return data;
  };
  
 const rxVerifyOrder = async (rzp) => {
  await http.post('/rx/pay/razorpay/verify', rzp);
  setMsg('Prescription unlocked');
  setOrder(null);
  await loadPrescription();           // refresh Rx; lock should be off now
  if (locked) await loadCharge(ref);  // optional: refresh bill if still locked
};

  
const rxCashFlow = async (consultationId) => {
  const { data } = await http.post(`/rx/${encodeURIComponent(consultationId)}/pay/cash/initiate`);
  await http.post('/rx/pay/cash/verify', { paymentId: data.paymentId });
  setMsg('Prescription unlocked');
  await loadPrescription();           // refresh Rx; lock should be off now
  if (locked) await loadCharge(ref);  // optional: refresh bill if still locked
};


  
  const openRazorpayForRx = async () => {
    if (!order) return;
    if (!window.Razorpay) { alert('Razorpay not loaded yet'); return; }
    const options = {
      key: process.env.REACT_APP_RAZORPAY_KEY_ID,
      amount: order.amount,
      currency: order.currency,
      name: 'AyuSahayak',
      description: 'Prescription Payment',
      order_id: order.orderId,
      handler: async (resp) => {
        try {
          await rxVerifyOrder({
            razorpay_order_id: resp.razorpay_order_id,
            razorpay_payment_id: resp.razorpay_payment_id,
            razorpay_signature: resp.razorpay_signature
          });
        } catch (e) {
          alert(e?.response?.data?.message || 'Payment verification failed');
        }
      },
      theme: { color: '#00897B' }
    };
    const rzp = new window.Razorpay(options);
    rzp.open();
  };

useEffect(() => {
  let mounted = true;
  if (!ref) { setErr('Missing consultation reference'); return; }

  (async () => {
    // Try to load Rx; for nurses this returns 403 when locked
    let isLockedNow = false;
    try {
      const { data } = await http.get(`/prescriptions/by-consultation/${encodeURIComponent(ref)}`);
      if (!mounted) return;
      setRx(data);
      setLocked(false);
    } catch (e) {
      if (!mounted) return;
      if (e?.response?.status === 403) {
        setLocked(true);
        isLockedNow = true;
      } else {
        setRx(null);
      }
    }

    // If locked, fetch the bill immediately and then poll briefly
    if (mounted && isLockedNow) {
      let found = await loadCharge(ref); // loadCharge returns data or null
      if (!found) {
        for (let i = 0; i < 6; i++) {
          await new Promise(r => setTimeout(r, 1000));
          found = await loadCharge(ref);
          if (found) break;
        }
      }
    }
  })();

  return () => { mounted = false; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [ref]);



  const printPrescription = () => {
    window.print();
  };



  return (
    <div className="prescription-page">
<style>{`
        /* =========================================
   PRESCRIPTION VIEW – STRICT PALETTE GLASS UI
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

.prescription-page {
  min-height: 100vh;
  background:
    radial-gradient(circle at top left, rgba(255, 255, 255, 0.92), #ffffff 60%),
    #ffffff;
}

/* Container as glass workspace */
.prescription-container {
  padding: 24px;
  max-width: 1000px;
  margin: 0 auto 56px;
  position: relative;
  animation: fadeInUp 0.5s ease-out;
}

/* Glass plate behind content */
.prescription-container::before {
  content: "";
  position: absolute;
  inset: 24px 0 0;
  margin: 0 auto;
  max-width: 960px;
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

/* =========================================
   GENERIC BUTTONS
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

/* Primary gradient */
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

/* Secondary (online payment create, etc.) */
.btn-secondary {
  background: rgba(0, 0, 0, 0.82);
  color: #ffffff;
  box-shadow: 0 12px 30px -12px rgba(0, 0, 0, 0.5);
}

.btn-secondary:hover {
  transform: translateY(-3px);
  box-shadow: 0 16px 40px -14px rgba(0, 0, 0, 0.6);
}

/* Outline (cash, etc.) */
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

/* Back button */
.btn-back {
  padding: 0.6rem 1.3rem;
  background: rgba(255, 255, 255, 0.98);
  border: 1px solid var(--glass-border-soft);
  border-radius: 999px;
  cursor: pointer;
  transition:
    background 180ms ease,
    border-color 180ms ease,
    transform 180ms ease,
    box-shadow 180ms ease;
  font-size: 0.9rem;
  color: var(--text-main);
}

.btn-back:hover {
  background: #ffffff;
  border-color: rgba(0, 0, 0, 0.16);
  transform: translateY(-2px);
  box-shadow: 0 8px 20px -12px rgba(0, 0, 0, 0.28);
}

/* Print button */
.btn-print {
  padding: 0.75rem 1.6rem;
  background: #1565c0;
  color: #ffffff;
  border: none;
  border-radius: 999px;
  cursor: pointer;
  font-weight: 600;
  font-size: 0.9rem;
  transition:
    transform 220ms ease,
    box-shadow 220ms ease,
    background 160ms ease;
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.btn-print:hover {
  background: #1565c0;
  transform: translateY(-3px);
  box-shadow: 0 12px 30px -12px rgba(0, 0, 0, 0.5);
}

/* =========================================
   ALERTS / MESSAGES
   ========================================= */

.alert {
  padding: 12px 14px;
  border-radius: 12px;
  margin: 16px 0;
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
  background: #ffebee;
  color: var(--text-main);
  border: 1px solid rgba(0, 0, 0, 0.08);
}

.alert-error {
  background: #ffebee;
  color: var(--text-main);
  border: 1px solid rgba(0, 0, 0, 0.08);
}

/* Error block (missing ref / bill not available) */
.error-message {
  background: #ffebee;
  color: var(--text-main);
  border: 1px solid rgba(0, 0, 0, 0.08);
  padding: 14px 18px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  gap: 8px;
}

/* Loading */
.loading {
  text-align: center;
  padding: 40px 16px;
  color: var(--text-muted);
}

/* =========================================
   PAGE ACTIONS (TOP BAR)
   ========================================= */

.page-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 22px;
}

/* =========================================
   RX CARD (LOCKED + UNLOCKED)
   ========================================= */

.rx-card {
  background: var(--glass-bg-strong);
  border-radius: 20px;
  padding: 32px 30px;
  box-shadow: var(--shadow-soft);
  border: 1.5px solid rgba(0,0,0,0.03);
  backdrop-filter: blur(14px);
  transition:
    transform 220ms ease,
    box-shadow 220ms ease,
    border-color 220ms ease;
}

.rx-card:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-softer);
  border-color: rgba(0, 0, 0, 0.12);
}

/* Header (title + subtitle) */
.rx-header {
  border-bottom: 2px solid rgba(0, 0, 0, 0.08);
  padding-bottom: 20px;
  margin-bottom: 26px;
}

.rx-header h1 {
  font-size: 1.7rem;
  font-weight: 800;
  color: var(--text-strong);
  margin: 0 0 6px 0;
  letter-spacing: -0.02em;
  display: inline-flex;
  align-items: center;
  gap: 10px;
}

.rx-header p {
  color: var(--text-muted);
  margin: 0;
  font-size: 0.9rem;
}

/* =========================================
   INFO GRID (Consultation, Doctor, etc.)
   ========================================= */

.rx-info-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 14px 18px;
  padding: 18px 16px;
  background: var(--glass-bg-soft);
  border-radius: 16px;
  margin-bottom: 26px;
  border: 1px solid var(--glass-border-soft);
}

.rx-info-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.rx-info-label {
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.06em;
}

.rx-info-value {
  font-size: 0.9rem;
  color: var(--text-main);
  font-weight: 500;
}

/* =========================================
   RX SECTIONS (Medications, Notes, Signature)
   ========================================= */

.rx-section {
  margin-bottom: 26px;
}

.rx-section h2 {
  font-size: 1rem;
  font-weight: 700;
  color: var(--text-strong);
  margin: 0 0 14px 0;
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

/* Medications table */
.meds-table {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  border-radius: 14px;
  overflow: hidden;
  border: 1px solid var(--glass-border-soft);
  background: rgba(255, 255, 255, 0.98);
}

.meds-table thead th {
  background: rgba(0, 0, 0, 0.85);
  color: #ffffff;
  padding: 12px 14px;
  text-align: left;
  font-weight: 600;
  font-size: 0.8rem;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.meds-table tbody td {
  padding: 12px 14px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
  font-size: 0.9rem;
  color: var(--text-main);
}

.meds-table tbody tr:last-child td {
  border-bottom: none;
}

.meds-table tbody tr:hover {
  background: rgba(255, 255, 255, 1);
}

/* Notes */
.rx-notes {
  padding: 16px 16px;
  background: #e8f5e9;
  border-radius: 12px;
  font-size: 0.9rem;
  line-height: 1.6;
  color: var(--text-main);
  border: 1px solid rgba(0, 0, 0, 0.06);
}

/* Footer */
.rx-footer {
  margin-top: 32px;
  padding-top: 18px;
  border-top: 1px solid var(--glass-border-soft);
  font-size: 0.8rem;
  color: var(--text-muted);
  text-align: center;
}

/* =========================================
   LOCKED STATE (BILL ONLY)
   ========================================= */

/* Text “Total to Pay” uses same card style, so we just style inline via container */

.no-print .rx-card .btn-group {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

/* =========================================
   LOADING / EMPTY BILL
   ========================================= */

/* reuse .error-message and .loading above */

/* =========================================
   PRINT STYLES
   ========================================= */

@media print {
  .prescription-page {
    background: #ffffff;
  }

  .no-print {
    display: none !important;
  }

  .prescription-container {
    padding: 0;
    margin: 0;
  }

  .prescription-container::before {
    display: none;
  }

  .rx-card {
    box-shadow: none;
    border-radius: 0;
    border: none;
    padding: 20px 10px;
    background: #ffffff;
  }
}

/* =========================================
   RESPONSIVE
   ========================================= */

@media (max-width: 768px) {
  .prescription-container {
    padding: 20px 16px 40px;
  }

  .prescription-container::before {
    inset: 16px 0 0;
  }

  .page-actions {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }

  .rx-info-grid {
    grid-template-columns: 1fr;
  }

  .rx-card {
    padding: 24px 20px;
  }
}

      `}</style>
      
      <div className="no-print">
        <NurseNav />
      </div>
      
<div className="prescription-container" style={{marginTop: "80px"}}>
  <div className="page-actions no-print">
    <button className="btn-back" onClick={()=>navigate(-1)}>
      ← Back
    </button>
    {rx && !locked && (
      <button className="btn-print" onClick={printPrescription}>
        🖨️ Print Prescription
      </button>
    )}
  </div>

  {err && (
    <div className="error-message">
      <span>⚠</span>
      {err}
    </div>
  )}

  {/* Loading state */}
  {!rx && !locked && !err && (
    <div className="loading">
      <div style={{fontSize:48, marginBottom:16}}>⏳</div>
      <p>Loading prescription...</p>
    </div>
  )}
  

  {/* STRICT LOCK: When locked, show ONLY bill and payment UI, hide all prescription details */}
  {locked && (
    <div className="rx-card">
      <div className="rx-header">
        <h1>
          <span>🔒</span>
          Prescription Locked
        </h1>
        <p>Pay the hospital bill to unlock and view the prescription</p>
      </div>

      {charge ? (
        <>
          {/* Only show total price before payment, hide all medicine details */}
          <div style={{ margin: '32px 0', textAlign: 'center', fontWeight: 700, fontSize: 22 }}>
            Total to Pay: ₹{Number(charge.grandTotal || 0).toLocaleString('en-IN')}
          </div>

          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap'}} className="no-print">
            <button
              className="btn btn-secondary"
              onClick={async () => {
                try {
                  const data = await rxCreateOrder(ref);
                  if (data) openRazorpayForRx();
                } catch (e) {
                  alert(e?.response?.data?.message || 'Order creation failed');
                }
              }}
            >
              Create Online Payment
            </button>

            {order && (
              <button className="btn btn-primary" onClick={openRazorpayForRx}>
                💳 Pay Now
              </button>
            )}

            <button
              className="btn btn-outline"
              onClick={async () => {
                try {
                  // Always pass consultationId as ref (never undefined)
                  await rxCashFlow(ref);
                  // after cash verify, prescription should unlock
                  await loadPrescription();
                  if (locked) await loadCharge(ref);
                } catch (e) {
                  alert(e?.response?.data?.message || 'Cash payment failed');
                }
              }}
            >
              💵 Cash
            </button>
          </div>
        </>
      ) : (
        <div className="error-message">
          <span>ℹ️</span>
          Bill not available yet. Ask the doctor to generate the bill.
        </div>
      )}
    </div>
  )}
  
  {msg && (
    <div className={`alert ${msg.toLowerCase().includes('unlocked') || msg.includes('success') || msg.includes('✓') ? 'alert-success' : 'alert-error'}`}>
      <span>{msg.toLowerCase().includes('unlocked') || msg.includes('success') || msg.includes('✓') ? '✓' : '⚠'}</span>
      {msg}
    </div>
  )}
  {/* When unlocked, show ONLY the prescription details, never the bill/payment UI */}
  {rx && !locked && (
    <div className="rx-card">
      <div className="rx-header">
        <h1>
          <span>💊</span>
          Medical Prescription
        </h1>
        <p>Official prescription document for patient treatment</p>
      </div>

      <div className="rx-info-grid">
        <div className="rx-info-item">
          <div className="rx-info-label">Consultation ID</div>
          <div className="rx-info-value" style={{fontFamily:'monospace'}}>
            {rx.consultationIdHuman || rx.consultationId || ref || '—'}
          </div>
        </div>
        <div className="rx-info-item">
          <div className="rx-info-label">Doctor</div>
          <div className="rx-info-value">{rx.digitalSignature?.doctorName || '—'}</div>
        </div>
        <div className="rx-info-item">
          <div className="rx-info-label">Qualification</div>
          <div className="rx-info-value">{rx.digitalSignature?.qualification || '—'}</div>
        </div>
        <div className="rx-info-item">
          <div className="rx-info-label">Date Signed</div>
          <div className="rx-info-value">
            {rx.digitalSignature?.signedAt ? new Date(rx.digitalSignature.signedAt).toLocaleDateString('en-IN', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            }) : '—'}
          </div>
        </div>
      </div>

      <div className="rx-section">
        <h2>💊 Prescribed Medications</h2>
        {(!rx.medications || rx.medications.length === 0) ? (
          <p style={{color:'hsl(215 16% 47%)'}}>No medications prescribed</p>
        ) : (
          <table className="meds-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Medicine</th>
                <th>Dosage</th>
                <th>Frequency</th>
                <th>Duration</th>
                <th>Instructions</th>
              </tr>
            </thead>
            <tbody>
              {rx.medications.map((m, i)=>(
                <tr key={i}>
                  <td style={{fontWeight:600}}>{i + 1}</td>
                  <td style={{fontWeight:600, color:'hsl(215 25% 27%)'}}>{m.name}</td>
                  <td>{m.dosage}</td>
                  <td>{m.frequency}</td>
                  <td>{m.duration}</td>
                  <td>{m.instructions || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {rx.notes && (
        <div className="rx-section">
          <h2>📝 Additional Notes</h2>
          <div className="rx-notes">
            {rx.notes}
          </div>
        </div>
      )}

      {rx.digitalSignature?.signatureUrl && (
        <div className="rx-section">
          <h2>✍️ Doctor's Signature</h2>
          <img
            src={rx.digitalSignature.signatureUrl}
            alt="Doctor signature"
            style={{maxWidth:200, height:'auto', border:'1px solid hsl(214 32% 91%)', borderRadius:8}}
          />
        </div>
      )}

      <div className="rx-footer">
        <p><strong>AyuSahayak Rural Healthcare Platform</strong></p>
        <p>Prescription is digitally approved by the doctor</p>
      </div>
    </div>
  )}
</div>

    </div>
  );
}

