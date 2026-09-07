import axiosClient from './axiosClient';

export const getPlatformStatsApi = () => axiosClient.get('/reports/platform').then((r) => r.data);
export const getDashboardStatsApi = () => axiosClient.get('/reports/dashboard').then((r) => r.data);
export const getRevenueReportApi = (from, to) =>
  axiosClient.get('/reports/revenue', { params: { from, to } }).then((r) => r.data);

// PDF exports return a blob and trigger a browser download
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

export const exportRevenuePdf = (from, to) =>
  downloadBlob(
    `/reports/revenue/export?${from ? `from=${from}&` : ''}${to ? `to=${to}` : ''}`,
    'revenue-report.pdf'
  );

export const exportMemberReportCard = (memberId, memberCode) =>
  downloadBlob(`/reports/member/${memberId}/export`, `${memberCode || 'member'}-report-card.pdf`);