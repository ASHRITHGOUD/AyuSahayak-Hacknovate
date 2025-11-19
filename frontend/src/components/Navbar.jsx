import { Link } from "react-router-dom";
import "./Navbar.css";

export default function Navbar() {
  const raw = localStorage.getItem('user');
  const user = raw ? JSON.parse(raw) : null;
  const role = user?.role;

  const logout = async () => {
    if (!window.confirm('Are you sure you want to logout?')) return;
    try {
      await fetch(`${process.env.REACT_APP_API}/auth/logout`, { method: 'POST', credentials: 'include' });
    } catch (e) {}
    localStorage.removeItem('accessToken');
    localStorage.removeItem('user');
    window.location.href = '/login';
  };

  const publicMenu = [
    { to: '#about', label: 'About Us', external: true },
    { to: '#services', label: 'Services', external: true },
    { to: '/solutions', label: 'Solutions' },
    { to: '#contact', label: 'Contact Us', external: true },
    { to: '#how', label: 'How It Works', external: true }
  ];

  const roleMenus = {
    admin: [ { to: '/admin', label: 'Dashboard' }, { to: '/admin/hospitals', label: 'Hospitals' } ],
    doctor: [ { to: '/doctor', label: 'Dashboard' }, { to: '/doctor/queue', label: 'Queue' }, { to: '/doctor/in-progress', label: 'In Progress' } ],
    nurse: [ { to: '/nurse', label: 'Dashboard' }, { to: '/nurse/patients', label: 'Patients' }, { to: '/nurse/consultations', label: 'Consultations' } ],
    hospital_owner: [ { to: '/owner', label: 'Dashboard' }, { to: '/owner/staff', label: 'Staff Management' }, { to: '/owner/medicines', label: 'Medicines' }, { to: '/owner/inventory', label: 'Inventory' } ]
  };

  const roleMenu = role ? (roleMenus[role] || []) : [];

  return (
    <>
      <nav className="navbar">
        <div className="nav-container">

          <div className="nav-logo">
            <img src="/AyuSahayakNewLogo.jpg" alt="AyuSahayak" className="brand-logo" />
            <Link to="/">AyuSahayak</Link>
          </div>

          <ul className="nav-menu">
            {/* Role-specific items first (when logged in) */}
            {roleMenu.map(it => (
              <li key={`role-${it.to}`} className="nav-item role-item">
                <Link to={it.to}>{it.label}</Link>
              </li>
            ))}

            {/* Public items after role-specific ones */}
            {publicMenu.map(it => (
              <li key={`public-${it.to}`} className="nav-item public-item">
                {it.external ? <a href={it.to}>{it.label}</a> : <Link to={it.to}>{it.label}</Link>}
              </li>
            ))}
          </ul>

          <div className="nav-actions">
            {user ? (
              <>
                <button onClick={logout} className="login-btn">Logout</button>
              </>
            ) : (
              <Link to="/login" className="login-btn">Login</Link>
            )}
          </div>

        </div>
      </nav>
 
    </>
  );
}
