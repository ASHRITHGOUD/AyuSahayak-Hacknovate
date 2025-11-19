import { useEffect, useState } from 'react';

import http from '../../api/http';
import OwnerNav from '../../components/OwnerNav';

export default function OwnerInventory() {
  const [catalog, setCatalog] = useState([]);
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(false);
  const [hospitalId] = useState('SELF');
  const [inv, setInv] = useState({});


useEffect(() => {
  let mounted = true;
  (async () => {
    setLoading(true);
    try {
      const [{ data: meds }, { data: map }] = await Promise.all([
        http.get('/medicine/catalog', { params: { hospitalId, q } }),
        http.get('/inventory/by-medicine', { params: { hospitalId } })
      ]);
      if (mounted) {
        setCatalog(Array.isArray(meds) ? meds : []);
        setInv(map || {});
      }
    } catch {
      if (mounted) {
        setCatalog([]);
        setInv({});
      }
    } finally {
      if (mounted) setLoading(false);
    }
  })();
  return () => { mounted = false; };
}, [hospitalId, q]);



const saveQty = async (medId, qty) => {
  try {
    await http.post('/inventory/set', {
      hospitalId: hospitalId === 'SELF' ? undefined : hospitalId,
      medicineId: medId,
      quantity: Number(qty || 0)
    });
    // Refresh inv map for immediate feedback
    const { data: map } = await http.get('/inventory/by-medicine', { params: { hospitalId } });
    setInv(map || {});
  } catch (e) {
    alert(e?.response?.data?.message || 'Failed to update stock');
  }
};


  return (
    <div className="owner-page">
      <OwnerNav />
      <style>{`
        .owner-content {
          padding: 24px;
          max-width: 1000px;
          margin: 0 auto;
        }
        .inv-title {
          font-size: 2.2rem;
          font-weight: 700;
          color: #2b2638ff;
          margin-bottom: 8px;
        }
        .inv-desc {
          color: #607d8b;
          margin-bottom: 24px;
        }
        .inv-search {
          margin-bottom: 18px;
          display: flex;
          gap: 10px;
        }
        .inv-search input {
          flex: 1;
          padding: 12px 14px;
          border: 1px solid #cfd8dc;
          border-radius: 8px;
          font-size: 15px;
          background: #f5f7fa;
        }
        .inv-table-card {
          background: #fff;
          border-radius: 18px;
          padding: 28px 18px;
          box-shadow: 0 4px 16px 0 rgba(55,71,79,0.07);
        }
        .consults-table {
          width: 100%;
          border-collapse: separate;
          border-spacing: 0;
        }
        .consults-table th {
          background: #e3ecf7;
          color: #263238;
          font-weight: 700;
          padding: 14px 8px;
          font-size: 15px;
        }
        .consults-table td {
          padding: 12px 20px;
          font-size: 15px;
          border-bottom: 1px solid #e3ecf7;
        }
        .consults-table tr:last-child td {
          border-bottom: none;
        }
        .consults-table tr:hover {
          background: #f5f7fa;
        }
        .table-input {
          width: 100%;
          padding: 8px 10px;
          border: 1px solid #cfd8dc;
          border-radius: 6px;
          font-size: 14px;
          background: #f5f7fa;
          transition: border 0.2s;
        }
        .table-input:focus {
          border-color: #1976d2;
          outline: none;
        }
        .btn-save {
          background: #1976d2;;
          color: #fff;
          border: none;
          border-radius: 6px;
          padding: 7px 14px;
          font-weight: 600;
          font-size: 14px;
          cursor: pointer;
          transition: box-shadow 0.2s, transform 0.2s;
        }
        .btn-save:hover {
          background: #1976d2;
          box-shadow: 0 2px 8px #1976d2;;
          transform: translateY(-1px);
        }
      `}</style>
      <div className="owner-content" style={{marginTop: "50px"}}>
        <h1 className="inv-title">Inventory</h1>
        <p className="inv-desc">Set stock quantities for medicines</p>

        <div className="inv-search">
          <input placeholder="Search name..." value={q} onChange={e=>setQ(e.target.value)} />
          {loading && <span>Loading…</span>}
        </div>

        <div className="inv-table-card">
          <table className="consults-table">
            <thead>
              <tr>
                <th>Name</th><th>Code</th><th>Strength</th><th>Unit Price (₹)</th><th>Stock</th><th>Set Quantity</th><th>Save</th>
              </tr>
            </thead>
            <tbody>
              {catalog.map(m => (
                <tr key={m._id}>
                  <td>{m.name}</td>
                  <td>{m.code || '—'}</td>
                  <td>{m.strength || '—'}</td>
                  <td>₹{Number(m.unitPrice || 0).toLocaleString('en-IN')}</td>
                  <td>{inv[m._id] ?? 0}</td>
                  <td>
                    <input className="table-input" type="number" min="0" placeholder="Qty" id={`qty-${m._id}`} />
                  </td>
                  <td>
                    <button
                      className="btn-save"
                      onClick={async ()=>{
                        const el = document.getElementById(`qty-${m._id}`);
                        await saveQty(m._id, el.value);
                        el.value = '';
                      }}
                    >
                      Save
                    </button>
                  </td>
                </tr>
              ))}
              {catalog.length === 0 && (
                <tr><td colSpan={7} style={{ color:'#90a4ae', padding:16 }}>No medicines found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
