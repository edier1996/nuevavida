// Tipos de datos para el sistema de transacciones y envíos

export type TransactionStatus = 
  | "pending"          // Esperando pago
  | "paid"            // Pago confirmado
  | "seller_contacted"  // Vendedor contactado para recoger
  | "picked_up"       // Recogido por el servicio de envío
  | "in_transit"      // En camino
  | "delivered"       // Entregado
  | "cancelled"       // Cancelado
  | "returned";       // Devuelto

export interface ShippingInfo {
  id: string;
  transactionId: string;
  sellerId: string;
  buyerId: string;
  productId: string;

  // Dirección de recogida (vendedor)
  pickupCity: string;
  pickupAddress: string;
  pickupLatitude?: number;
  pickupLongitude?: number;
  pickupPostalCode?: string;

  // Dirección de entrega (comprador)
  deliveryCity: string;
  deliveryAddress: string;
  deliveryLatitude?: number;
  deliveryLongitude?: number;
  deliveryPostalCode?: string;

  // Cálculos
  estimatedDistanceKm: number;
  baseCostPerKm: number;          // Tarifa base por km
  baseCost: number;               // Costo base del envío
  platformCommission: number;     // 50% del costo base
  totalShippingCost: number;      // baseCost + platformCommission

  // Estado del envío
  trackingNumber?: string;
  carrier?: string;               // "correosdecolombia", "dhl", "servientrega"
  estimatedDeliveryDays: number;
  estimatedDeliveryDate?: string;
  actualDeliveryDate?: string;

  // Detalles del paquete
  packageWeight?: number;         // en gramos
  packageDimensions?: string;     // "30x20x15 cm"
  specialInstructions?: string;   // Instrucciones especiales

  timestamps: {
    created: string;
    paid?: string;
    sellerNotified?: string;
    pickedUp?: string;
    inTransit?: string;
    delivered?: string;
    cancelled?: string;
  };
}

export interface Transaction {
  id: string;
  productId: string;
  sellerId: string;
  buyerId: string;
  productTitle: string;

  // Precios (en pesos colombianos o la moneda del país)
  productPrice: number;           // Precio del producto
  shippingBaseCost: number;       // Costo base del envío
  platformShippingCommission: number;     // 50% del envío
  platformSalesCommission: number;        // 5% del producto (solo para vendedor)
  totalPrice: number;             // productPrice + shippingBaseCost + platformShippingCommission

  // Desglose de lo que recibe cada uno
  sellerReceives: number;         // productPrice - platformSalesCommission
  platformEarns: number;          // platformShippingCommission + platformSalesCommission

  // Estado
  status: TransactionStatus;
  
  // Info de envío asociada
  shipping?: ShippingInfo;

  // Historial de cambios de estado
  statusHistory: Array<{
    status: TransactionStatus;
    timestamp: string;
    notes?: string;
    changedBy?: string;           // "system", "seller", "buyer", etc
  }>;

  timestamps: {
    created: string;
    updated: string;
  };

  // Notas del comprador
  buyerNotes?: string;
  
  // Cancelación
  cancellationReason?: string;
  cancelledAt?: string;
  cancelledBy?: string;           // "buyer" o "seller"
}

// Calculadora de costos predefinidos por rutas principales en Colombia
export interface ShippingRoute {
  fromCity: string;
  toCity: string;
  estimatedDistanceKm: number;
  estimatedDays: number;
  costPerKm: number;
}

// Rutas principales colombianas (ejemplo)
export const SHIPPING_ROUTES: ShippingRoute[] = [
  // Desde Bogotá
  { fromCity: "Bogotá", toCity: "Medellín", estimatedDistanceKm: 430, estimatedDays: 2, costPerKm: 25 },
  { fromCity: "Bogotá", toCity: "Cali", estimatedDistanceKm: 520, estimatedDays: 2, costPerKm: 25 },
  { fromCity: "Bogotá", toCity: "Barranquilla", estimatedDistanceKm: 1300, estimatedDays: 3, costPerKm: 20 },
  { fromCity: "Bogotá", toCity: "Cartagena", estimatedDistanceKm: 1350, estimatedDays: 3, costPerKm: 20 },

  // Desde Medellín
  { fromCity: "Medellín", toCity: "Bogotá", estimatedDistanceKm: 430, estimatedDays: 2, costPerKm: 25 },
  { fromCity: "Medellín", toCity: "Cali", estimatedDistanceKm: 680, estimatedDays: 2, costPerKm: 25 },
  { fromCity: "Medellín", toCity: "Barranquilla", estimatedDistanceKm: 1100, estimatedDays: 2, costPerKm: 20 },

  // Desde Cali
  { fromCity: "Cali", toCity: "Bogotá", estimatedDistanceKm: 520, estimatedDays: 2, costPerKm: 25 },
  { fromCity: "Cali", toCity: "Medellín", estimatedDistanceKm: 680, estimatedDays: 2, costPerKm: 25 },
  { fromCity: "Cali", toCity: "Buenaventura", estimatedDistanceKm: 85, estimatedDays: 1, costPerKm: 30 },

  // Desde Barranquilla
  { fromCity: "Barranquilla", toCity: "Bogotá", estimatedDistanceKm: 1300, estimatedDays: 3, costPerKm: 20 },
  { fromCity: "Barranquilla", toCity: "Cartagena", estimatedDistanceKm: 120, estimatedDays: 1, costPerKm: 30 },

  // Ruta genérica (si no encuentra específica)
  { fromCity: "GENERIC", toCity: "GENERIC", estimatedDistanceKm: 500, estimatedDays: 3, costPerKm: 25 },
];

// Tarifa mínima de envío
export const MINIMUM_SHIPPING_COST = 10000; // $10,000 COP

/**
 * Calcula el costo de envío entre dos ciudades
 * @param fromCity Ciudad origen
 * @param toCity Ciudad destino
 * @returns Información del envío calculada
 */
export function calculateShippingCost(
  fromCity: string,
  toCity: string
): {
  estimatedDistanceKm: number;
  estimatedDays: number;
  baseCost: number;
  platformCommission: number;
  totalShippingCost: number;
} {
  // Buscar ruta específica (manejo case-insensitive)
  let route = SHIPPING_ROUTES.find(
    (r) =>
      r.fromCity.toLowerCase() === fromCity.toLowerCase() &&
      r.toCity.toLowerCase() === toCity.toLowerCase()
  );

  // Si no encuentra ruta exacta, buscar ruta genérica
  if (!route) {
    route = SHIPPING_ROUTES.find((r) => r.fromCity === "GENERIC" && r.toCity === "GENERIC")!;
  }

  // Calcular costo base
  let baseCost = route.estimatedDistanceKm * route.costPerKm;

  // Aplicar costo mínimo
  if (baseCost < MINIMUM_SHIPPING_COST) {
    baseCost = MINIMUM_SHIPPING_COST;
  }

  // Comisión de plataforma: 50% del costo base
  const platformCommission = Math.round(baseCost * 0.5);

  // Costo total para el comprador
  const totalShippingCost = baseCost + platformCommission;

  return {
    estimatedDistanceKm: route.estimatedDistanceKm,
    estimatedDays: route.estimatedDays,
    baseCost,
    platformCommission,
    totalShippingCost,
  };
}

/**
 * Obtiene las ciudades disponibles en el sistema
 */
export function getAvailableCities(): string[] {
  const cities = new Set<string>();
  SHIPPING_ROUTES.forEach((route) => {
    if (route.fromCity !== "GENERIC" && route.toCity !== "GENERIC") {
      cities.add(route.fromCity);
      cities.add(route.toCity);
    }
  });
  return Array.from(cities).sort();
}

/**
 * Valida si una ruta está disponible
 */
export function isShippingRouteAvailable(fromCity: string, toCity: string): boolean {
  const route = SHIPPING_ROUTES.find(
    (r) =>
      r.fromCity.toLowerCase() === fromCity.toLowerCase() &&
      r.toCity.toLowerCase() === toCity.toLowerCase()
  );
  return !!route;
}
