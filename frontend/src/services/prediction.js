import apiClient from './api';

export const evaluateRisk = async (predictionPayload) => {
  /**
   * payload format:
   * {
   *   category: string,
   *   department: string,
   *   severity: string,
   *   likelihood: string
   * }
   */
  const response = await apiClient.post('/prediction/evaluate', predictionPayload);
  return response.data;
};
