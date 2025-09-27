import React, { useEffect, useMemo, useState } from 'react';
import { format } from 'date-fns';
import { useAuth } from '../contexts/AuthContext';
import { getPrescriptionsForPatient } from '../services/api';

// Refill projection moved to backend via includeFuture=true

export default function PatientPrescriptions() {
  const { user } = useAuth();
  const [prescriptions, setPrescriptions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        if (!user) return;
        const { prescriptions } = await getPrescriptionsForPatient(user.id, true);
        setPrescriptions(prescriptions);
      } catch (e: any) {
        setError(e?.response?.data?.error || 'Failed to load prescriptions');
      } finally {
        setLoading(false);
      }
    })();
  }, [user]);

  const projected = useMemo(() => prescriptions.slice().sort((a, b) => new Date(a.nextRefill).getTime() - new Date(b.nextRefill).getTime()), [prescriptions]);

  if (loading) return <div>Loading...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="card">
      <h2>Prescriptions and Upcoming Refills (next 3 months)</h2>
      <table className="table">
        <thead>
          <tr>
            <th>Medication</th>
            <th>Dosage</th>
            <th>Quantity</th>
            <th>Next Refill</th>
          </tr>
        </thead>
        <tbody>
          {projected.map((r, idx) => (
            <tr key={`${r.id}-${idx}`}>
              <td>{r.medication}</td>
              <td>{r.dosage}</td>
              <td>{r.quantity}</td>
              <td>{format(new Date(r.nextRefill), 'PP')}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}


