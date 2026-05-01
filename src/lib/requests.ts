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

const resolveApiBaseUrl = () => {
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

const API_BASE_URL = resolveApiBaseUrl();

type ApiRequest = ProductRequest & Record<string, unknown>;

const toProductRequest = (item: ApiRequest): ProductRequest => ({
  id: String(item.id),
  productId: String(item.productId),
  productTitle: item.productTitle,
  productCity: item.productCity,
  requesterId: String(item.requesterId),
  requesterName: item.requesterName,
  requesterEmail: item.requesterEmail,
  requesterPhone: item.requesterPhone,
  requesterCity: item.requesterCity,
  householdSize: item.householdSize,
  needLevel: item.needLevel,
  reason: item.reason,
  intendedUse: item.intendedUse,
  pickupWindow: item.pickupWindow,
  extraNotes: item.extraNotes,
  evidence: item.evidence,
  createdAt: item.createdAt,
  status: item.status,
  score: typeof item.score === "number" ? item.score : 0,
  scoreBreakdown: item.scoreBreakdown ?? {
    firstTime: 0,
    need: 0,
    repeatPenalty: 0,
    proximity: 0,
    household: 0,
  },
});

export const getRequests = async (): Promise<ProductRequest[]> => {
  const response = await fetch(`${API_BASE_URL}/api/requests`);
  if (!response.ok) {
    throw new Error("No se pudieron cargar las solicitudes");
  }
  const data = (await response.json()) as ApiRequest[];
  return data.map(toProductRequest);
};

export const addRequest = async (
  payload: Omit<ProductRequest, "id" | "createdAt" | "status" | "score" | "scoreBreakdown">
): Promise<ProductRequest> => {
  const response = await fetch(`${API_BASE_URL}/api/requests`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const fallback = "No se pudo registrar la solicitud";
    let message = fallback;
    try {
      const data = await response.json();
      message =
        (typeof data?.error === "string" && data.error) ||
        (typeof data?.message === "string" && data.message) ||
        fallback;
    } catch {
      // Keep fallback if body is not JSON.
    }
    throw new Error(message);
  }

  const created = (await response.json()) as ApiRequest;
  return toProductRequest(created);
};

export const updateRequestStatus = async (
  id: string,
  status: RequestStatus
): Promise<ProductRequest[]> => {
  const response = await fetch(`${API_BASE_URL}/api/requests/${id}/status`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status }),
  });

  if (!response.ok) {
    throw new Error("No se pudo actualizar el estado de la solicitud");
  }

  return getRequests();
};

export const getRequestsByProduct = async (productId: string): Promise<ProductRequest[]> => {
  const all = await getRequests();
  return all
    .filter((r) => r.productId === productId)
    .sort(
      (a, b) =>
        b.score - a.score ||
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
};
