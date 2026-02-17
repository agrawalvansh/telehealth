import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

const api = axios.create({
    baseURL: `${API_URL}/api`,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor to add auth token
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor to handle errors
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            // Token expired or invalid
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = '/auth/login';
        }
        return Promise.reject(error);
    }
);

export default api;

// API endpoints
export const authAPI = {
    signup: (data: any) => api.post('/auth/signup', data),
    login: (data: any) => api.post('/auth/login', data),
    getProfile: () => api.get('/auth/me'),
};

export const patientAPI = {
    getProfile: () => api.get('/patients/profile'),
    updateProfile: (data: any) => api.put('/patients/profile', data),
    getAppointments: () => api.get('/patients/appointments'),
    getMedicalHistory: () => api.get('/patients/medical-history'),
    getPrescriptions: () => api.get('/patients/prescriptions'),
};

export const doctorAPI = {
    getAll: (params?: any) => api.get('/doctors', { params }),
    getById: (id: string) => api.get(`/doctors/${id}`),
    getProfile: () => api.get('/doctors/me/profile'),
    updateProfile: (data: any) => api.put('/doctors/me/profile', data),
    getAppointments: () => api.get('/doctors/me/appointments'),
    getAvailability: () => api.get('/doctors/me/availability'),
    addAvailability: (data: any) => api.post('/doctors/me/availability', data),
    deleteAvailability: (id: string) => api.delete(`/doctors/me/availability/${id}`),
    getPatientHistory: (patientId: string) => api.get(`/doctors/patient-history/${patientId}`),
    getAvailabilityById: (doctorId: string) => api.get(`/doctors/${doctorId}/availability`),
};

export const appointmentAPI = {
    create: (data: any) => api.post('/appointments', data),
    getById: (id: string) => api.get(`/appointments/${id}`),
    updateStatus: (id: string, status: string) => api.patch(`/appointments/${id}/status`, { status }),
    cancel: (id: string, reason: string) => api.post(`/appointments/${id}/cancel`, { reason }),
    reschedule: (id: string, data: any) => api.post(`/appointments/${id}/reschedule`, data),
    addMedicalRecord: (id: string, data: any) => api.post(`/appointments/${id}/medical-record`, data),
};

export const adminAPI = {
    getStats: () => api.get('/admin/stats'),
    getUsers: (role?: string) => api.get('/admin/users', { params: { role } }),
    getPendingDoctors: () => api.get('/admin/doctors/pending'),
    approveDoctor: (id: string) => api.post(`/admin/doctors/${id}/approve`),
    deactivateUser: (id: string) => api.post(`/admin/users/${id}/deactivate`),
    activateUser: (id: string) => api.post(`/admin/users/${id}/activate`),
    getHealthArticles: () => api.get('/admin/health-articles'),
    createHealthArticle: (data: any) => api.post('/admin/health-articles', data),
    updateHealthArticle: (id: string, data: any) => api.put(`/admin/health-articles/${id}`, data),
    deleteHealthArticle: (id: string) => api.delete(`/admin/health-articles/${id}`),
};

export const videoAPI = {
    getToken: (appointmentId: string) => api.post('/video/token', { appointmentId }),
    endCall: (appointmentId: string) => api.post('/video/end-call', { appointmentId }),
};

export const healthArticlesAPI = {
    getAll: (category?: string) => api.get('/health-articles', { params: { category } }),
    getById: (id: string) => api.get(`/health-articles/${id}`),
};

export const searchAPI = {
    searchPatients: (query: string) => api.get('/search/patients', { params: { q: query } }),
    getPatientOverview: (patientId: string) => api.get(`/search/patients/${patientId}/overview`),
};

