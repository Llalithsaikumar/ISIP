import axios from 'axios';

// Vite proxy resolves '/api' requests locally to localhost:8000 in development.
// For production, we can define VITE_API_URL.
const API_BASE_URL = import.meta.env.VITE_API_URL || '/api/v1';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000, // 15 seconds timeout
});

export default apiClient;
