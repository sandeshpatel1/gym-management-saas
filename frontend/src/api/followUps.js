import axiosClient from './axiosClient';

export const getFollowUpSummaryApi = () =>
  axiosClient.get('/follow-ups/summary').then((r) => r.data);

export const getFollowUpListApi = (type) =>
  axiosClient.get('/follow-ups', { params: type ? { type } : undefined }).then((r) => r.data);

export const createFollowUpApi = (payload) =>
  axiosClient.post('/follow-ups', payload).then((r) => r.data);

export const getMemberFollowUpsApi = (memberId) =>
  axiosClient.get(`/follow-ups/member/${memberId}`).then((r) => r.data);