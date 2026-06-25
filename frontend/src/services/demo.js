import apiClient from './api';

/**
 * Fetch available demo scenarios metadata.
 */
export const getDemoScenarios = async () => {
  const response = await apiClient.get('/demo/scenarios');
  return response.data;
};

/**
 * Execute a specific demo scenario.
 * Returns generated telemetry, alerts, incident report, and database logging info.
 */
export const runDemoScenario = async (scenario) => {
  const response = await apiClient.post('/demo/run', { scenario });
  return response.data;
};
