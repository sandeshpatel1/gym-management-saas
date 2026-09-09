import axiosClient from './axiosClient';

export const getPaymentsApi = (params) => axiosClient.get('/payments', { params }).then((r) => r.data);
export const createPaymentApi = (payload) =>
  axiosClient.post('/payments', payload).then((r) => r.data);
export const getDuesApi = () => axiosClient.get('/payments/dues').then((r) => r.data);
export const collectDueApi = (paymentId, payload) =>
  axiosClient.post(`/payments/${paymentId}/collect`, payload).then((r) => r.data);
export const refundPaymentApi = (paymentId, payload) =>
  axiosClient.post(`/payments/${paymentId}/refund`, payload).then((r) => r.data);
export const logReminderApi = (paymentId) =>
  axiosClient.post(`/payments/${paymentId}/remind`).then((r) => r.data);

const downloadBlob = async (url, filename) => {
  const res = await axiosClient.get(url, { responseType: 'blob' });
  const blobUrl = window.URL.createObjectURL(new Blob([res.data]));
  const link = document.createElement('a');
  link.href = blobUrl;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  link.remove();
};

export const downloadPaymentInvoice = (paymentId, invoiceNumber) =>
  downloadBlob(`/payments/${paymentId}/invoice`, `${invoiceNumber || 'invoice'}.pdf`);

// Returns an object URL for inline <iframe>/<embed> preview — caller must
// revoke it (URL.revokeObjectURL) when the preview closes.
export const getPaymentInvoicePreviewUrl = async (paymentId) => {
  const res = await axiosClient.get(`/payments/${paymentId}/invoice`, { responseType: 'blob' });
  return window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
};