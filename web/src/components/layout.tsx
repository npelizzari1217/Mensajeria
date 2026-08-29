import { useState } from 'react';
import { Link, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/auth.context';
import { canManageUsers, isAdmin } from '../constants/roles';

/**
 * Application shell — sidebar navigation + top bar header + content area.
 */
export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const navLinks = [
    { to: '/inbox', label: 'Recibidos', icon: 'inbox' },
    { to: '/sent', label: 'Enviados', icon: 'send' },
    { to: '/compose', label: 'Nuevo Mensaje', icon: 'edit' },
    { to: '/search', label: 'Buscar', icon: 'search' },
    { to: '/groups', label: 'Grupos', icon: 'users' },
    { to: '/drafts', label: 'Borradores', icon: 'file' },
    { to: '/pinned', label: 'Fijados', icon: 'pin' },
    ...(canManageUsers(user?.roleId ?? user?.role)
      ? [{ to: '/admin/users' as const, label: 'Usuarios', icon: 'user' }]
      : []),
    ...(isAdmin(user?.roleId ?? user?.role)
      ? [
          { to: '/admin/empresas' as const, label: 'Empresas', icon: 'building' },
          { to: '/admin/roles' as const, label: 'Roles', icon: 'shield' },
        ]
      : []),
  ];

  const iconSvgs: Record<string, any> = {
    inbox: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="22 12 16 12 14 15 10 15 8 12 2 12"/>
        <path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/>
      </svg>
    ),
    send: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="22" y1="2" x2="11" y2="13"/>
        <polygon points="22 2 15 22 11 13 2 9 22 2"/>
      </svg>
    ),
    edit: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 20h9"/>
        <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
      </svg>
    ),
    search: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="11" cy="11" r="8"/>
        <line x1="21" y1="21" x2="16.65" y2="16.65"/>
      </svg>
    ),
    users: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
        <circle cx="9" cy="7" r="4"/>
        <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
        <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
      </svg>
    ),
    file: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
        <polyline points="14 2 14 8 20 8"/>
        <line x1="16" y1="13" x2="8" y2="13"/>
        <line x1="16" y1="17" x2="8" y2="17"/>
        <polyline points="10 9 9 9 8 9"/>
      </svg>
    ),
    pin: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2v7"/>
        <path d="M15 9H9"/>
        <circle cx="12" cy="19" r="3"/>
        <line x1="12" y1="22" x2="12" y2="19"/>
      </svg>
    ),
    user: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
        <circle cx="12" cy="7" r="4"/>
      </svg>
    ),
    building: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="4" y="2" width="16" height="20" rx="2" ry="2"/>
        <line x1="9" y1="6" x2="9" y2="6.01"/>
        <line x1="15" y1="6" x2="15" y2="6.01"/>
        <line x1="9" y1="10" x2="9" y2="10.01"/>
        <line x1="15" y1="10" x2="15" y2="10.01"/>
        <line x1="9" y1="14" x2="9" y2="14.01"/>
        <line x1="15" y1="14" x2="15" y2="14.01"/>
        <path d="M9 18h6v4H9z"/>
      </svg>
    ),
    shield: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
      </svg>
    ),
  };

  return (
    <div className="app-layout">
      {sidebarOpen && (
        <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} />
      )}

      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
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
              onClick={() => setSidebarOpen(false)}
            >
              {iconSvgs[link.icon]}
              {link.label}
            </Link>
          ))}
        </nav>
      </aside>

      <div className="main-wrapper">
        <header className="topbar">
          <button
            type="button"
            className="hamburger-btn"
            onClick={toggleSidebar}
            aria-label="Abrir menú"
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>

          <span className="user-info" style={{ marginLeft: sidebarOpen ? '0' : '0.5rem' }}>
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
