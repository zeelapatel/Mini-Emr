import React, { useEffect, useMemo, useState } from 'react';
import { format } from 'date-fns';
import { useAuth } from '../contexts/AuthContext';
import { getAppointmentsForPatient } from '../services/api';

// Recurrence expansion moved to backend via includeFuture=true

export default function PatientAppointments() {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        if (!user) return;
        const { appointments } = await getAppointmentsForPatient(user.id, true);
        setAppointments(appointments);
      } catch (e: any) {
        setError(e?.response?.data?.error || 'Failed to load appointments');
      } finally {
        setLoading(false);
      }
    })();
  }, [user]);

  const expanded = useMemo(() => appointments.slice().sort((a, b) => new Date(a.datetime).getTime() - new Date(b.datetime).getTime()), [appointments]);

  if (loading) return <div>Loading...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="card">
      <h2>Upcoming Appointments (next 3 months)</h2>
      <table className="table">
        <thead>
          <tr>
            <th>Provider</th>
            <th>Date/Time</th>
            <th>Frequency</th>
          </tr>
        </thead>
        <tbody>
          {expanded.map((a, idx) => (
            <tr key={`${a.id}-${idx}`}>
              <td>{a.provider}</td>
              <td>{format(new Date(a.datetime), 'PP p')}</td>
              <td>{a.repeat || 'none'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}


