// This file is loaded in index.html before the React app.
// The __*__ placeholders are replaced at runtime by the Railway start command (start.sh).
// Hard-coded fallbacks ensure the app works even if env vars are not set.
window.__API_CONFIG__ = {
  VITE_USERS_API_BASE_URL: 'https://humorous-essence-production-cf27.up.railway.app',
  VITE_PRODUCTS_API_BASE_URL: 'https://nuevavida-production.up.railway.app',
  VITE_MESSAGING_API_BASE_URL: 'https://messaging-service-production-1fb5.up.railway.app',
  VITE_ORDERS_API_BASE_URL: 'https://order-service-production-3512.up.railway.app',
  VITE_ADMIN_API_BASE_URL: '',
};
// Legacy alias kept for backwards compatibility
window.__MESSAGING_API_BASE_URL__ = window.__API_CONFIG__.VITE_MESSAGING_API_BASE_URL;
