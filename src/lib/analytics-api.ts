const resolveApiBaseUrl = () => {
  const raw =
    import.meta.env.VITE_ANALYTICS_API_BASE_URL ||
    import.meta.env.VITE_API_BASE_URL ||
    import.meta.env.VITE_API_URL ||
    import.meta.env.PUBLIC_API_URL ||
    "";

  const trimmed = raw.trim().replace(/\/+$/, "");
  const normalized = trimmed.endsWith("/api") ? trimmed.slice(0, -4) : trimmed;

  if (
    typeof window !== "undefined" &&
    window.location.protocol === "https:" &&
    normalized.startsWith("http://")
  ) {
    return normalized.replace("http://", "https://");
  }

  return normalized;
};

const API_BASE_URL = resolveApiBaseUrl();

const getAuthHeaders = (): Record<string, string> => {
  const token = localStorage.getItem("auth_token");
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

export type AnalyticsEventType =
  | "product_view"
  | "product_request"
  | "message_sent"
  | "user_login"
  | "user_register"
  | "page_view"
  | string;

export interface AnalyticsPayload {
  eventType: AnalyticsEventType;
  userId?: string;
  productId?: string;
  metadata?: Record<string, unknown>;
}

export const trackEvent = async (
  eventType: AnalyticsEventType,
  userId?: string,
  productId?: string,
  metadata?: Record<string, unknown>
): Promise<void> => {
  const payload: AnalyticsPayload = {
    eventType,
    userId,
    productId,
    metadata,
  };

  try {
    const response = await fetch(`${API_BASE_URL}/api/analytics/track`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      // Analytics failures are non-critical — log but don't throw
      console.warn(
        `Analytics track failed (${response.status}):`,
        eventType
      );
    }
  } catch (err) {
    // Network errors are non-critical for analytics
    console.warn("Analytics track error:", err);
  }
};
