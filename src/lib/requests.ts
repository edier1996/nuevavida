import type { DonationStatus } from "./mock-data";

export type NeedLevel = "alta" | "media" | "baja";

export type RequestStatus = "pending" | "in_review" | "selected" | "rejected" | "delivered";

export interface ProductRequest {
  id: string;
  productId: string;
  productTitle: string;
  productCity?: string;
  requesterId: string;
  requesterName: string;
  requesterEmail: string;
  requesterPhone?: string;
  requesterCity?: string;
  householdSize?: string;
  needLevel: NeedLevel;
  reason: string;
  intendedUse?: string;
  pickupWindow: string;
  extraNotes?: string;
  evidence?: string;
  createdAt: string;
  status: RequestStatus;
  score: number;
  scoreBreakdown: {
    firstTime: number;
    need: number;
    repeatPenalty: number;
    proximity: number;
    household: number;
  };
}

// ─── Admin API base URL resolution ───────────────────────────────────────────

const resolveAdminApiBaseUrl = () => {
  const raw =
    import.meta.env.VITE_ADMIN_API_BASE_URL ||
    import.meta.env.VITE_API_BASE_URL ||
    import.meta.env.VITE_API_URL ||
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

const ADMIN_API_BASE_URL = resolveAdminApiBaseUrl();

const getAuthHeaders = (): HeadersInit => {
  const token = localStorage.getItem("auth_token");
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

// ─── API functions ────────────────────────────────────────────────────────────

const fetchRequestsFromAPI = async (): Promise<ProductRequest[]> => {
  const response = await fetch(`${ADMIN_API_BASE_URL}/api/admin/requests`, {
    headers: getAuthHeaders(),
  });
  if (!response.ok) {
    throw new Error(`Error al cargar solicitudes: ${response.status}`);
  }
  const data = await response.json();
  return Array.isArray(data) ? data : [];
};

const createRequestInAPI = async (payload: ProductRequest): Promise<ProductRequest> => {
  const response = await fetch(`${ADMIN_API_BASE_URL}/api/admin/requests`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    throw new Error(`Error al crear solicitud: ${response.status}`);
  }
  return response.json();
};

const updateRequestStatusInAPI = async (id: string, status: RequestStatus): Promise<ProductRequest> => {
  const response = await fetch(`${ADMIN_API_BASE_URL}/api/admin/requests/${encodeURIComponent(id)}`, {
    method: "PUT",
    headers: getAuthHeaders(),
    body: JSON.stringify({ status }),
  });
  if (!response.ok) {
    throw new Error(`Error al actualizar solicitud: ${response.status}`);
  }
  return response.json();
};

const deleteRequestInAPI = async (id: string): Promise<void> => {
  const response = await fetch(`${ADMIN_API_BASE_URL}/api/admin/requests/${encodeURIComponent(id)}`, {
    method: "DELETE",
    headers: getAuthHeaders(),
  });
  if (!response.ok) {
    throw new Error(`Error al eliminar solicitud: ${response.status}`);
  }
};

// ─── localStorage helpers ─────────────────────────────────────────────────────

const REQUESTS_KEY = "product_requests";
const PRODUCTS_KEY = "products";

const persistRequests = (list: ProductRequest[]) => {
  localStorage.setItem(REQUESTS_KEY, JSON.stringify(list));
};

const getRequestsFromLocalStorage = (): ProductRequest[] => {
  try {
    const raw = localStorage.getItem(REQUESTS_KEY);
    if (!raw) return [];
    const parsed: ProductRequest[] = JSON.parse(raw);
    return parsed.map((req) => ({
      ...req,
      score: typeof req.score === "number" ? req.score : 0,
    }));
  } catch {
    return [];
  }
};

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Returns all requests. Tries the backend API first; falls back to
 * localStorage if the API is unreachable. Successful API responses are
 * cached in localStorage for offline resilience.
 */
export const getRequests = async (): Promise<ProductRequest[]> => {
  try {
    const requests = await fetchRequestsFromAPI();
    // Garantiza que siempre haya score numérico y cachea en localStorage
    const normalised = requests.map((req) => ({
      ...req,
      score: typeof req.score === "number" ? req.score : 0,
    }));
    persistRequests(normalised);
    return normalised;
  } catch {
    // API no disponible — usar caché local
    return getRequestsFromLocalStorage();
  }
};

const updateProductDonationStatus = (productId: string, status: DonationStatus) => {
  try {
    const raw = localStorage.getItem(PRODUCTS_KEY);
    if (!raw) return;
    const list = JSON.parse(raw);
    const updated = list.map((p: any) =>
      p.id === productId ? { ...p, donationStatus: status } : p
    );
    localStorage.setItem(PRODUCTS_KEY, JSON.stringify(updated));
  } catch {
    // no-op si falla
  }
};

const computeScore = (
  needLevel: NeedLevel,
  requesterId: string,
  requesterCity: string | undefined,
  productCity: string | undefined,
  householdSize?: string,
  existingRequests?: ProductRequest[]
) => {
  const history = (existingRequests ?? []).filter((r) => r.requesterId === requesterId);
  const firstTime = history.length === 0 ? 20 : 0;
  const need = needLevel === "alta" ? 40 : needLevel === "media" ? 25 : 10;
  const deliveredCount = history.filter((r) => r.status === "delivered" || r.status === "selected").length;
  const repeatPenalty = deliveredCount > 0 ? -15 : 0;
  const proximity =
    requesterCity &&
    productCity &&
    requesterCity.trim().toLowerCase() === productCity.trim().toLowerCase()
      ? 10
      : 0;
  const householdNumber = Number(householdSize);
  const household = isNaN(householdNumber)
    ? 0
    : householdNumber >= 4
    ? 10
    : householdNumber >= 2
    ? 5
    : 0;

  const score = firstTime + need + repeatPenalty + proximity + household;
  return {
    score,
    breakdown: { firstTime, need, repeatPenalty, proximity, household },
  };
};

/**
 * Creates a new product request.
 * Saves to the backend API first; falls back to localStorage if the API fails.
 */
export const addRequest = async (
  payload: Omit<ProductRequest, "id" | "createdAt" | "status" | "score" | "scoreBreakdown">
): Promise<ProductRequest> => {
  // Use cached local requests to compute score without an extra async call
  const existing = getRequestsFromLocalStorage();
  const { score, breakdown } = computeScore(
    payload.needLevel,
    payload.requesterId,
    payload.requesterCity,
    payload.productCity,
    payload.householdSize,
    existing
  );

  const newRequest: ProductRequest = {
    ...payload,
    id: `req-${Date.now()}`,
    createdAt: new Date().toISOString(),
    status: "pending",
    score,
    scoreBreakdown: breakdown,
  };

  try {
    const created = await createRequestInAPI(newRequest);
    // Refresh local cache
    const updated = [created, ...existing.filter((r) => r.id !== created.id)];
    persistRequests(updated);
    return created;
  } catch {
    // API unavailable — persist locally as fallback
    const updated = [newRequest, ...existing];
    persistRequests(updated);
    return newRequest;
  }
};

/**
 * Updates the status of a request.
 * Updates the backend API first; falls back to localStorage if the API fails.
 */
export const updateRequestStatus = async (id: string, status: RequestStatus): Promise<ProductRequest[]> => {
  const list = getRequestsFromLocalStorage();
  const request = list.find((r) => r.id === id);
  if (!request) return list;

  try {
    await updateRequestStatusInAPI(id, status);
  } catch {
    // API unavailable — continue with local-only update
  }

  const updated = list.map((r) => {
    if (r.id === id) {
      return { ...r, status };
    }
    // Si se selecciona un beneficiario, los demás postulantes del producto quedan rechazados
    if (status === "selected" && r.productId === request.productId && r.id !== id) {
      return { ...r, status: r.status === "delivered" ? r.status : ("rejected" as RequestStatus) };
    }
    return r;
  });

  persistRequests(updated);

  if (status === "selected") {
    updateProductDonationStatus(request.productId, "en_proceso");
  }
  if (status === "delivered") {
    updateProductDonationStatus(request.productId, "entregado");
  }

  return updated;
};

export { deleteRequestInAPI };

export const getRequestsByProduct = async (productId: string): Promise<ProductRequest[]> => {
  const all = await getRequests();
  return all
    .filter((r) => r.productId === productId)
    .sort((a, b) => b.score - a.score || new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
};
