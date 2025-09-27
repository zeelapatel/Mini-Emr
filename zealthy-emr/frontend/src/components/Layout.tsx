import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function Layout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  React.useEffect(() => {
    if (!user && location.pathname.startsWith('/dashboard')) {
      navigate('/', { replace: true });
    }
  }, [user, location.pathname, navigate]);
  return (
    <div>
      <nav className="nav">
        <div className="nav-left">
          <Link to={user ? "/dashboard" : "/"}>Zealthy EMR</Link>
          {user ? (
            <>
              <Link to="/dashboard">Dashboard</Link>
              <Link to="/dashboard/appointments">Appointments</Link>
              <Link to="/dashboard/prescriptions">Prescriptions</Link>
            </>
          ) : null}
          <Link to="/admin">Admin</Link>
        </div>
        <div className="nav-right">
          {user ? (
            <>
              <span>{user.name}</span>
              <button onClick={() => { logout(); navigate('/', { replace: true }); }} aria-label="Logout">Logout</button>
            </>
          ) : (
            <Link to="/">Login</Link>
          )}
        </div>
      </nav>
      <main className="container">{children}</main>
    </div>
  );
}


