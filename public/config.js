// This file is loaded in index.html before the React app.
// The __*__ placeholders are replaced at runtime by the Railway start command.
window.__API_CONFIG__ = {
  VITE_USERS_API_BASE_URL: '__VITE_USERS_API_BASE_URL__',
  VITE_PRODUCTS_API_BASE_URL: '__VITE_PRODUCTS_API_BASE_URL__',
  VITE_MESSAGING_API_BASE_URL: '__VITE_MESSAGING_API_BASE_URL__',
  VITE_ORDERS_API_BASE_URL: '__VITE_ORDERS_API_BASE_URL__',
  VITE_ADMIN_API_BASE_URL: '__VITE_ADMIN_API_BASE_URL__',
};
// Legacy alias kept for backwards compatibility
window.__MESSAGING_API_BASE_URL__ = '__VITE_MESSAGING_API_BASE_URL__';
