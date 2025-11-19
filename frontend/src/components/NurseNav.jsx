// export default function NurseNav() {
//   const currentPath = window.location.pathname;

//   const logout = async () => {
//     if (!window.confirm('Are you sure you want to logout?')) return;
//     try {
//       await fetch(`${process.env.REACT_APP_API}/auth/logout`, { method: 'POST', credentials: 'include' });
//     } catch {}
//     localStorage.removeItem('accessToken');
//     localStorage.removeItem('user');
//     window.location.href = '/login';
//   };

//   return (
//     <>
//       <style>{`
//         .nurse-nav {
//           background: linear-gradient(135deg, #00897B 0%, #26A69A 100%);
//           padding: 0;
//           box-shadow: 0 2px 8px rgba(0,0,0,0.1);
//           position: sticky;
//           top: 0;
//           z-index: 100;
//         }
        
//         .nurse-nav-container {
//           max-width: 1400px;
//           margin: 0 auto;
//           display: flex;
//           align-items: center;
//           padding: 0 24px;
//           height: 64px;
//         }
        
//         .nurse-logo {
//           font-size: 20px;
//           font-weight: 700;
//           color: white;
//           margin-right: 48px;
//           display: flex;
//           align-items: center;
//           gap: 8px;
//         }
        
//         .nurse-links {
//           display: flex;
//           gap: 8px;
//           flex: 1;
//         }
        
//         .nurse-link {
//           color: rgba(255,255,255,0.85);
//           padding: 10px 20px;
//           border-radius: 8px;
//           font-weight: 500;
//           font-size: 14px;
//           transition: all 0.2s;
//           text-decoration: none;
//         }
        
//         .nurse-link:hover {
//           background: rgba(255,255,255,0.15);
//           color: white;
//         }
        
//         .nurse-link.active {
//           background: rgba(255,255,255,0.2);
//           color: white;
//         }
        
//         .nurse-logout {
//           padding: 8px 20px;
//           background: rgba(255,255,255,0.2);
//           color: white;
//           border: none;
//           border-radius: 8px;
//           font-weight: 500;
//           font-size: 14px;
//           cursor: pointer;
//           transition: all 0.2s;
//           margin-left: auto;
//         }
        
//         .nurse-logout:hover {
//           background: rgba(255,255,255,0.3);
//         }
//       `}</style>
      
//       <nav className="nurse-nav">
//         <div className="nurse-nav-container">
//           <div className="nurse-logo">
//             <span>👩‍⚕️</span>
//             <span>Nurse</span>
//           </div>
          
//           <div className="nurse-links">
//             <a href="/nurse" className={`nurse-link ${currentPath === '/nurse' ? 'active' : ''}`}>
//               Dashboard
//             </a>
//             <a href="/nurse/patients" className={`nurse-link ${currentPath === '/nurse/patients' ? 'active' : ''}`}>
//               Patients
//             </a>
//             <a href="/nurse/consultations" className={`nurse-link ${currentPath === '/nurse/consultations' ? 'active' : ''}`}>
//               Consultations
//             </a>
//           </div>
          
//           <button onClick={logout} className="nurse-logout">
//             Logout
//           </button>
//         </div>
//       </nav>
//     </>
//   );
// }
import Navbar from './Navbar';
export default Navbar;