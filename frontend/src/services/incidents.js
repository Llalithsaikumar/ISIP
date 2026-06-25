import apiClient from './api';

export const getIncidents = async () => {
  const response = await apiClient.get('/incidents/');
  return response.data;
};

export const getIncidentById = async (id) => {
  const response = await apiClient.get(`/incidents/${id}`);
  return response.data;
};

export const createIncident = async (incidentData) => {
  const response = await apiClient.post('/incidents/', incidentData);
  return response.data;
};

export const updateIncidentStatus = async (id, status, mitigationAction) => {
  const response = await apiClient.put(`/incidents/${id}/status`, {
    status,
    mitigation_action: mitigationAction,
  });
  return response.data;
};

export const getDashboardMetrics = async () => {
  const response = await apiClient.get('/incidents/metrics');
  return response.data;
};

export const generateAIReport = async (reportRequest) => {
  const response = await apiClient.post('/incidents/ai-report', reportRequest);
  return response.data;
};

export const analyzeRootCause = async (rcaRequest) => {
  const response = await apiClient.post('/incidents/rca', rcaRequest);
  return response.data;
};

