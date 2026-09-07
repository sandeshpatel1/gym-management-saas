import axiosClient from './axiosClient';

export const markAttendanceApi = (memberId, date) =>
  axiosClient.post('/attendance', { memberId, date }).then((r) => r.data);
export const getAttendanceByDateApi = (date) =>
  axiosClient.get('/attendance', { params: { date } }).then((r) => r.data);
export const getMemberAttendanceHistoryApi = (memberId) =>
  axiosClient.get(`/attendance/member/${memberId}`).then((r) => r.data);
