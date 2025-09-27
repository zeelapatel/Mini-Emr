import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getPatients, createPatient } from '../services/api';
import Spinner from './Spinner';
import { useToast } from '../contexts/ToastContext';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [patients, setPatients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [q, setQ] = useState('');
  const [sortKey, setSortKey] = useState<'id' | 'name' | 'email' | 'appointmentsCount' | 'prescriptionsCount'>('id');
  const [asc, setAsc] = useState(true);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const { patients } = await getPatients();
      setPatients(patients);
    } catch (e: any) {
      setError(e?.response?.data?.error || 'Failed to load patients');
      addToast('Failed to load patients', 'error');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  const onAddPatient = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const emailOk = /.+@.+\..+/.test(email);
      if (!emailOk) throw new Error('Invalid email');
      if (!name || !email || !password) throw new Error('All fields are required');
      await createPatient({ name, email, password });
      setName(''); setEmail(''); setPassword('');
      setShowForm(false);
      await load();
      addToast('Patient added', 'success');
    } catch (e: any) {
      const msg = e?.response?.data?.error || e?.message || 'Failed to add patient';
      setError(msg);
      addToast(msg, 'error');
    } finally {
      setSaving(false);
    }
  };

  const filteredSorted = useMemo(() => {
    const term = q.trim().toLowerCase();
    const list = term ? patients.filter(p => `${p.name} ${p.email}`.toLowerCase().includes(term)) : patients.slice();
    list.sort((a, b) => {
      const va = a[sortKey];
      const vb = b[sortKey];
      if (typeof va === 'string' && typeof vb === 'string') return asc ? va.localeCompare(vb) : vb.localeCompare(va);
      return asc ? (va - vb) : (vb - va);
    });
    return list;
  }, [patients, q, sortKey, asc]);

  if (loading) return <Spinner label="Loading patients..." />;
  return (
    <div className="card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <h2 style={{ margin: 0 }}>EMR Admin Portal</h2>
        <div>
          <Link to="/" style={{ marginRight: 12 }}>Back to Login</Link>
          <button onClick={() => setShowForm((v) => !v)}>{showForm ? 'Cancel' : 'Add New Patient'}</button>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
        <input placeholder="Search patients" value={q} onChange={(e) => setQ(e.target.value)} style={{ maxWidth: 260, width: '100%' }} />
      </div>

      {showForm && (
        <form onSubmit={onAddPatient} className="form" style={{ marginBottom: 16 }}>
          <label>
            Name
            <input value={name} onChange={(e) => setName(e.target.value)} required />
          </label>
          <label>
            Email
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </label>
          <label>
            Password
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </label>
          <div>
            <button type="submit" disabled={saving}>{saving ? 'Saving...' : 'Save Patient'}</button>
          </div>
        </form>
      )}

      {error && <div className="error" style={{ marginBottom: 12 }}>{error}</div>}

      <table className="table">
        <thead>
          <tr>
            <th style={{ cursor: 'pointer' }} onClick={() => { setAsc(sortKey === 'id' ? !asc : true); setSortKey('id'); }}>ID</th>
            <th style={{ cursor: 'pointer' }} onClick={() => { setAsc(sortKey === 'name' ? !asc : true); setSortKey('name'); }}>Name</th>
            <th style={{ cursor: 'pointer' }} onClick={() => { setAsc(sortKey === 'email' ? !asc : true); setSortKey('email'); }}>Email</th>
            <th style={{ cursor: 'pointer' }} onClick={() => { setAsc(sortKey === 'appointmentsCount' ? !asc : true); setSortKey('appointmentsCount'); }}>Appointments</th>
            <th style={{ cursor: 'pointer' }} onClick={() => { setAsc(sortKey === 'prescriptionsCount' ? !asc : true); setSortKey('prescriptionsCount'); }}>Prescriptions</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {filteredSorted.map((p) => (
            <tr key={p.id} style={{ cursor: 'pointer' }} onClick={() => navigate(`/admin/patients/${p.id}`)}>
              <td>{p.id}</td>
              <td>{p.name}</td>
              <td>{p.email}</td>
              <td>{p.appointmentsCount}</td>
              <td>{p.prescriptionsCount}</td>
              <td>
                <button onClick={(e) => { e.stopPropagation(); navigate(`/admin/patients/${p.id}`); }}>View</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}


