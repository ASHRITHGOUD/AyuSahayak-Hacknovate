import { useState } from 'react';
import http from '../api/http';

export default function Login() {
  const [email, setEmail] = useState('admin@ayusahayak.in');
  const [password, setPassword] = useState('Admin@12345');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { data } = await http.post('/auth/login', { email, password });
      localStorage.setItem('accessToken', data.accessToken);
      localStorage.setItem('user', JSON.stringify(data.user));
      const role = data.user.role;
      if (role === 'admin') window.location.href = '/admin';
      else if (role === 'hospital_owner') window.location.href = '/owner';
      else if (role === 'nurse') window.location.href = '/nurse';
      else if (role === 'doctor') window.location.href = '/doctor';
    } catch (e) {
      setError(e.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style>{`
        :root{
          --bg: #f7fbff;
          --bg-soft: #f9fcff;
          --card: #ffffff;
          --ink: #1f2a44;
          --sub: #73809b;
          --ring: #10b6c7;
          --ring-weak: #b8f2f7;
          --accent: #11c5c5;
          --accent-2: #2db4e4;
          --border: #e8eef6;
        }
        body{ background: var(--bg); }

        .auth-wrap{
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: clamp(16px, 3vw, 36px);
          background:
            radial-gradient(1200px 500px at -10% -10%, #eaf6ff 0%, transparent 60%),
            radial-gradient(1200px 500px at 110% 110%, #e9fff7 0%, transparent 60%),
            var(--bg);
        }

        .auth-shell{
          width: min(1040px, 100%);
          display: grid;
          grid-template-columns: 1.15fr 1fr;
          gap: 0;
          border-radius: 22px;
          background: var(--card);
          border: 1px solid var(--border);
          overflow: clip;
          box-shadow:
            0 8px 26px rgba(16,41,80,0.06),
            0 14px 48px rgba(16,41,80,0.06);
        }

        /* Left brand pane */
        .brand-pane{
          position: relative;
          background:
            radial-gradient(180px 180px at 20% 15%, #e8fff9 0%, transparent 60%),
            radial-gradient(220px 220px at 85% 80%, #e9f6ff 0%, transparent 60%),
            linear-gradient(120deg, #f5feff 0%, #f4fbff 45%, #f7fffb 100%);
          display: grid;
          place-items: center;
          padding: clamp(28px, 3.5vw, 40px);
        }

        .brand-frame{
          width: 100%;
          max-width: 460px;
          display: grid;
          align-content: center;
          justify-items: center;
          gap: 18px;
          /* height matches the form-pane for aligned look */
          min-height: 700px;
        }

        .brand-logo{
          width: auto;
          /* increase logo height while remaining responsive */
          height: clamp(240px, 36vh, 520px);
          max-height: 720px;          /* keep proportional with card */
          object-fit: contain;
          border-radius: 16px;
          box-shadow: 0 8px 32px rgba(40,86,130,0.10);
          background: #fff;
        }

        .brand-title{
          font-size: clamp(22px, 3.1vw, 28px);
          font-weight: 800;
          letter-spacing: 0.2px;
          color: var(--ink);
          text-align: center;
        }
        .brand-tag{
          color: var(--sub);
          font-size: 14px;
          text-align: center;
          max-width: 420px;
          line-height: 1.55;
        }

        /* Right form pane */
        .form-pane{
          display: grid;
          align-content: center;
          padding: clamp(24px, 4.2vw, 48px);
          background: var(--card);
          min-height: 520px;           /* matches brand-pane min-height */
        }

        .card-head{
          margin-bottom: 14px;
        }
        .card-title{
          font-size: clamp(22px, 3vw, 26px);
          font-weight: 800;
          color: var(--ink);
          margin: 0 0 6px 0;
        }
        .card-sub{
          color: var(--sub);
          font-size: 14px;
          margin: 0;
        }

        .form-grid{
          margin-top: 18px;
          display: grid;
          gap: 16px;
        }

        .label{
          display: block;
          font-size: 13px;
          font-weight: 600;
          color: #2a3550;
          margin: 0 0 6px 2px;
        }
        .input{
          width: 100%;
          padding: 13px 14px;
          border: 1.6px solid var(--border);
          border-radius: 12px;
          background: var(--bg-soft);
          color: var(--ink);
          font-size: 15px;
          transition: border .15s, box-shadow .15s, background .15s;
        }
        .input::placeholder{ color: #9aa7bb; }
        .input:focus{
          outline: none;
          background: #fff;
          border-color: var(--ring);
          box-shadow: 0 0 0 4px color-mix(in oklab, var(--ring) 18%, transparent);
        }

        .btn{
          width: 100%;
          border: none;
          border-radius: 12px;
          padding: 14px 16px;
          font-weight: 700;
          font-size: 15px;
          cursor: pointer;
          transition: transform .12s ease, box-shadow .2s ease, opacity .2s ease;
          background: linear-gradient(94deg, var(--accent) 0%, var(--accent-2) 100%);
          color: #fff;
          box-shadow: 0 8px 24px rgba(17, 197, 197, 0.18);
        }
        .btn:hover:not(:disabled){
          transform: translateY(-1.5px);
          box-shadow: 0 12px 28px rgba(35, 178, 210, 0.22);
        }
        .btn:active:not(:disabled){ transform: translateY(0); }
        .btn:disabled{ opacity: .7; cursor: not-allowed; }

        .error{
          margin-top: 12px;
          display: grid;
          grid-auto-flow: column;
          justify-content: start;
          align-items: center;
          gap: 8px;
          font-size: 13.5px;
          padding: 12px 14px;
          border-radius: 10px;
          background: #fff1f1;
          color: #c92525;
          border: 1px solid #ffdcdc;
        }

        .hint{
          margin-top: 12px;
          font-size: 12.5px;
          color: var(--sub);
          text-align: center;
        }

        html, body {
          height: 100%;
        }

        .auth-wrap, .login-page-root, .login-container {
          min-height: 100vh;
        }


        @media (max-width: 980px){
          .auth-shell{ grid-template-columns: 1fr; }
          .brand-frame, .form-pane{ min-height: auto; }
          .brand-frame{ padding-top: 10px; padding-bottom: 6px; }
        }
        .text{
        margin-top: 1rem;
        }
      `}</style>

      <div className="auth-wrap">
        <div className="auth-shell">

          {/* Left: Brand / Image */}
          <div className="brand-pane">
            <div className="brand-frame">
              <img src="/AyuSahayakNewLogo.jpg" alt="AyuSahayak" className="brand-logo" />
              
                <h3 className="text">A trusted digital bridge between village nurses,hospital doctors and patients</h3>
             
            </div>
          </div>

          {/* Right: Form Card */}
          <div className="form-pane">
            <div className="card-head">
              <h2 className="card-title">Welcome back</h2>
              <p className="card-sub">Sign in to continue to your dashboard</p>
            </div>

            <form onSubmit={onSubmit} className="form-grid" noValidate>
              <div>
                <label className="label">Email address</label>
                <input
                  type="email"
                  className="input"
                  value={email}
                  onChange={(e)=>setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  autoComplete="username"
                />
              </div>

              <div>
                <label className="label">Password</label>
                <input
                  type="password"
                  className="input"
                  value={password}
                  onChange={(e)=>setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  autoComplete="current-password"
                />
              </div>

              <button type="submit" className="btn" disabled={loading}>
                {loading ? 'Signing in…' : 'Sign In'}
              </button>

              {error && (
                <div className="error" role="alert" aria-live="polite">
                  <span>⚠️</span> {error}
                </div>
              )}

              <div className="hint">
                Use your AyuSahayak account to access Admin, Owner, Nurse, or Doctor views.
              </div>
            </form>
          </div>

        </div>
      </div>
    </>
  );
}

