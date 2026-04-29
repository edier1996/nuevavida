# Plan de Implementación: Sistema de Envíos Intermediado

## 📋 Resumen Ejecutivo

**Objetivo**: La plataforma actuará como intermediaria en envíos, cobrando 50% extra del costo base del envío.

**Ejemplo**:
- Coste envío base: $30,000
- Comisión plataforma (50%): $15,000
- **Total cobrado al comprador**: $45,000

---

## 🏗️ Arquitectura Requerida

### 1. **Modelo de Datos: Transacciones**

```typescript
interface Transaction {
  id: string;
  productId: string;
  sellerId: string;
  buyerId: string;
  
  // Precios
  productPrice: number;           // Precio del producto
  shippingBaseCost: number;       // Costo base del envío
  platformCommission: number;     // 50% del envío
  totalPrice: number;             // productPrice + shippingBaseCost + platformCommission
  
  // Información de envío
  pickupAddress: string;          // Dirección del vendedor
  deliveryAddress: string;        // Dirección del comprador
  shippingProvider?: string;      // "correosdecolombia", "dhl", "servientrega", etc.
  trackingNumber?: string;        // Número de seguimiento
  
  // Estados
  status: 'pending' | 'paid' | 'picked_up' | 'in_transit' | 'delivered' | 'cancelled';
  createdAt: string;
  updatedAt: string;
  
  // Cambios de estado
  statusHistory: Array<{
    status: string;
    timestamp: string;
    notes?: string;
  }>;
}
```

### 2. **Modelo de Datos: Envío**

```typescript
interface Shipping {
  id: string;
  transactionId: string;
  
  // Información del envío
  pickupLatitude: number;
  pickupLongitude: number;
  deliveryLatitude: number;
  deliveryLongitude: number;
  
  // Estimación
  estimatedDays: number;
  actualDeliveryDate?: string;
  
  // Costo detallado
  distanceKm: number;
  costPerKm: number;            // Tarifa base por km
  baseCost: number;              // Costo calculado
  
  // Observaciones
  specialInstructions?: string;
  packageWeight?: number;
  packageDimensions?: string;    // "30x20x15 cm"
}
```

---

## 🔄 Flujos de Usuario

### **Flujo 1: COMPRADOR**

```
1. Ver Producto
   ↓
2. Click "Comprar" (NUEVO)
   ↓
3. Sistema calcula:
   - Costo envío base (basado en distancia)
   - Comisión plataforma (50% envío)
   - Total = producto + envío base + comisión
   ↓
4. Ingresa dirección de entrega
   ↓
5. Revisa resumen de precios
   ↓
6. Realiza pago (simulado en localStorage por ahora)
   ↓
7. ¡COMPRA CONFIRMADA!
   - Vendedor recibe notificación
   - Comprador recibe # de seguimiento
```

### **Flujo 2: VENDEDOR**

```
1. Producto publicado
   ↓
2. Recibe notificación "Alguien compró tu producto"
   ↓
3. En dashboard: "Órdenes pendientes de recoger"
   ↓
4. Click "Generar etiqueta de envío"
   - Se genera QR/código de barras
   - Instrucciones de recogida
   ↓
5. Entrega al servicio de envío
   ↓
6. Plataforma rastrea envío
   ↓
7. Una vez entregado: RECIBE PAGO
   - Monto: precio producto - 5% comisión original
   - (La plataforma ya cobra 50% del envío al comprador)
```

### **Flujo 3: PLATAFORMA**

```
Comprador paga: $45,000
  ↓
Estados financieros:
├─ Producto: $30,000
├─ Envío base: $10,000
├─ Comisión envío (50%): $5,000 → PLATAFORMA ✓
├─ Comisión venta (5%): $1,500 → PLATAFORMA ✓
└─ Pago vendedor: $28,500

Total ganancia plataforma por venta:
$5,000 (envío) + $1,500 (venta) = $6,500
```

---

## 📁 Cambios en Estructura de Carpetas

```
src/
├── lib/
│   └── mock-data.ts (actualizar modelo Product)
│   └── shipping-calculator.ts (NUEVO - calcula distancia/costo)
│
├── contexts/
│   ├── AuthContext.tsx (mantener)
│   └── TransactionContext.tsx (NUEVO - maneja compras)
│
├── pages/
│   ├── ProductDetail.tsx (UPDATE - agregar botón "Comprar")
│   ├── Checkout.tsx (NUEVO - página de compra)
│   ├── OrderConfirmation.tsx (NUEVO - confirmación)
│   ├── SellerOrders.tsx (NUEVO - órdenes del vendedor)
│   └── OrderTracking.tsx (NUEVO - rastreo en tiempo real)
│
└── components/
    ├── ShippingCalculator.tsx (NUEVO)
    ├── TransactionCard.tsx (NUEVO)
    └── ShippingTracker.tsx (NUEVO)
```

---

## 🔧 Cambios Detallados por Archivo

### **1. lib/mock-data.ts**
**Cambio**: Actualizar interfaz `Product`
```typescript
// AGREGAR estos campos:
shippingCost?: number;          // Costo base del envío (calculado)
sold: boolean;                  // Ya existe, mantener
purchasedBy?: string;           // ID del comprador
transactionId?: string;         // ID de transacción
```

### **2. ProductDetail.tsx**
**Cambio**: Reemplazar botón "Contactar vendedor" con opciones
```
- Si es regalo: "Contactar vendedor" (mantener)
- Si es venta: 
  - "Comprar ahora" (NUEVO)
  - "Contactar vendedor"
```

### **3. NUEVO: src/pages/Checkout.tsx**
Página con:
- Resumen del producto
- Campo dirección de entrega
- Calculadora de costo de envío automática
- Desglose de precios (producto + envío base + comisión)
- Botón "Confirmar y Pagar"
- Simulación de pasarela de pago

### **4. NUEVO: src/pages/OrderConfirmation.tsx**
Página de confirmación con:
- Número de orden
- Número de seguimiento preliminar
- Instrucciones para vendedor
- Cronograma estimado

### **5. NUEVO: SellerOrders.tsx** (actualizar SellerDashboard)
Panel con:
- Tabla de órdenes pendientes
- Botón "Generar etiqueta de envío"
- Botón "Marcar como recogido"
- Estado de cada envío

### **6. NUEVO: src/lib/shipping-calculator.ts**
Función para calcular:
```typescript
function calculateShippingCost(
  pickupCity: string,
  deliveryCity: string,
  pickupAddress: string,
  deliveryAddress: string
): {
  estimatedDays: number;
  baseCost: number;
  platformCommission: number;
  total: number;
}
```

---

## 💰 Matriz de Costos

```
Escenario: Producto de $100,000 | Envío $30,000

COMPRADOR PAGA:
  Producto:                    $100,000
  Envío base:                  $ 30,000
  Comisión plataforma (50%):   $ 15,000
  ────────────────────────────────────
  TOTAL:                       $145,000

PLATAFORMA RECIBE:
  De comisión envío:           $ 15,000
  De comisión venta (5%):      $  5,000
  ────────────────────────────────────
  GANANCIA:                    $ 20,000 (13.8%)

VENDEDOR RECIBE:
  Precio producto:             $100,000
  Menos comisión (5%):         $ (5,000)
  ────────────────────────────────────
  NETO:                        $ 95,000
  (Envío es responsabilidad de plataforma)
```

---

## 🎯 Fases de Implementación

### **Fase 1: Datos y Lógica (Backend Local)**
- [ ] Crear interfaz `Transaction`
- [ ] Crear interfaz `Shipping`
- [ ] Actualizar `Product` con campos de transacción
- [ ] Crear calculadora de envío

### **Fase 2: UI de Compra**
- [ ] Crear `Checkout.tsx`
- [ ] Crear calculadora de envío en componente
- [ ] Actualizar `ProductDetail.tsx` con botón Comprar
- [ ] Crear `OrderConfirmation.tsx`

### **Fase 3: Dashboard Vendedor**
- [ ] Actualizar `SellerDashboard.tsx`
- [ ] Crear vista de "Órdenes Pendientes"
- [ ] Agregar generador de etiquetas

### **Fase 4: Rastreo**
- [ ] Crear `OrderTracking.tsx`
- [ ] Componente para mostrar estados
- [ ] Historial de cambios de estado

### **Fase 5: Contexto Global (Opcional pero recomendado)**
- [ ] Crear `TransactionContext.tsx`
- [ ] Manejo global de compras
- [ ] Persistencia en localStorage

---

## 🚀 Primeros Pasos Recomendados

1. **Comenzar por**: Actualizar modelo de datos
2. **Luego**: Crear página de Checkout
3. **Después**: Agregar botón "Comprar" en ProductDetail
4. **Resultado**: Flujo básico de compra sin rastreo

---

## ⚠️ Consideraciones Importantes

1. **Simulación vs Real**: Actualmente usamos localStorage. Para producción necesitarás:
   - Backend API (Node.js/Python/etc)
   - Base de datos (PostgreSQL/MongoDB)
   - Pasarela de pago real (Stripe, PayU, Adyen)
   - API de logística real

2. **Regulaciones**: Colombia requiere documentación para:
   - Cobro de comisiones
   - Transacciones económicas
   - GDPR si expandes a Europa

3. **Experiencia de Usuario**: El cambio de "contacto directo" a "compra automatizada" es importante para:
   - Incluyentes que no quieren escribir
   - Seguridad (sin intercambio de datos directo)

---

## 📊 Estimación de Beneficio

Con 100 ventas mensuales de $100,000 c/u:

```
Ingresos mensuales:
+ Comisión envío (50% x $30k): $1,500,000 (100 vendtas)
+ Comisión venta (5%):            $500,000
────────────────────────────────
= TOTAL:                        $2,000,000/mes

Costo estimado (hosting, domain, etc):
- Infraestructura:                $50,000
- Personal (1 dev):              $150,000
- Logística (2% de envío):       $ 30,000
────────────────────────────────
= GANANCIA NETA:              $1,770,000/mes
```

---

## 🤔 Preguntas Pendientes

1. ¿Qué ciudades servirán? (Afecta el cálculo de envío)
2. ¿Quién maneja la logística? (¿Local, partnership con Correos, etc?)
3. ¿Devueluciones cómo funcionan?
4. ¿Qué pasa si la compra no se entrega?
5. ¿Contratar un dev o hacerlo tú solo?

