import { useEffect, useState } from 'react';
import http from '../../api/http';
import OwnerNav from '../../components/OwnerNav';

const toast = (msg) => {
  const d = document.createElement('div');
  d.textContent = msg;
  d.style.cssText = `
    position: fixed; bottom: 24px; right: 24px; padding: 12px 16px;
    background: #37474F; color: #fff; border-radius: 8px; z-index: 9999;
  `;
  document.body.appendChild(d); setTimeout(()=>d.remove(), 2500);
};

export default function OwnerMedicines() {
  const [items, setItems] = useState([]);
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ code:'', name:'', form:'tablet', strength:'', unitPrice:'', gstPct:'' });
  // const [hospitalId, setHospitalId] = useState('SELF'); // server infers SELF from token
  const [hospitalId] = useState('SELF');


useEffect(() => {
  let mounted = true;
  (async () => {
    setLoading(true);
    try {
      const { data } = await http.get('/medicine/catalog', { params: { hospitalId, q } });
      if (mounted) setItems(Array.isArray(data) ? data : []);
    } catch {
      if (mounted) setItems([]);
    } finally {
      if (mounted) setLoading(false);
    }
  })();
  return () => { mounted = false; };
}, [hospitalId, q]);


  const create = async (e) => {
    e.preventDefault();
    try {
      const body = {
        hospitalId: hospitalId === 'SELF' ? undefined : hospitalId,
        code: form.code || undefined,
        name: form.name,
        form: form.form || undefined,
        strength: form.strength || undefined,
        unitPrice: Number(form.unitPrice),
        gstPct: form.gstPct ? Number(form.gstPct) : undefined
      };
      const { data } = await http.post('/medicine', body);
      toast('Medicine created ✓');
      setForm({ code:'', name:'', form:'tablet', strength:'', unitPrice:'', gstPct:'' });
      setItems([data, ...items]);
    } catch (e) {
      alert(e?.response?.data?.message || 'Failed to create');
    }
  };

  const saveInline = async (id, patch) => {
    try {
      const { data } = await http.patch(`/medicine/${id}`, patch);
      setItems(prev => prev.map(x => x._id === id ? { ...x, ...data } : x));
      toast('Saved ✓');
    } catch (e) {
      alert(e?.response?.data?.message || 'Failed to save');
    }
  };

  return (
    <div className="owner-page">
      <OwnerNav />
      <style>{`
        .owner-content {
          padding: 24px;
          max-width: 1200px;
          margin: 0 auto;
        }
        .med-title {
          font-size: 2.2rem;
          font-weight: 700;
          color: #263238;
          margin-bottom: 8px;
        }
        .med-desc {
          color: #607d8b;
          margin-bottom: 24px;
        }
        .rx-card {
          background: linear-gradient(120deg, #f5f7fa 0%, #e3ecf7 100%);
          border-radius: 20px;
          padding: 32px 28px 24px 28px;
          box-shadow: 0 10px 24px 0 rgba(55,71,79,0.08);
          margin-bottom: 32px;
        }
        .med-form {
          display: grid;
          grid-template-columns: repeat(6, 1fr);
          gap: 10px;
        }
        .med-form input {
          padding: 12px 14px;
          border: 1px solid #cfd8dc;
          border-radius: 8px;
          font-size: 15px;
          background: #fff;
          transition: border 0.2s;
        }
        .med-form input:focus {
          border-color: #1976d2;
          outline: none;
        }
        .btn-add {
          background: linear-gradient(135deg, #1976d2 100%);
          color: #fff;
          border: none;
          border-radius: 8px;
          font-weight: 600;
          font-size: 15px;
          cursor: pointer;
          transition: box-shadow 0.2s, transform 0.2s;
        }
        .btn-add:hover {
          box-shadow: 0 4px 16px #1976d24e;;
          transform: translateY(-2px);
        }
        .med-search {
          margin-bottom: 18px;
          display: flex;
          gap: 10px;
        }
        .med-search input {
          flex: 1;
          padding: 12px 14px;
          border: 1px solid #cfd8dc;
          border-radius: 8px;
          font-size: 15px;
          background: #f5f7fa;
        }
        .med-table-card {
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
          padding: 12px 25px;
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
        <h1 className="med-title">Medicines</h1>
        <p className="med-desc">Create and manage hospital medicine catalog</p>

        <div className="rx-card">
          <form onSubmit={create} className="med-form">
            <input placeholder="Code (optional)" value={form.code} onChange={e=>setForm({...form, code:e.target.value})} />
            <input placeholder="Name *" value={form.name} onChange={e=>setForm({...form, name:e.target.value})} required />
            <input placeholder="Form (tablet/syrup)" value={form.form} onChange={e=>setForm({...form, form:e.target.value})} />
            <input placeholder="Strength (e.g., 500mg)" value={form.strength} onChange={e=>setForm({...form, strength:e.target.value})} />
            <input placeholder="Unit Price ₹ *" value={form.unitPrice} onChange={e=>setForm({...form, unitPrice:e.target.value})} required />
            <button className="btn-add">+ Add</button>
          </form>
        </div>

        <div className="med-search">
          <input placeholder="Search name..." value={q} onChange={e=>setQ(e.target.value)} />
          {loading && <span>Loading…</span>}
        </div>

        <div className="med-table-card">
          <table className="consults-table">
            <thead>
              <tr>
                <th>Name</th><th>Code</th><th>Form</th><th>Strength</th><th>Unit Price (₹)</th><th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map(m => (
                <tr key={m._id}>
                  <td>{m.name}</td>
                  <td>{m.code || '—'}</td>
                  <td>
                    <input className="table-input" defaultValue={m.form || ''} onBlur={e=>saveInline(m._id, { form: e.target.value })} />
                  </td>
                  <td>
                    <input className="table-input" defaultValue={m.strength || ''} onBlur={e=>saveInline(m._id, { strength: e.target.value })} />
                  </td>
                  <td>
                    <input className="table-input" defaultValue={m.unitPrice} onBlur={e=>saveInline(m._id, { unitPrice: Number(e.target.value || 0) })} />
                  </td>
                  <td>
                    <button className="btn-save" onClick={()=>toast('Saved ✓')}>Save</button>
                  </td>
                </tr>
              ))}
              {items.length === 0 && (
                <tr><td colSpan={6} style={{ color:'#90a4ae', padding:16 }}>No medicines yet</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
