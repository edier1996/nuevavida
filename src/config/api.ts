// Determine messaging API base URL at runtime
// This allows the URL to be set via Railway environment variables without rebuilding
export const getMessagingApiBaseUrl = (): string => {
  // Try to get from window.__MESSAGING_API_BASE_URL__ (injected by HTML)
  if (typeof window !== 'undefined' && (window as any).__MESSAGING_API_BASE_URL__) {
    return (window as any).__MESSAGING_API_BASE_URL__;
  }

  // Fallback: construct from current domain
  // If frontend is at https://grateful-nurturing-production-21e5.up.railway.app
  // Then messaging service is at https://messaging-service-production-1fb5.up.railway.app
  if (typeof window !== 'undefined' && window.location.hostname.includes('up.railway.app')) {
    // Extract the base domain and replace service name
    const hostname = window.location.hostname;
    const baseUrl = hostname.replace(/^[^-]+-[^-]+-[^-]+-[^-]+/, 'messaging-service-production-1fb5');
    return `https://${baseUrl}`;
  }

  // Fallback for development
  return 'http://localhost:5005';
};
