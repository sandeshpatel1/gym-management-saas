import axiosClient from './axiosClient';

export const getCompaniesApi = () => axiosClient.get('/companies').then((r) => r.data);
export const createCompanyApi = (payload) =>
  axiosClient.post('/companies', payload).then((r) => r.data);
export const updateCompanyApi = (id, payload) =>
  axiosClient.put(`/companies/${id}`, payload).then((r) => r.data);
export const setCompanyStatusApi = (id, isActive) =>
  axiosClient.patch(`/companies/${id}/status`, { isActive }).then((r) => r.data);
export const getUpiQrPreviewApi = (companyId, amount, note) =>
  axiosClient
    .get(`/companies/${companyId}/upi-qr`, { params: { amount, note }, responseType: 'blob' })
    .then((r) => r.data);

// --- Multi-branch ---
export const getMyBranchesApi = () => axiosClient.get('/companies/my-branches').then((r) => r.data);
export const removeBranchApi = (companyId) =>
  axiosClient.delete(`/companies/branches/${companyId}`).then((r) => r.data);
// Superadmin only - onboard a new branch and link it to an existing owner.
export const createBranchForOwnerApi = (payload) =>
  axiosClient.post('/companies/branches', payload).then((r) => r.data);