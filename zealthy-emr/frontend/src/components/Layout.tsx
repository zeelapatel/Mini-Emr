import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function Layout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  return (
    <div>
      <nav className="nav">
        <div className="nav-left">
          <Link to="/">Zealthy EMR</Link>
          <Link to="/portal">Portal</Link>
          <Link to="/portal/appointments">Appointments</Link>
          <Link to="/portal/prescriptions">Prescriptions</Link>
          <Link to="/admin">Admin</Link>
        </div>
        <div className="nav-right">
          {user ? (
            <>
              <span>{user.name}</span>
              <button onClick={logout} aria-label="Logout">Logout</button>
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


