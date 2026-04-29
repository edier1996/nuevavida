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

const REQUESTS_KEY = "product_requests";
const PRODUCTS_KEY = "products";

const persistRequests = (list: ProductRequest[]) => {
  localStorage.setItem(REQUESTS_KEY, JSON.stringify(list));
};

export const getRequests = (): ProductRequest[] => {
  try {
    const raw = localStorage.getItem(REQUESTS_KEY);
    if (!raw) return [];
    const parsed: ProductRequest[] = JSON.parse(raw);
    // Garantiza que siempre haya score numérico
    return parsed.map((req) => ({
      ...req,
      score: typeof req.score === "number" ? req.score : 0,
    }));
  } catch {
    return [];
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
  householdSize?: string
) => {
  const history = getRequests().filter((r) => r.requesterId === requesterId);
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

export const addRequest = (payload: Omit<ProductRequest, "id" | "createdAt" | "status" | "score" | "scoreBreakdown">) => {
  const { score, breakdown } = computeScore(
    payload.needLevel,
    payload.requesterId,
    payload.requesterCity,
    payload.productCity,
    payload.householdSize
  );

  const newRequest: ProductRequest = {
    ...payload,
    id: `req-${Date.now()}`,
    createdAt: new Date().toISOString(),
    status: "pending",
    score,
    scoreBreakdown: breakdown,
  };

  const current = getRequests();
  const updated = [newRequest, ...current];
  persistRequests(updated);
  return newRequest;
};

export const updateRequestStatus = (id: string, status: RequestStatus) => {
  const list = getRequests();
  const request = list.find((r) => r.id === id);
  if (!request) return list;

  const updated = list.map((r) => {
    if (r.id === id) {
      return { ...r, status };
    }
    // Si se selecciona un beneficiario, los demás postulantes del producto quedan rechazados
    if (status === "selected" && r.productId === request.productId && r.id !== id) {
      return { ...r, status: r.status === "delivered" ? r.status : "rejected" };
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

export const getRequestsByProduct = (productId: string) =>
  getRequests()
    .filter((r) => r.productId === productId)
    .sort((a, b) => b.score - a.score || new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
