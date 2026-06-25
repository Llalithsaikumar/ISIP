import apiClient from './api';

export const queryAssistant = async (question) => {
  const response = await apiClient.post('/chat/query', { question });
  return response.data;
};

export const uploadSafetyDocument = async (file) => {
  const formData = new FormData();
  formData.append('file', file);
  
  const response = await apiClient.post('/chat/upload-document', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
    timeout: 60000, // 60 seconds for larger manuals upload and chunking
  });
  return response.data;
};
