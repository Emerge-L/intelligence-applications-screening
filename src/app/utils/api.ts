import { projectId, publicAnonKey } from '../../../utils/supabase/info';
// ── Points to the NEW "server" Edge Function ──────────────
const BASE_URL = `https://${projectId}.supabase.co/functions/v1/server`;

interface FetchOptions extends RequestInit {
  body?: any;
}

async function fetchAPI(endpoint: string, options: FetchOptions = {}) {
  const { body, ...restOptions } = options;

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    ...restOptions,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${publicAnonKey}`,
      ...restOptions.headers,
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(error.error || `HTTP ${response.status}`);
  }

  return response.json();
}

export const api = {
  // ── Vacancies ────────────────────────────────────────────
  /** Fetch all active vacancies from Supabase */
  getVacancies: () => fetchAPI('/vacancies'),

  /** Fetch a single vacancy by ID */
  getVacancy: (id: string) => fetchAPI(`/vacancies/${id}`),

  // ── File Handling ─────────────────────────────────────────
  /** Upload a CV or cover letter file to Supabase Storage */
  uploadFile: async (file: File, applicationId: string, fileType: string) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('applicationId', applicationId);
    formData.append('fileType', fileType);

    const response = await fetch(`${BASE_URL}/upload-file`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${publicAnonKey}` },
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(error.error || `HTTP ${response.status}`);
    }

    return response.json();
  },

  /** Extract plain text from an uploaded file (txt / basic doc support) */
  extractText: async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${BASE_URL}/extract-text`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${publicAnonKey}` },
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(error.error || `HTTP ${response.status}`);
    }

    return response.json();
  },

  // ── Applications ──────────────────────────────────────────
  /** Submit a single application — triggers AI CV parsing + screening */
  submitApplication: (data: {
    vacancyId: string;
    applicantData: { fullName: string; email: string; phone: string };
    knockoutAnswers: string[];
    cvText: string;
  }) =>
    fetchAPI('/applications', { method: 'POST', body: data }),

  /** Bulk-submit multiple applications at once */
  bulkUploadApplications: (data: { applications: any[] }) =>
    fetchAPI('/applications/bulk', { method: 'POST', body: data }),

  /** Fetch all applications for a specific vacancy */
  getVacancyApplications: (vacancyId: string) =>
    fetchAPI(`/vacancies/${vacancyId}/applications`),

  /** Fetch full details of a single application */
  getApplication: (id: string) => fetchAPI(`/applications/${id}`),

  // ── Analytics ─────────────────────────────────────────────
  /** Fetch aggregated analytics for a specific vacancy */
  getVacancyAnalytics: (vacancyId: string) =>
    fetchAPI(`/vacancies/${vacancyId}/analytics`),
};