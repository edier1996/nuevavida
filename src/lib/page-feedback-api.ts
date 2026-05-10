import { resolveUserApiBaseUrl } from "@/lib/user-api";

export interface PageFeedbackItem {
  id: number;
  userId: number;
  userName: string;
  userEmail?: string | null;
  rating: number;
  comment: string;
  createdAt: string;
}

export interface PageFeedbackResponse {
  reviews: PageFeedbackItem[];
  summary: {
    averageRating: number;
    total: number;
  };
}

const API_BASE_URL = resolveUserApiBaseUrl();

const getAuthHeaders = (): HeadersInit => {
  const token = localStorage.getItem("auth_token");
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

export const fetchPageFeedback = async (): Promise<PageFeedbackResponse> => {
  const response = await fetch(`${API_BASE_URL}/api/users/feedback`);

  if (!response.ok) {
    throw new Error("No se pudo cargar la calificacion de la pagina");
  }

  return response.json();
};

export const createPageFeedback = async (payload: {
  rating: number;
  comment: string;
}): Promise<{ review: PageFeedbackItem }> => {
  const response = await fetch(`${API_BASE_URL}/api/users/feedback`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data?.error || "No se pudo registrar tu comentario");
  }

  return response.json();
};
