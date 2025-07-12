// Environment configuration
export const config = {
  // API Configuration
  api: {
    baseUrl: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
    timeout: 10000,
  },
  
  // App Configuration
  app: {
    name: 'ReWear',
    version: '1.0.0',
    description: 'Community Clothing Exchange Platform',
  },
  
  // Feature flags
  features: {
    imageUpload: true,
    adminPanel: true,
    notifications: true,
  },
  
  // Pagination defaults
  pagination: {
    defaultPageSize: 12,
    maxPageSize: 50,
  },
}; 