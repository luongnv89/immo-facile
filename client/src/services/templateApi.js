import api from './api';

// Get all templates
export const getAllTemplates = async () => {
  const response = await api.get('/templates');
  return response.data;
};

// Get template by ID
export const getTemplateById = async (id) => {
  const response = await api.get(`/templates/${id}`);
  return response.data;
};

// Get default template
export const getDefaultTemplate = async () => {
  const response = await api.get('/templates/default');
  return response.data;
};

// Create new template
export const createTemplate = async (templateData) => {
  const config = {};
  
  // If templateData is FormData, set appropriate headers
  if (templateData instanceof FormData) {
    config.headers = {
      'Content-Type': 'multipart/form-data',
    };
  }
  
  const response = await api.post('/templates', templateData, config);
  return response.data;
};

// Update template
export const updateTemplate = async (id, templateData) => {
  const config = {};
  
  // If templateData is FormData, set appropriate headers
  if (templateData instanceof FormData) {
    config.headers = {
      'Content-Type': 'multipart/form-data',
    };
  }
  
  const response = await api.put(`/templates/${id}`, templateData, config);
  return response.data;
};

// Delete template
export const deleteTemplate = async (id) => {
  const response = await api.delete(`/templates/${id}`);
  return response.data;
};

// Set template as default
export const setDefaultTemplate = async (id) => {
  const response = await api.post(`/templates/${id}/set-default`);
  return response.data;
};

// Upload background image
export const uploadBackground = async (id, file) => {
  const formData = new FormData();
  formData.append('background', file);
  
  const response = await api.post(`/templates/${id}/upload-background`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};
