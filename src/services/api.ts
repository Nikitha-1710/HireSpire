import { Job, Application, Interview, NotificationItem, Company } from '../types';

const TOKEN_KEY = 'hr_auth_token';

export function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setStoredToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function removeStoredToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getStoredToken();
  const headers = new Headers(options.headers || {});

  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(`/api${endpoint}`, {
    ...options,
    headers,
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || 'Request failed');
  }
  return data;
}

export const api = {
  // Auth
  registerCandidate: (data: any) => request<any>('/auth/register-candidate', { method: 'POST', body: JSON.stringify(data) }),
  registerHr: (data: any) => request<any>('/auth/register-hr', { method: 'POST', body: JSON.stringify(data) }),
  login: (data: any) => request<any>('/auth/login', { method: 'POST', body: JSON.stringify(data) }),
  getMe: () => request<any>('/auth/me'),

  // Candidate Profile & Resume
  getCandidateProfile: () => request<any>('/candidate/profile'),
  updateCandidateProfile: (data: any) => request<any>('/candidate/profile', { method: 'PUT', body: JSON.stringify(data) }),
  uploadResume: (data: { file_name: string; file_data: string; file_size?: number }) =>
    request<any>('/candidate/resume', { method: 'POST', body: JSON.stringify(data) }),

  // Jobs
  getJobs: (params?: Record<string, string>) => {
    const qs = params ? '?' + new URLSearchParams(params).toString() : '';
    return request<{ jobs: Job[]; total: number }>(`/jobs${qs}`);
  },
  getHrJobs: (params?: Record<string, string>) => {
    const qs = params ? '?' + new URLSearchParams(params).toString() : '';
    return request<{ jobs: Job[]; total: number }>(`/hr/jobs${qs}`);
  },
  getJob: (id: string) => request<{ job: Job }>(`/jobs/${id}`),
  createJob: (data: any) => request<any>('/jobs', { method: 'POST', body: JSON.stringify(data) }),
  updateJob: (id: string, data: any) => request<any>(`/jobs/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteJob: (id: string) => request<any>(`/jobs/${id}`, { method: 'DELETE' }),

  // Applications
  applyToJob: (jobId: string) => request<any>(`/jobs/${jobId}/apply`, { method: 'POST' }),
  getCandidateApplications: () => request<{ applications: Application[]; total: number }>('/candidate/applications'),
  getHrApplications: (params?: Record<string, string>) => {
    const qs = params ? '?' + new URLSearchParams(params).toString() : '';
    return request<{ applications: Application[]; total: number }>(`/hr/applications${qs}`);
  },
  updateApplicationStatus: (appId: string, status: string) =>
    request<any>(`/hr/applications/${appId}/status`, { method: 'PUT', body: JSON.stringify({ status }) }),

  // Interviews
  getInterviews: () => request<{ interviews: Interview[]; total: number }>('/interviews'),
  scheduleInterview: (data: any) => request<any>('/interviews', { method: 'POST', body: JSON.stringify(data) }),
  updateInterview: (id: string, data: any) => request<any>(`/interviews/${id}`, { method: 'PUT', body: JSON.stringify(data) }),

  // Notifications
  getNotifications: () => request<{ notifications: NotificationItem[]; unreadCount: number }>('/notifications'),
  markNotificationRead: (id: string) => request<any>(`/notifications/${id}/read`, { method: 'PUT' }),
  markAllNotificationsRead: () => request<any>('/notifications/read-all', { method: 'PUT' }),

  // Company
  getCompany: () => request<{ company: Company }>('/company'),
  updateCompany: (data: any) => request<any>('/company', { method: 'PUT', body: JSON.stringify(data) }),
  switchCompany: (company_id: string) =>
    request<any>('/hr/switch-company', { method: 'POST', body: JSON.stringify({ company_id }) }),
  getCompaniesList: (params?: Record<string, string>) => {
    const qs = params ? '?' + new URLSearchParams(params).toString() : '';
    return request<{ companies: Company[] }>(`/companies${qs}`);
  },
  getPublicCompany: (companyId: string) => request<{ company: Company }>(`/companies/${companyId}`),

  // Dashboards
  getCandidateDashboard: () => request<any>('/candidate/dashboard'),
  getHrDashboard: () => request<any>('/hr/dashboard'),
};
