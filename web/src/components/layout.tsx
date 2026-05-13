import { Link, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/auth.context';

/**
 * Application shell — sidebar navigation + top bar header + content area.
 */
export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const navLinks = [
    { to: '/inbox', label: 'Recibidos' },
    { to: '/sent', label: 'Enviados' },
    { to: '/compose', label: 'Nuevo Mensaje' },
  ];

  return (
    <div className="app-layout">
      <aside className="sidebar">
        <div className="sidebar-header">
          <h2>Mensajeria</h2>
        </div>
        <nav className="sidebar-nav">
          {navLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className={
                location.pathname === link.to ? 'nav-link active' : 'nav-link'
              }
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </aside>

      <div className="main-wrapper">
        <header className="topbar">
          <span className="user-info">
            {user?.name ?? 'Usuario'} ({user?.role ?? '-'})
          </span>
          <button
            type="button"
            onClick={handleLogout}
            className="btn btn-sm logout-btn"
          >
            Cerrar sesion
          </button>
        </header>

        <main className="main-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
