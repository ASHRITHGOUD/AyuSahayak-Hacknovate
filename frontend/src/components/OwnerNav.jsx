// export default function OwnerNav() {
//   const user = JSON.parse(localStorage.getItem('user') || 'null');
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
//         .owner-nav {
//           background: linear-gradient(135deg, #37474F 0%, #455A64 100%);
//           padding: 0;
//           box-shadow: 0 2px 8px rgba(0,0,0,0.1);
//           position: sticky;
//           top: 0;
//           z-index: 100;
//         }
        
//         .owner-nav-container {
//           max-width: 1400px;
//           margin: 0 auto;
//           display: flex;
//           align-items: center;
//           padding: 0 24px;
//           height: 64px;
//         }
        
//         .owner-logo {
//           font-size: 20px;
//           font-weight: 700;
//           color: white;
//           margin-right: 48px;
//           display: flex;
//           align-items: center;
//           gap: 8px;
//         }
        
//         .owner-links {
//           display: flex;
//           gap: 8px;
//           flex: 1;
//         }
        
//         .owner-link {
//           color: rgba(255,255,255,0.85);
//           padding: 10px 20px;
//           border-radius: 8px;
//           font-weight: 500;
//           font-size: 14px;
//           transition: all 0.2s;
//           text-decoration: none;
//         }
        
//         .owner-link:hover {
//           background: rgba(255,255,255,0.15);
//           color: white;
//         }
        
//         .owner-link.active {
//           background: rgba(255,255,255,0.2);
//           color: white;
//         }
        
//         .owner-user {
//           display: flex;
//           align-items: center;
//           gap: 16px;
//           margin-left: auto;
//         }
        
//         .owner-email {
//           color: rgba(255,255,255,0.9);
//           font-size: 14px;
//           font-weight: 500;
//         }
        
//         .owner-logout {
//           padding: 8px 20px;
//           background: rgba(255,255,255,0.2);
//           color: white;
//           border: none;
//           border-radius: 8px;
//           font-weight: 500;
//           font-size: 14px;
//           cursor: pointer;
//           transition: all 0.2s;
//         }
        
//         .owner-logout:hover {
//           background: rgba(255,255,255,0.3);
//         }
        
//         @media (max-width: 768px) {
//           .owner-email {
//             display: none;
//           }
//         }
//       `}</style>
      
//       <nav className="owner-nav">
//         <div className="owner-nav-container">
//           <div className="owner-logo">
//             <span>🏢</span>
//             <span>Hospital Owner</span>
//           </div>
          
//           <div className="owner-links">
//             <a 
//               href="/owner" 
//               className={`owner-link ${currentPath === '/owner' ? 'active' : ''}`}
//             >
//               Dashboard
//             </a>
//             <a 
//               href="/owner/staff" 
//               className={`owner-link ${currentPath === '/owner/staff' ? 'active' : ''}`}
//             >
//               Staff Management
//             </a>
//             <a 
//               href="/owner/medicines" 
//               className={`owner-link ${currentPath === '/owner/medicines' ? 'active' : ''}`}
//             >
//               Medicines
//             </a>
//             <a 
//               href="/owner/inventory" 
//               className={`owner-link ${currentPath === '/owner/inventory' ? 'active' : ''}`}
//             >
//               Inventory
//             </a>

//           </div>
          
//           <div className="owner-user">
//             <span className="owner-email">{user?.email}</span>
//             <button onClick={logout} className="owner-logout">
//               Logout
//             </button>
//           </div>
//         </div>
//       </nav>
//     </>
//   );
// }
import Navbar from './Navbar';
export default Navbar;

