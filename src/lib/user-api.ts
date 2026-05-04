export const resolveUserApiBaseUrl = () => {
  const runtimeUrl =
    typeof window !== "undefined" &&
    typeof (window as Window & { __API_CONFIG__?: Record<string, string> }).__API_CONFIG__?.VITE_USERS_API_BASE_URL === "string" &&
    (window as Window & { __API_CONFIG__?: Record<string, string> }).__API_CONFIG__!.VITE_USERS_API_BASE_URL !== "__VITE_USERS_API_BASE_URL__"
      ? (window as Window & { __API_CONFIG__?: Record<string, string> }).__API_CONFIG__!.VITE_USERS_API_BASE_URL
      : "";

  const raw =
    runtimeUrl ||
    import.meta.env.VITE_USERS_API_BASE_URL ||
    import.meta.env.VITE_API_BASE_URL ||
    import.meta.env.VITE_API_URL ||
    "";

  const trimmed = raw.trim().replace(/\/+$/, "");
  let normalized = trimmed.endsWith("/api") ? trimmed.slice(0, -4) : trimmed;

  if (normalized && !/^https?:\/\//i.test(normalized)) {
    normalized = `https://${normalized}`;
  }

  if (
    typeof window !== "undefined" &&
    window.location.protocol === "https:" &&
    normalized.startsWith("http://")
  ) {
    return normalized.replace("http://", "https://");
  }

  return normalized;
};

const API_BASE_URL = resolveUserApiBaseUrl();

const getAuthHeaders = (): HeadersInit => {
  const token = localStorage.getItem("auth_token");
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

export const createUserInDatabase = async (
  name: string,
  email: string,
  password: string,
  phone?: string,
  city?: string,
  address?: string,
  role?: 'user' | 'admin' | 'worker'
): Promise<{ success: boolean; userId?: string; error?: string }> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/users/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name,
        email,
        password,
        phone,
        city,
        address,
        role: role || 'user',
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      return {
        success: false,
        error: error.error || `Error ${response.status}`,
      };
    }

    const data = await response.json();
    return {
      success: true,
      userId: data.userId || data.user?.id,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
};

export interface AdminUserRecord {
  id: string;
  name: string;
  email: string;
  phone?: string;
  city?: string;
  address?: string;
  role: 'user' | 'admin' | 'worker';
}

export const fetchAdminUsers = async (): Promise<{ users: AdminUserRecord[]; totalUsers: number }> => {
  const response = await fetch(`${API_BASE_URL}/api/users/admin/users`, {
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error || `Error ${response.status}`);
  }

  return response.json();
};

export const fetchAdminUserStats = async (): Promise<{
  totalUsers: number;
  totalByRole: { admin: number; worker: number; user: number };
}> => {
  const response = await fetch(`${API_BASE_URL}/api/users/admin/stats`, {
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error || `Error ${response.status}`);
  }

  return response.json();
};

export const createAdminUserInDatabase = async (
  name: string,
  email: string,
  password: string,
  phone?: string,
  city?: string,
  address?: string,
  role?: 'user' | 'admin' | 'worker'
): Promise<{ success: boolean; userId?: string; error?: string }> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/users/admin/users`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({
        name,
        email,
        password,
        phone,
        city,
        address,
        role: role || 'user',
      }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      return {
        success: false,
        error: error.error || `Error ${response.status}`,
      };
    }

    const data = await response.json();
    return {
      success: true,
      userId: String(data.user?.id || ""),
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
};

export const deleteAdminUserFromDatabase = async (userId: string): Promise<void> => {
  const response = await fetch(`${API_BASE_URL}/api/users/admin/users/${encodeURIComponent(userId)}`, {
    method: "DELETE",
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error || `Error ${response.status}`);
  }
};
