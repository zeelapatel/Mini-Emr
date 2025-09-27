import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { format } from 'date-fns';
import { useToast } from '../contexts/ToastContext';
import { useParams } from 'react-router-dom';
import BackButton from './BackButton';
import {
  getPatient,
  updatePatient,
  getAppointmentsForPatient,
  createAppointment,
  updateAppointment,
  deleteAppointment,
  getPrescriptionsForPatient,
  createPrescription,
  updatePrescription,
  deletePrescription,
  getMedications,
  getDosages,
} from '../services/api';

export default function PatientDetail() {
  const { id } = useParams();
  const patientId = useMemo(() => Number(id), [id]);
  const { addToast } = useToast();

  const [patient, setPatient] = useState<any | null>(null);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [prescriptions, setPrescriptions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // patient edit form
  const [editingPatient, setEditingPatient] = useState(false);
  const [pName, setPName] = useState('');
  const [pEmail, setPEmail] = useState('');
  const [pPassword, setPPassword] = useState('');
  const [savingPatient, setSavingPatient] = useState(false);

  // appointment form state
  const [showApptForm, setShowApptForm] = useState(false);
  const [editingApptId, setEditingApptId] = useState<number | null>(null);
  const [aProvider, setAProvider] = useState('');
  const [aDatetime, setADatetime] = useState('');
  const [aRepeat, setARepeat] = useState('none');
  const [aEndDate, setAEndDate] = useState('');
  const [savingAppt, setSavingAppt] = useState(false);

  // prescriptions form state
  const [showRxForm, setShowRxForm] = useState(false);
  const [editingRxId, setEditingRxId] = useState<number | null>(null);
  const [rxMedication, setRxMedication] = useState('');
  const [rxDosage, setRxDosage] = useState('');
  const [rxQuantity, setRxQuantity] = useState<number>(1);
  const [rxRefillOn, setRxRefillOn] = useState('');
  const [rxRefillSchedule, setRxRefillSchedule] = useState('monthly');
  const [savingRx, setSavingRx] = useState(false);

  const [medications, setMedications] = useState<string[]>([]);
  const [dosages, setDosages] = useState<string[]>([]);

  const loadAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [{ patient, appointments, prescriptions }, meds, doses] = await Promise.all([
        getPatient(patientId),
        getMedications(),
        getDosages(),
      ]);
      setPatient(patient);
      setAppointments(appointments);
      setPrescriptions(prescriptions);
      setMedications(meds.medications);
      setDosages(doses.dosages);
      setPName(patient.name);
      setPEmail(patient.email);
      setPPassword('');
    } catch (e: any) {
      setError(e?.response?.data?.error || 'Failed to load patient');
    } finally {
      setLoading(false);
    }
  }, [patientId]);

  useEffect(() => {
    if (Number.isInteger(patientId)) loadAll();
  }, [patientId, loadAll]);

  const onSavePatient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!patient) return;
    setSavingPatient(true);
    try {
      const payload: any = { name: pName, email: pEmail };
      if (pPassword) payload.password = pPassword;
      const { patient: updated } = await updatePatient(patient.id, payload);
      setPatient(updated);
      setEditingPatient(false);
      addToast('Patient updated', 'success');
    } catch (e: any) {
      const msg = e?.response?.data?.error || 'Failed to update patient';
      setError(msg);
      addToast(msg, 'error');
    } finally {
      setSavingPatient(false);
    }
  };

  const onEditAppt = (appt: any) => {
    setEditingApptId(appt.id);
    setAProvider(appt.provider);
    setADatetime(appt.datetime?.slice(0, 16) || '');
    setARepeat(appt.repeat || 'none');
    setAEndDate(appt.end_date || '');
    setShowApptForm(true);
  };

  const onSaveAppt = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingAppt(true);
    try {
      const payload = { user_id: patientId, provider: aProvider, datetime: aDatetime, repeat: aRepeat, end_date: aEndDate || null } as any;
      if (editingApptId) {
        await updateAppointment(editingApptId, payload);
      } else {
        await createAppointment(payload);
      }
      const { appointments } = await getAppointmentsForPatient(patientId);
      setAppointments(appointments);
      setShowApptForm(false);
      setEditingApptId(null);
      setAProvider(''); setADatetime(''); setARepeat('none'); setAEndDate('');
      addToast('Appointment saved', 'success');
    } catch (e: any) {
      const msg = e?.response?.data?.error || 'Failed to save appointment';
      setError(msg);
      addToast(msg, 'error');
    } finally {
      setSavingAppt(false);
    }
  };

  const onDeleteAppt = async (id: number) => {
    if (!window.confirm('Delete this appointment?')) return;
    try {
      await deleteAppointment(id);
      const { appointments } = await getAppointmentsForPatient(patientId);
      setAppointments(appointments);
      addToast('Appointment deleted', 'success');
    } catch (e: any) {
      const msg = e?.response?.data?.error || 'Failed to delete appointment';
      setError(msg);
      addToast(msg, 'error');
    }
  };

  const onEditRx = (rx: any) => {
    setEditingRxId(rx.id);
    setRxMedication(rx.medication);
    setRxDosage(rx.dosage);
    setRxQuantity(rx.quantity);
    setRxRefillOn(rx.refill_on);
    setRxRefillSchedule(rx.refill_schedule || 'monthly');
    setShowRxForm(true);
  };

  const onSaveRx = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingRx(true);
    try {
      const payload: any = {
        user_id: patientId,
        medication: rxMedication,
        dosage: rxDosage,
        quantity: rxQuantity,
        refill_on: rxRefillOn,
        refill_schedule: rxRefillSchedule,
      };
      if (editingRxId) {
        await updatePrescription(editingRxId, payload);
      } else {
        await createPrescription(payload);
      }
      const { prescriptions } = await getPrescriptionsForPatient(patientId);
      setPrescriptions(prescriptions);
      setShowRxForm(false);
      setEditingRxId(null);
      setRxMedication(''); setRxDosage(''); setRxQuantity(1); setRxRefillOn(''); setRxRefillSchedule('monthly');
      addToast('Prescription saved', 'success');
    } catch (e: any) {
      const msg = e?.response?.data?.error || 'Failed to save prescription';
      setError(msg);
      addToast(msg, 'error');
    } finally {
      setSavingRx(false);
    }
  };

  const onDeleteRx = async (id: number) => {
    if (!window.confirm('Delete this prescription?')) return;
    try {
      await deletePrescription(id);
      const { prescriptions } = await getPrescriptionsForPatient(patientId);
      setPrescriptions(prescriptions);
      addToast('Prescription deleted', 'success');
    } catch (e: any) {
      const msg = e?.response?.data?.error || 'Failed to delete prescription';
      setError(msg);
      addToast(msg, 'error');
    }
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div className="error">{error}</div>;
  if (!patient) return <div>Not found</div>;

  return (
    <div className="card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ margin: 0 }}>Patient #{patient.id}: {patient.name}</h2>
        <BackButton to="/admin" label="Back to Patients" />
      </div>

      {/* Patient info */}
      {!editingPatient ? (
        <div style={{ margin: '12px 0' }}>
          <p><strong>Email:</strong> {patient.email}</p>
          <button onClick={() => setEditingPatient(true)}>Edit Patient</button>
        </div>
      ) : (
        <form onSubmit={onSavePatient} className="form" style={{ margin: '12px 0' }}>
          <label>
            Name
            <input value={pName} onChange={(e) => setPName(e.target.value)} required />
          </label>
          <label>
            Email
            <input type="email" value={pEmail} onChange={(e) => setPEmail(e.target.value)} required />
          </label>
          <label>
            Password (optional)
            <input type="password" value={pPassword} onChange={(e) => setPPassword(e.target.value)} />
          </label>
          <div>
            <button type="submit" disabled={savingPatient}>{savingPatient ? 'Saving...' : 'Save'}</button>
            <button type="button" style={{ marginLeft: 8 }} onClick={() => setEditingPatient(false)}>Cancel</button>
          </div>
        </form>
      )}

      {/* Appointments section */}
      <div style={{ marginTop: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ margin: 0 }}>Appointments</h3>
          <button onClick={() => { setShowApptForm(true); setEditingApptId(null); setAProvider(''); setADatetime(''); setARepeat('none'); }}>Add New Appointment</button>
        </div>
        {showApptForm && (
          <form onSubmit={onSaveAppt} className="form" style={{ margin: '12px 0' }}>
            <label>
              Provider
              <input value={aProvider} onChange={(e) => setAProvider(e.target.value)} required />
            </label>
            <label>
              Date & Time
              <input type="datetime-local" value={aDatetime} onChange={(e) => setADatetime(e.target.value)} required />
            </label>
            <label>
              Repeat
              <select value={aRepeat} onChange={(e) => setARepeat(e.target.value)}>
                <option value="none">None</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
              </select>
            </label>
            <label>
              End Date (optional)
              <input type="date" value={aEndDate} onChange={(e) => setAEndDate(e.target.value)} />
            </label>
            <div>
              <button type="submit" disabled={savingAppt}>{savingAppt ? 'Saving...' : 'Save Appointment'}</button>
              <button type="button" style={{ marginLeft: 8 }} onClick={() => { setShowApptForm(false); setEditingApptId(null); }}>Cancel</button>
            </div>
          </form>
        )}

        <table className="table">
          <thead>
            <tr>
              <th>Provider</th>
              <th>Date/Time</th>
              <th>Repeat</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {appointments.map((a) => (
              <tr key={a.id}>
                <td>{a.provider}</td>
                <td>{format(new Date(a.datetime), 'PP p')}</td>
                <td>{a.repeat || 'none'}</td>
                <td>
                  <button onClick={() => onEditAppt(a)}>Edit</button>
                  <button onClick={() => onDeleteAppt(a.id)} style={{ marginLeft: 8 }}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Prescriptions section */}
      <div style={{ marginTop: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ margin: 0 }}>Prescriptions</h3>
          <button onClick={() => { setShowRxForm(true); setEditingRxId(null); setRxMedication(''); setRxDosage(''); setRxQuantity(1); setRxRefillOn(''); setRxRefillSchedule('monthly'); }}>Add New Prescription</button>
        </div>

        {showRxForm && (
          <form onSubmit={onSaveRx} className="form" style={{ margin: '12px 0' }}>
            <label>
              Medication
              <select value={rxMedication} onChange={(e) => setRxMedication(e.target.value)} required>
                <option value="" disabled>Select...</option>
                {medications.map((m) => <option key={m} value={m}>{m}</option>)}
              </select>
            </label>
            <label>
              Dosage
              <select value={rxDosage} onChange={(e) => setRxDosage(e.target.value)} required>
                <option value="" disabled>Select...</option>
                {dosages.map((d) => <option key={d} value={d}>{d}</option>)}
              </select>
            </label>
            <label>
              Quantity
              <input type="number" min={1} value={rxQuantity} onChange={(e) => setRxQuantity(Number(e.target.value))} required />
            </label>
            <label>
              Refill Date
              <input type="date" value={rxRefillOn} onChange={(e) => setRxRefillOn(e.target.value)} required />
            </label>
            <label>
              Refill Schedule
              <select value={rxRefillSchedule} onChange={(e) => setRxRefillSchedule(e.target.value)}>
                <option value="monthly">Monthly</option>
              </select>
            </label>
            <div>
              <button type="submit" disabled={savingRx}>{savingRx ? 'Saving...' : 'Save Prescription'}</button>
              <button type="button" style={{ marginLeft: 8 }} onClick={() => { setShowRxForm(false); setEditingRxId(null); }}>Cancel</button>
            </div>
          </form>
        )}

        <table className="table">
          <thead>
            <tr>
              <th>Medication</th>
              <th>Dosage</th>
              <th>Quantity</th>
              <th>Refill Date</th>
              <th>Schedule</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {prescriptions.map((r) => (
              <tr key={r.id}>
                <td>{r.medication}</td>
                <td>{r.dosage}</td>
                <td>{r.quantity}</td>
                <td>{r.refill_on ? format(new Date(r.refill_on), 'PP') : ''}</td>
                <td>{r.refill_schedule}</td>
                <td>
                  <button onClick={() => onEditRx(r)}>Edit</button>
                  <button onClick={() => onDeleteRx(r.id)} style={{ marginLeft: 8 }}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}


