import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getAppointmentsForPatient, getPrescriptionsForPatient } from '../services/api';

export default function PatientPortal() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [appointments, setAppointments] = useState<any[]>([]);
  const [prescriptions, setPrescriptions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        if (!user) { navigate('/'); return; }
        const [{ appointments }, { prescriptions }] = await Promise.all([
          getAppointmentsForPatient(user.id, true),
          getPrescriptionsForPatient(user.id, true),
        ]);
        setAppointments(appointments);
        setPrescriptions(prescriptions);
      } catch (e: any) {
        setError(e?.response?.data?.error || 'Failed to load');
      } finally {
        setLoading(false);
      }
    })();
  }, [user]);

  const inNext7Days = (dateStr: string) => {
    const now = new Date();
    const date = new Date(dateStr);
    const diff = (date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
    return diff >= 0 && diff <= 7;
  };

  const apptsNext7 = useMemo(() => appointments.filter(a => inNext7Days(a.datetime)).sort((a,b) => new Date(a.datetime).getTime() - new Date(b.datetime).getTime()), [appointments]);
  const rxNext7 = useMemo(() => prescriptions
    .map(r => ({ ...r, _date: r.nextRefill || r.refill_on }))
    .filter(r => r._date && inNext7Days(r._date))
    .sort((a,b) => new Date(a._date).getTime() - new Date(b._date).getTime()), [prescriptions]);

  if (loading) return <div>Loading...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ margin: 0 }}>Welcome{user ? `, ${user.name}` : ''}</h2>
        <button onClick={logout}>Logout</button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12, marginTop: 12 }}>
        <div className="card">
          <h3>Next 7 Days - Appointments</h3>
          <p style={{ fontSize: 24, margin: 0 }}>{apptsNext7.length}</p>
        </div>
        <div className="card">
          <h3>Next 7 Days - Refills</h3>
          <p style={{ fontSize: 24, margin: 0 }}>{rxNext7.length}</p>
        </div>
      </div>

      <div style={{ marginTop: 16 }}>
        <h3>Patient Information</h3>
        <p><strong>Name:</strong> {user?.name}</p>
        <p><strong>Email:</strong> {user?.email}</p>
      </div>

      <div style={{ display: 'flex', gap: 12, marginTop: 12 }}>
        <Link to="/dashboard/appointments"><button>View All Appointments</button></Link>
        <Link to="/dashboard/prescriptions"><button>View All Prescriptions</button></Link>
      </div>
    </div>
  );
}


