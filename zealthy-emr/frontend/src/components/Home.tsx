import React from 'react';
import { Link } from 'react-router-dom';

export default function Home() {
  return (
    <div className="hero card" style={{ padding: 24 }}>
      <h1 className="hero-title" style={{ marginTop: 0, marginBottom: 8 }}>Zealthy EMR</h1>
      <p className="hero-subtitle" style={{ marginTop: 0, color: '#374151' }}>
        A minimal Electronic Medical Records system with a patient-facing dashboard.
      </p>
      <div className="actions" style={{ display: 'flex', gap: 12, marginTop: 16, flexWrap: 'wrap' }}>
        <Link to="/login"><button>Patient Portal Login</button></Link>
        <Link to="/admin"><button className="btn-secondary">Admin</button></Link>
      </div>
      <div style={{ marginTop: 16, color: '#6b7280', fontSize: 14 }}>
        Securely view upcoming appointments, medication refills, and manage patient data.
      </div>
    </div>
  );
}


