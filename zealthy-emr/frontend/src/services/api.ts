import axios from 'axios';

const api = axios.create({
  baseURL: (process.env.REACT_APP_API_BASE as string) || 'http://localhost:5000/api',
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token') || sessionStorage.getItem('token');
  if (token) {
    config.headers = config.headers || {};
    config.headers['Authorization'] = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err?.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
    return Promise.reject(err);
  }
);

// Auth
export async function login(email: string, password: string) {
  const { data } = await api.post('/auth/login', { email, password });
  return data as { token: string; user: { id: number; name: string; email: string } };
}

export async function verify() {
  const { data } = await api.get('/auth/verify');
  return data as { user: { id: number; name: string; email: string } };
}

// Patients
export async function getPatients() {
  const { data } = await api.get('/patients');
  return data as { patients: any[] };
}

export async function getPatient(id: number) {
  const { data } = await api.get(`/patients/${id}`);
  return data as { patient: any; appointments: any[]; prescriptions: any[] };
}

export async function createPatient(payload: { name: string; email: string; password: string }) {
  const { data } = await api.post('/patients', payload);
  return data as { patient: any };
}

export async function updatePatient(id: number, payload: Partial<{ name: string; email: string; password: string }>) {
  const { data } = await api.put(`/patients/${id}`, payload);
  return data as { patient: any };
}

// Appointments
export async function getAppointmentsForPatient(patientId: number, includeFuture = false) {
  const { data } = await api.get(`/appointments/patient/${patientId}`, { params: { includeFuture } });
  return data as { appointments: any[] };
}

export async function getAppointment(id: number) {
  const { data } = await api.get(`/appointments/${id}`);
  return data as { appointment: any };
}

export async function createAppointment(payload: { user_id: number; provider: string; datetime: string; repeat: string }) {
  const { data } = await api.post('/appointments', payload);
  return data as { appointment: any };
}

export async function updateAppointment(id: number, payload: Partial<{ user_id: number; provider: string; datetime: string; repeat: string }>) {
  const { data } = await api.put(`/appointments/${id}`, payload);
  return data as { appointment: any };
}

export async function deleteAppointment(id: number) {
  await api.delete(`/appointments/${id}`);
}

// Prescriptions
export async function getPrescriptionsForPatient(patientId: number, includeFuture = false) {
  const { data } = await api.get(`/prescriptions/patient/${patientId}`, { params: { includeFuture } });
  return data as { prescriptions: any[] };
}

export async function getPrescription(id: number) {
  const { data } = await api.get(`/prescriptions/${id}`);
  return data as { prescription: any };
}

export async function createPrescription(payload: { user_id: number; medication: string; dosage: string; quantity: number; refill_on: string; refill_schedule: string }) {
  const { data } = await api.post('/prescriptions', payload);
  return data as { prescription: any };
}

export async function updatePrescription(id: number, payload: Partial<{ user_id: number; medication: string; dosage: string; quantity: number; refill_on: string; refill_schedule: string }>) {
  const { data } = await api.put(`/prescriptions/${id}`, payload);
  return data as { prescription: any };
}

export async function deletePrescription(id: number) {
  await api.delete(`/prescriptions/${id}`);
}

// Medications & Dosages
export async function getMedications() {
  const { data } = await api.get('/medications');
  return data as { medications: string[] };
}

export async function getDosages() {
  const { data } = await api.get('/dosages');
  return data as { dosages: string[] };
}

export default api;


