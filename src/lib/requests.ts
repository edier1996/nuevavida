import type { DonationStatus } from "./mock-data";
import {
  fetchOrders,
  createOrder,
  updateOrder,
  getOrdersByProduct as apiGetOrdersByProduct,
} from "./orders-api";

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

// ---------------------------------------------------------------------------
// Local cache helpers (used as fallback when the API is unavailable)
// ---------------------------------------------------------------------------

const REQUESTS_KEY = "product_requests";
const PRODUCTS_KEY = "products";

const persistRequestsLocal = (list: ProductRequest[]) => {
  localStorage.setItem(REQUESTS_KEY, JSON.stringify(list));
};

const getRequestsLocal = (): ProductRequest[] => {
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

// ---------------------------------------------------------------------------
// Score computation (still done client-side for immediate feedback)
// ---------------------------------------------------------------------------

const computeScore = (
  needLevel: NeedLevel,
  requesterId: string,
  requesterCity: string | undefined,
  productCity: string | undefined,
  householdSize?: string
) => {
  const history = getRequestsLocal().filter((r) => r.requesterId === requesterId);
  const firstTime = history.length === 0 ? 20 : 0;
  const need = needLevel === "alta" ? 40 : needLevel === "media" ? 25 : 10;
  const deliveredCount = history.filter(
    (r) => r.status === "delivered" || r.status === "selected"
  ).length;
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

// ---------------------------------------------------------------------------
// Public API — each function tries the backend first, falls back to localStorage
// ---------------------------------------------------------------------------

export const getRequests = async (): Promise<ProductRequest[]> => {
  try {
    const orders = await fetchOrders();
    // Keep local cache in sync
    persistRequestsLocal(orders);
    return orders;
  } catch {
    // Backend unavailable — return local cache
    return getRequestsLocal();
  }
};

export const addRequest = async (
  payload: Omit<ProductRequest, "id" | "createdAt" | "status" | "score" | "scoreBreakdown">
): Promise<ProductRequest> => {
  const { score, breakdown } = computeScore(
    payload.needLevel,
    payload.requesterId,
    payload.requesterCity,
    payload.productCity,
    payload.householdSize
  );

  try {
    const created = await createOrder({
      ...payload,
      // Pass pre-computed score so the backend can store it
      score,
      scoreBreakdown: breakdown,
    } as any);

    // Sync local cache
    const current = getRequestsLocal();
    persistRequestsLocal([created, ...current]);
    return created;
  } catch {
    // Fallback: persist locally only
    const newRequest: ProductRequest = {
      ...payload,
      id: `req-${Date.now()}`,
      createdAt: new Date().toISOString(),
      status: "pending",
      score,
      scoreBreakdown: breakdown,
    };
    const current = getRequestsLocal();
    persistRequestsLocal([newRequest, ...current]);
    return newRequest;
  }
};

export const updateRequestStatus = async (
  id: string,
  status: RequestStatus
): Promise<ProductRequest[]> => {
  // Optimistically update local cache first
  const list = getRequestsLocal();
  const request = list.find((r) => r.id === id);
  if (!request) return list;

  const updated = list.map((r) => {
    if (r.id === id) return { ...r, status };
    if (
      status === "selected" &&
      r.productId === request.productId &&
      r.id !== id
    ) {
      return { ...r, status: r.status === "delivered" ? r.status : ("rejected" as RequestStatus) };
    }
    return r;
  });

  persistRequestsLocal(updated);

  if (status === "selected") updateProductDonationStatus(request.productId, "en_proceso");
  if (status === "delivered") updateProductDonationStatus(request.productId, "entregado");

  // Persist to backend (non-blocking)
  try {
    await updateOrder(id, { status });
  } catch {
    // Backend unavailable — local cache already updated
  }

  return updated;
};

export const getRequestsByProduct = async (
  productId: string
): Promise<ProductRequest[]> => {
  try {
    const orders = await apiGetOrdersByProduct(productId);
    return orders.sort(
      (a, b) =>
        b.score - a.score ||
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  } catch {
    return getRequestsLocal()
      .filter((r) => r.productId === productId)
      .sort(
        (a, b) =>
          b.score - a.score ||
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
  }
};
