const resolveUserApiBaseUrl = () => {
  const raw =
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
