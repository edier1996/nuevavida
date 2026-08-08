# NuevaVida — API Documentation

> Documentación completa de todos los endpoints de la plataforma NuevaVida.  
> Versión: 1.0 · Base de datos: MySQL · ORM: Sequelize · Auth: JWT (argon2)

---

## Tabla de contenidos

1. [Introducción](#1-introducción)
2. [Autenticación](#2-autenticación)
3. [User Service — Puerto 5000](#3-user-service--puerto-5000)
4. [Product Service — Puerto 5001](#4-product-service--puerto-5001)
5. [Order Service — Puerto 5002](#5-order-service--puerto-5002)
6. [Payment Service — Puerto 5003](#6-payment-service--puerto-5003)
7. [Notification Service — Puerto 5004](#7-notification-service--puerto-5004)
8. [Messaging Service — Puerto 5005](#8-messaging-service--puerto-5005)
9. [Analytics Service — Puerto 5006](#9-analytics-service--puerto-5006)
10. [Admin Service — Puerto 5007](#10-admin-service--puerto-5007)
11. [Códigos de error globales](#11-códigos-de-error-globales)

---

## 1. Introducción

**NuevaVida** es una plataforma de donación e intercambio de artículos de segunda mano. Conecta donantes con personas que necesitan productos, facilita la comunicación entre partes y permite a patrocinadores apoyar la misión de la plataforma.

### Arquitectura de microservicios

Cada servicio es una aplicación Node.js/Express independiente con su propia base de datos MySQL. Los servicios se comunican entre sí mediante HTTP REST y, en el caso del Messaging Service, también mediante WebSocket.

```
┌─────────────────────────────────────────────────────────────────┐
│                         Cliente (Frontend)                       │
└──────────────────────────────┬──────────────────────────────────┘
                               │ HTTP / WebSocket
┌──────────────────────────────▼──────────────────────────────────┐
│                          Nginx / API Gateway                     │
└──┬──────┬──────┬──────┬──────┬──────┬──────┬──────┬────────────┘
   │      │      │      │      │      │      │      │
 :5000  :5001  :5002  :5003  :5004  :5005  :5006  :5007
   │      │      │      │      │      │      │      │
 User  Product Order Payment Notif  Msg  Analytics Admin
   │      │      │      │      │      │      │      │
  DB    DB    DB    DB    DB    DB    DB    DB   (MySQL por servicio)
```

### URLs base por servicio

| Servicio             | Puerto local | Prefijo de ruta       |
|----------------------|--------------|-----------------------|
| User Service         | `5000`       | `/api/users`          |
| Product Service      | `5001`       | `/api/products`       |
| Order Service        | `5002`       | `/api/orders`         |
| Payment Service      | `5003`       | `/api/payments`       |
| Notification Service | `5004`       | `/api/notifications`  |
| Messaging Service    | `5005`       | `/api/messages`       |
| Analytics Service    | `5006`       | `/api/analytics`      |
| Admin Service        | `5007`       | `/api/admin`          |

**Desarrollo local:** `http://localhost:{puerto}/api/{prefijo}`  
**Producción (Railway):** `https://{servicio}.up.railway.app/api/{prefijo}`

---

## 2. Autenticación

La plataforma usa **JSON Web Tokens (JWT)** firmados con `HS256`. Las contraseñas se hashean con **argon2**.

### Obtener un token

Registra o inicia sesión a través del User Service. El token se devuelve en el campo `token` de la respuesta.

### Usar el token

Incluye el token en el header `Authorization` de cada petición protegida:

```
Authorization: Bearer <tu_jwt_token>
```

### Roles

| Rol     | Descripción                                                  |
|---------|--------------------------------------------------------------|
| `user`  | Usuario estándar. Accede a su propio perfil y recursos.      |
| `admin` | Administrador. Accede a endpoints de moderación y reportes.  |

El payload del JWT contiene `{ userId, role }`. Los endpoints de Admin Service verifican que `role === 'admin'`.

### Expiración

Los tokens expiran en **1 hora** (`expiresIn: "1h"`). Vuelve a hacer login para obtener uno nuevo.

---

## 3. User Service — Puerto 5000

Base URL: `http://localhost:5000/api/users`

---

### POST /api/users/register

Registra un nuevo usuario en la plataforma.

**Autenticación requerida:** No

**Headers:**

| Header         | Valor              |
|----------------|--------------------|
| `Content-Type` | `application/json` |

**Body:**

```json
{
  "name": "María García",
  "email": "maria@example.com",
  "password": "MiPassword123"
}
```

| Campo      | Tipo   | Requerido | Descripción                    |
|------------|--------|-----------|--------------------------------|
| `name`     | string | ✅        | Nombre completo del usuario    |
| `email`    | string | ✅        | Correo electrónico único       |
| `password` | string | ✅        | Contraseña (se hashea con argon2) |

**Response 200 — Éxito:**

```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "userId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "user": {
    "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "name": "María García",
    "email": "maria@example.com",
    "role": "user"
  }
}
```

**Errores:**

| Código | Descripción                        |
|--------|------------------------------------|
| `400`  | El usuario ya existe con ese email |
| `500`  | Error interno del servidor         |

**cURL:**

```bash
curl -X POST http://localhost:5000/api/users/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "María García",
    "email": "maria@example.com",
    "password": "MiPassword123"
  }'
```

---

### POST /api/users/login

Inicia sesión con email y contraseña.

**Autenticación requerida:** No

**Headers:**

| Header         | Valor              |
|----------------|--------------------|
| `Content-Type` | `application/json` |

**Body:**

```json
{
  "email": "maria@example.com",
  "password": "MiPassword123"
}
```

**Response 200 — Éxito:**

```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "userId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "user": {
    "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "name": "María García",
    "email": "maria@example.com",
    "role": "user"
  }
}
```

**Errores:**

| Código | Descripción                              |
|--------|------------------------------------------|
| `400`  | No existe usuario con ese email          |
| `400`  | Credenciales inválidas (contraseña incorrecta) |
| `500`  | Error interno del servidor               |

**cURL:**

```bash
curl -X POST http://localhost:5000/api/users/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "maria@example.com",
    "password": "MiPassword123"
  }'
```

---

### GET /api/users/:id

Obtiene el perfil de un usuario por su ID. La contraseña nunca se incluye en la respuesta.

**Autenticación requerida:** Sí (JWT)

**Headers:**

| Header          | Valor                  |
|-----------------|------------------------|
| `Authorization` | `Bearer <jwt_token>`   |

**Parámetros de ruta:**

| Parámetro | Tipo   | Descripción      |
|-----------|--------|------------------|
| `id`      | UUID   | ID del usuario   |

**Response 200 — Éxito:**

```json
{
  "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "name": "María García",
  "email": "maria@example.com",
  "createdAt": "2024-01-15T10:30:00.000Z",
  "updatedAt": "2024-01-15T10:30:00.000Z"
}
```

**Errores:**

| Código | Descripción                    |
|--------|--------------------------------|
| `401`  | Token ausente o inválido       |
| `404`  | Usuario no encontrado          |
| `500`  | Error interno del servidor     |

**cURL:**

```bash
curl http://localhost:5000/api/users/a1b2c3d4-e5f6-7890-abcd-ef1234567890 \
  -H "Authorization: Bearer TU_JWT_TOKEN"
```

---

### PUT /api/users/:id

Actualiza el nombre y/o email de un usuario.

**Autenticación requerida:** Sí (JWT)

**Headers:**

| Header          | Valor                  |
|-----------------|------------------------|
| `Authorization` | `Bearer <jwt_token>`   |
| `Content-Type`  | `application/json`     |

**Body:**

```json
{
  "name": "María López",
  "email": "maria.lopez@example.com"
}
```

| Campo   | Tipo   | Requerido | Descripción                  |
|---------|--------|-----------|------------------------------|
| `name`  | string | ❌        | Nuevo nombre del usuario     |
| `email` | string | ❌        | Nuevo email del usuario      |

**Response 200 — Éxito:** Objeto usuario actualizado (sin contraseña).

**Errores:**

| Código | Descripción                    |
|--------|--------------------------------|
| `401`  | Token ausente o inválido       |
| `404`  | Usuario no encontrado          |
| `500`  | Error interno del servidor     |

**cURL:**

```bash
curl -X PUT http://localhost:5000/api/users/a1b2c3d4-e5f6-7890-abcd-ef1234567890 \
  -H "Authorization: Bearer TU_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name": "María López"}'
```

---

### DELETE /api/users/:id

> ⚠️ Este endpoint no está implementado en la versión actual del User Service. Para eliminar usuarios usa el Admin Service (`POST /api/admin/users/:id/ban`).

---

## 4. Product Service — Puerto 5001

Base URL: `http://localhost:5001/api/products`

Los productos en NuevaVida representan artículos disponibles para donación o intercambio.

---

### POST /api/products/create

Crea un nuevo producto/artículo en la plataforma.

**Autenticación requerida:** No (cualquier usuario autenticado en el frontend puede publicar)

**Headers:**

| Header         | Valor              |
|----------------|--------------------|
| `Content-Type` | `application/json` |

**Body:**

```json
{
  "title": "Bicicleta de montaña",
  "description": "Bicicleta en buen estado, talla M, 21 velocidades",
  "category": "deportes",
  "price": 0,
  "isGift": true,
  "condition": "bueno",
  "images": ["https://cdn.example.com/img1.jpg"],
  "city": "Bogotá",
  "sellerId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "sellerEmail": "maria@example.com",
  "sellerName": "María García",
  "sellerAvatar": "https://cdn.example.com/avatar.jpg",
  "status": "active",
  "donationStatus": "disponible",
  "sold": false,
  "commission": 0,
  "stock": 1
}
```

| Campo           | Tipo     | Requerido | Descripción                                              |
|-----------------|----------|-----------|----------------------------------------------------------|
| `title`         | string   | ✅        | Título del artículo (alias: `name`)                      |
| `description`   | string   | ❌        | Descripción detallada                                    |
| `category`      | string   | ❌        | Categoría del artículo                                   |
| `price`         | number   | ❌        | Precio (0 para donaciones). Default: `0`                 |
| `isGift`        | boolean  | ❌        | `true` si es donación. Default: `true`                   |
| `condition`     | string   | ❌        | Estado: `"nuevo"`, `"bueno"`, `"regular"`. Default: `"bueno"` |
| `images`        | string[] | ❌        | URLs de imágenes. Default: `[]`                          |
| `city`          | string   | ❌        | Ciudad del donante                                       |
| `sellerId`      | UUID     | ❌        | ID del usuario que publica                               |
| `sellerEmail`   | string   | ❌        | Email del publicador                                     |
| `sellerName`    | string   | ❌        | Nombre del publicador. Default: `"Usuario"`              |
| `sellerAvatar`  | string   | ❌        | URL del avatar del publicador                            |
| `status`        | string   | ❌        | Estado: `"active"`, `"inactive"`. Default: `"active"`   |
| `donationStatus`| string   | ❌        | Estado de donación. Default: `"disponible"`              |
| `sold`          | boolean  | ❌        | Si ya fue entregado. Default: `false`                    |
| `commission`    | number   | ❌        | Comisión aplicada. Default: `0`                          |
| `stock`         | number   | ❌        | Unidades disponibles. Default: `0`                       |

**Response 201 — Éxito:**

```json
{
  "id": "b2c3d4e5-f6a7-8901-bcde-f12345678901",
  "title": "Bicicleta de montaña",
  "name": "Bicicleta de montaña",
  "description": "Bicicleta en buen estado, talla M, 21 velocidades",
  "category": "deportes",
  "price": 0,
  "isGift": true,
  "condition": "bueno",
  "images": ["https://cdn.example.com/img1.jpg"],
  "city": "Bogotá",
  "sellerId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "sellerEmail": "maria@example.com",
  "sellerName": "María García",
  "status": "active",
  "donationStatus": "disponible",
  "sold": false,
  "stock": 1,
  "createdAt": "2024-01-15T10:30:00.000Z",
  "updatedAt": "2024-01-15T10:30:00.000Z"
}
```

**Errores:**

| Código | Descripción                    |
|--------|--------------------------------|
| `500`  | Error interno del servidor     |

**cURL:**

```bash
curl -X POST http://localhost:5001/api/products/create \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Bicicleta de montaña",
    "description": "Bicicleta en buen estado",
    "category": "deportes",
    "isGift": true,
    "city": "Bogotá",
    "sellerId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "sellerEmail": "maria@example.com",
    "sellerName": "María García"
  }'
```

---

### GET /api/products

Lista todos los productos disponibles en la plataforma.

**Autenticación requerida:** No

**Response 200 — Éxito:**

```json
[
  {
    "id": "b2c3d4e5-f6a7-8901-bcde-f12345678901",
    "title": "Bicicleta de montaña",
    "category": "deportes",
    "price": 0,
    "isGift": true,
    "condition": "bueno",
    "city": "Bogotá",
    "status": "active",
    "donationStatus": "disponible",
    "sold": false,
    "createdAt": "2024-01-15T10:30:00.000Z"
  }
]
```

**cURL:**

```bash
curl http://localhost:5001/api/products
```

---

### GET /api/products/:id

Obtiene un producto específico por su ID.

**Autenticación requerida:** No

**Parámetros de ruta:**

| Parámetro | Tipo | Descripción       |
|-----------|------|-------------------|
| `id`      | UUID | ID del producto   |

**Response 200 — Éxito:** Objeto producto completo.

**Errores:**

| Código | Descripción               |
|--------|---------------------------|
| `404`  | Producto no encontrado    |
| `500`  | Error interno del servidor|

**cURL:**

```bash
curl http://localhost:5001/api/products/b2c3d4e5-f6a7-8901-bcde-f12345678901
```

---

### PUT /api/products/:id

Actualiza uno o más campos de un producto existente. Solo se actualizan los campos enviados en el body.

**Autenticación requerida:** No

**Headers:**

| Header         | Valor              |
|----------------|--------------------|
| `Content-Type` | `application/json` |

**Body (todos los campos son opcionales):**

```json
{
  "donationStatus": "entregado",
  "sold": true,
  "status": "inactive"
}
```

**Response 200 — Éxito:** Objeto producto actualizado.

**Errores:**

| Código | Descripción               |
|--------|---------------------------|
| `404`  | Producto no encontrado    |
| `500`  | Error interno del servidor|

**cURL:**

```bash
curl -X PUT http://localhost:5001/api/products/b2c3d4e5-f6a7-8901-bcde-f12345678901 \
  -H "Content-Type: application/json" \
  -d '{"donationStatus": "entregado", "sold": true}'
```

---

### DELETE /api/products/:id

Elimina permanentemente un producto.

**Autenticación requerida:** No

**Response 200 — Éxito:**

```json
{ "msg": "Product deleted" }
```

**Errores:**

| Código | Descripción               |
|--------|---------------------------|
| `404`  | Producto no encontrado    |
| `500`  | Error interno del servidor|

**cURL:**

```bash
curl -X DELETE http://localhost:5001/api/products/b2c3d4e5-f6a7-8901-bcde-f12345678901
```

---

### PUT /api/products/:id/deduct

Reduce el stock de un producto. Llamado internamente por el Order Service al confirmar una solicitud de donación.

**Autenticación requerida:** No

**Body:**

```json
{ "quantity": 1 }
```

| Campo      | Tipo   | Requerido | Descripción                          |
|------------|--------|-----------|--------------------------------------|
| `quantity` | number | ✅        | Cantidad a descontar (debe ser > 0)  |

**Response 200 — Éxito:**

```json
{
  "success": true,
  "message": "Stock reduced by 1",
  "product": { "id": "...", "stock": 0, "..." : "..." }
}
```

**Errores:**

| Código | Descripción                          |
|--------|--------------------------------------|
| `400`  | `quantity` no es un número positivo  |
| `400`  | Stock insuficiente                   |
| `404`  | Producto no encontrado               |
| `500`  | Error interno del servidor           |

**cURL:**

```bash
curl -X PUT http://localhost:5001/api/products/b2c3d4e5-f6a7-8901-bcde-f12345678901/deduct \
  -H "Content-Type: application/json" \
  -d '{"quantity": 1}'
```

---

### PUT /api/products/:id/restore

Restaura el stock de un producto. Llamado cuando se cancela una solicitud de donación.

**Autenticación requerida:** No

**Body:**

```json
{ "quantity": 1 }
```

**Response 200 — Éxito:**

```json
{
  "success": true,
  "message": "Stock restored by 1",
  "product": { "id": "...", "stock": 1, "..." : "..." }
}
```

**Errores:**

| Código | Descripción                          |
|--------|--------------------------------------|
| `400`  | `quantity` no es un número positivo  |
| `404`  | Producto no encontrado               |
| `500`  | Error interno del servidor           |

**cURL:**

```bash
curl -X PUT http://localhost:5001/api/products/b2c3d4e5-f6a7-8901-bcde-f12345678901/restore \
  -H "Content-Type: application/json" \
  -d '{"quantity": 1}'
```

---

## 5. Order Service — Puerto 5002

Base URL: `http://localhost:5002/api/orders`

En NuevaVida, las "órdenes" son **solicitudes de donación** (`DonationRequest`). Un usuario solicita recibir un artículo publicado por un donante.

---

### POST /api/orders/create

Crea una nueva solicitud de donación para un producto.

**Autenticación requerida:** No

**Headers:**

| Header         | Valor              |
|----------------|--------------------|
| `Content-Type` | `application/json` |

**Body:**

```json
{
  "productId": "b2c3d4e5-f6a7-8901-bcde-f12345678901",
  "requesterId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "requesterEmail": "carlos@example.com",
  "requesterName": "Carlos Pérez",
  "donorId": "f9e8d7c6-b5a4-3210-fedc-ba9876543210",
  "message": "Hola, me interesa mucho la bicicleta para ir al trabajo.",
  "location": "Calle 80 #45-12",
  "city": "Bogotá",
  "country": "Colombia"
}
```

| Campo            | Tipo   | Requerido | Descripción                                    |
|------------------|--------|-----------|------------------------------------------------|
| `productId`      | UUID   | ✅        | ID del producto solicitado                     |
| `requesterId`    | UUID   | ✅        | ID del usuario que solicita                    |
| `requesterEmail` | string | ✅        | Email del solicitante                          |
| `requesterName`  | string | ✅        | Nombre del solicitante                         |
| `donorId`        | UUID   | ❌        | ID del donante (dueño del producto)            |
| `message`        | string | ❌        | Mensaje personal al donante                    |
| `location`       | string | ❌        | Dirección de entrega                           |
| `city`           | string | ❌        | Ciudad de entrega                              |
| `country`        | string | ❌        | País de entrega                                |

**Response 201 — Éxito:**

```json
{
  "id": "c3d4e5f6-a7b8-9012-cdef-123456789012",
  "productId": "b2c3d4e5-f6a7-8901-bcde-f12345678901",
  "requesterId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "requesterEmail": "carlos@example.com",
  "requesterName": "Carlos Pérez",
  "donorId": "f9e8d7c6-b5a4-3210-fedc-ba9876543210",
  "message": "Hola, me interesa mucho la bicicleta para ir al trabajo.",
  "status": "pending",
  "city": "Bogotá",
  "country": "Colombia",
  "createdAt": "2024-01-15T11:00:00.000Z",
  "updatedAt": "2024-01-15T11:00:00.000Z"
}
```

**Errores:**

| Código | Descripción                                                          |
|--------|----------------------------------------------------------------------|
| `400`  | Faltan campos requeridos: `productId`, `requesterId`, `requesterEmail`, `requesterName` |
| `500`  | Error interno del servidor                                           |

**cURL:**

```bash
curl -X POST http://localhost:5002/api/orders/create \
  -H "Content-Type: application/json" \
  -d '{
    "productId": "b2c3d4e5-f6a7-8901-bcde-f12345678901",
    "requesterId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "requesterEmail": "carlos@example.com",
    "requesterName": "Carlos Pérez",
    "message": "Me interesa mucho este artículo."
  }'
```

---

### GET /api/orders

Lista todas las solicitudes de donación, ordenadas de más reciente a más antigua.

**Autenticación requerida:** No

**Response 200 — Éxito:** Array de objetos `DonationRequest`.

**cURL:**

```bash
curl http://localhost:5002/api/orders
```

---

### GET /api/orders/:id

Obtiene una solicitud de donación específica por su ID.

**Autenticación requerida:** No

**Parámetros de ruta:**

| Parámetro | Tipo | Descripción                    |
|-----------|------|--------------------------------|
| `id`      | UUID | ID de la solicitud de donación |

**Response 200 — Éxito:** Objeto `DonationRequest`.

**Errores:**

| Código | Descripción                        |
|--------|------------------------------------|
| `404`  | Solicitud de donación no encontrada|
| `500`  | Error interno del servidor         |

**cURL:**

```bash
curl http://localhost:5002/api/orders/c3d4e5f6-a7b8-9012-cdef-123456789012
```

---

### GET /api/orders/product/:productId

Lista todas las solicitudes de donación para un producto específico.

**Autenticación requerida:** No

**Parámetros de ruta:**

| Parámetro   | Tipo | Descripción      |
|-------------|------|------------------|
| `productId` | UUID | ID del producto  |

**Response 200 — Éxito:** Array de objetos `DonationRequest` para ese producto.

**cURL:**

```bash
curl http://localhost:5002/api/orders/product/b2c3d4e5-f6a7-8901-bcde-f12345678901
```

---

### GET /api/orders/user/:userId

Lista todas las solicitudes de donación en las que participa un usuario, ya sea como solicitante (`requesterId`) o como donante (`donorId`).

**Autenticación requerida:** No

**Parámetros de ruta:**

| Parámetro | Tipo | Descripción    |
|-----------|------|----------------|
| `userId`  | UUID | ID del usuario |

**Response 200 — Éxito:** Array de objetos `DonationRequest`.

**cURL:**

```bash
curl http://localhost:5002/api/orders/user/a1b2c3d4-e5f6-7890-abcd-ef1234567890
```

---

### PUT /api/orders/:id

Actualiza el estado u otros campos de una solicitud de donación.

**Autenticación requerida:** No

**Body (todos los campos son opcionales):**

```json
{
  "status": "accepted",
  "donorId": "f9e8d7c6-b5a4-3210-fedc-ba9876543210",
  "message": "Mensaje actualizado",
  "location": "Calle 100 #20-30",
  "city": "Medellín",
  "country": "Colombia"
}
```

| Campo     | Tipo   | Descripción                                                    |
|-----------|--------|----------------------------------------------------------------|
| `status`  | string | Estado: `"pending"`, `"accepted"`, `"rejected"`, `"completed"` |
| `donorId` | UUID   | ID del donante                                                 |
| `message` | string | Mensaje actualizado                                            |
| `location`| string | Dirección de entrega                                           |
| `city`    | string | Ciudad                                                         |
| `country` | string | País                                                           |

**Response 200 — Éxito:** Objeto `DonationRequest` actualizado.

**Errores:**

| Código | Descripción                        |
|--------|------------------------------------|
| `404`  | Solicitud de donación no encontrada|
| `500`  | Error interno del servidor         |

**cURL:**

```bash
curl -X PUT http://localhost:5002/api/orders/c3d4e5f6-a7b8-9012-cdef-123456789012 \
  -H "Content-Type: application/json" \
  -d '{"status": "accepted"}'
```

---

### DELETE /api/orders/:id

Cancela y elimina una solicitud de donación.

**Autenticación requerida:** No

**Response 200 — Éxito:**

```json
{ "msg": "Donation request cancelled" }
```

**Errores:**

| Código | Descripción                        |
|--------|------------------------------------|
| `404`  | Solicitud de donación no encontrada|
| `500`  | Error interno del servidor         |

**cURL:**

```bash
curl -X DELETE http://localhost:5002/api/orders/c3d4e5f6-a7b8-9012-cdef-123456789012
```

---

## 6. Payment Service — Puerto 5003

Base URL: `http://localhost:5003/api/payments`

Gestiona dos entidades financieras: **comisiones** (sobre donaciones) y **patrocinios** (sponsors que apoyan la plataforma).

---

### POST /api/payments/commission

Registra una comisión asociada a una donación completada.

**Autenticación requerida:** No

**Body:**

```json
{
  "orderId": "c3d4e5f6-a7b8-9012-cdef-123456789012",
  "amount": 5000,
  "percentage": 5
}
```

| Campo        | Tipo   | Requerido | Descripción                              |
|--------------|--------|-----------|------------------------------------------|
| `orderId`    | UUID   | ✅        | ID de la solicitud de donación asociada  |
| `amount`     | number | ✅        | Monto de la comisión (en la moneda local)|
| `percentage` | number | ✅        | Porcentaje aplicado (ej: `5` = 5%)       |

**Response 201 — Éxito:**

```json
{
  "id": "d4e5f6a7-b8c9-0123-defa-234567890123",
  "orderId": "c3d4e5f6-a7b8-9012-cdef-123456789012",
  "amount": 5000,
  "percentage": 5,
  "status": "pending",
  "createdAt": "2024-01-15T12:00:00.000Z",
  "updatedAt": "2024-01-15T12:00:00.000Z"
}
```

**Errores:**

| Código | Descripción                                          |
|--------|------------------------------------------------------|
| `400`  | Faltan campos requeridos: `orderId`, `amount`, `percentage` |
| `500`  | Error interno del servidor                           |

**cURL:**

```bash
curl -X POST http://localhost:5003/api/payments/commission \
  -H "Content-Type: application/json" \
  -d '{
    "orderId": "c3d4e5f6-a7b8-9012-cdef-123456789012",
    "amount": 5000,
    "percentage": 5
  }'
```

---

### GET /api/payments/commissions

Lista todas las comisiones registradas, ordenadas de más reciente a más antigua.

**Autenticación requerida:** No

**Response 200 — Éxito:** Array de objetos `Commission`.

**cURL:**

```bash
curl http://localhost:5003/api/payments/commissions
```

---

### PUT /api/payments/commission/:id

Actualiza el estado de una comisión.

**Autenticación requerida:** No

**Body:**

```json
{ "status": "paid" }
```

| Campo    | Tipo   | Descripción                                    |
|----------|--------|------------------------------------------------|
| `status` | string | Estado: `"pending"`, `"paid"`, `"cancelled"`   |

**Response 200 — Éxito:** Objeto `Commission` actualizado.

**Errores:**

| Código | Descripción               |
|--------|---------------------------|
| `404`  | Comisión no encontrada    |
| `500`  | Error interno del servidor|

**cURL:**

```bash
curl -X PUT http://localhost:5003/api/payments/commission/d4e5f6a7-b8c9-0123-defa-234567890123 \
  -H "Content-Type: application/json" \
  -d '{"status": "paid"}'
```

---

### POST /api/payments/sponsorship

Registra un nuevo patrocinio de un sponsor.

**Autenticación requerida:** No

**Body:**

```json
{
  "sponsorId": "e5f6a7b8-c9d0-1234-efab-345678901234",
  "sponsorName": "Empresa XYZ S.A.S.",
  "type": "banner",
  "amount": 500000,
  "duration": 30,
  "targetAudience": "jóvenes 18-35 Bogotá",
  "startDate": "2024-02-01",
  "endDate": "2024-03-01"
}
```

| Campo            | Tipo   | Requerido | Descripción                                          |
|------------------|--------|-----------|------------------------------------------------------|
| `sponsorId`      | UUID   | ✅        | ID del usuario/empresa patrocinadora                 |
| `sponsorName`    | string | ✅        | Nombre del patrocinador                              |
| `type`           | string | ✅        | Tipo de patrocinio: `"banner"`, `"featured"`, etc.   |
| `amount`         | number | ✅        | Monto del patrocinio                                 |
| `duration`       | number | ✅        | Duración en días                                     |
| `targetAudience` | string | ❌        | Descripción del público objetivo                     |
| `startDate`      | string | ✅        | Fecha de inicio (ISO 8601: `YYYY-MM-DD`)             |
| `endDate`        | string | ✅        | Fecha de fin (ISO 8601: `YYYY-MM-DD`)                |

**Response 201 — Éxito:**

```json
{
  "id": "f6a7b8c9-d0e1-2345-fabc-456789012345",
  "sponsorId": "e5f6a7b8-c9d0-1234-efab-345678901234",
  "sponsorName": "Empresa XYZ S.A.S.",
  "type": "banner",
  "amount": 500000,
  "duration": 30,
  "targetAudience": "jóvenes 18-35 Bogotá",
  "startDate": "2024-02-01T00:00:00.000Z",
  "endDate": "2024-03-01T00:00:00.000Z",
  "status": "active",
  "createdAt": "2024-01-15T13:00:00.000Z"
}
```

**Errores:**

| Código | Descripción                                                                              |
|--------|------------------------------------------------------------------------------------------|
| `400`  | Faltan campos requeridos: `sponsorId`, `sponsorName`, `type`, `amount`, `duration`, `startDate`, `endDate` |
| `500`  | Error interno del servidor                                                               |

**cURL:**

```bash
curl -X POST http://localhost:5003/api/payments/sponsorship \
  -H "Content-Type: application/json" \
  -d '{
    "sponsorId": "e5f6a7b8-c9d0-1234-efab-345678901234",
    "sponsorName": "Empresa XYZ S.A.S.",
    "type": "banner",
    "amount": 500000,
    "duration": 30,
    "startDate": "2024-02-01",
    "endDate": "2024-03-01"
  }'
```

---

### GET /api/payments/sponsorships

Lista todos los patrocinios registrados.

**Autenticación requerida:** No

**Response 200 — Éxito:** Array de objetos `Sponsorship`.

**cURL:**

```bash
curl http://localhost:5003/api/payments/sponsorships
```

---

### PUT /api/payments/sponsorship/:id

Actualiza el estado, tasa de conversión, audiencia objetivo o fecha de fin de un patrocinio.

**Autenticación requerida:** No

**Body (todos los campos son opcionales):**

```json
{
  "status": "completed",
  "conversionRate": 3.5,
  "targetAudience": "adultos 25-45 Medellín",
  "endDate": "2024-04-01"
}
```

| Campo            | Tipo   | Descripción                                          |
|------------------|--------|------------------------------------------------------|
| `status`         | string | Estado: `"active"`, `"paused"`, `"completed"`        |
| `conversionRate` | number | Tasa de conversión registrada (%)                    |
| `targetAudience` | string | Audiencia objetivo actualizada                       |
| `endDate`        | string | Nueva fecha de fin (ISO 8601)                        |

**Response 200 — Éxito:** Objeto `Sponsorship` actualizado.

**Errores:**

| Código | Descripción               |
|--------|---------------------------|
| `404`  | Patrocinio no encontrado  |
| `500`  | Error interno del servidor|

**cURL:**

```bash
curl -X PUT http://localhost:5003/api/payments/sponsorship/f6a7b8c9-d0e1-2345-fabc-456789012345 \
  -H "Content-Type: application/json" \
  -d '{"status": "completed", "conversionRate": 3.5}'
```

---

## 7. Notification Service — Puerto 5004

Base URL: `http://localhost:5004/api/notifications`

Gestiona notificaciones in-app y envío de emails transaccionales mediante Nodemailer.

---

### POST /api/notifications/send

Crea una notificación in-app para un usuario. Opcionalmente también envía un email.

**Autenticación requerida:** No

**Body:**

```json
{
  "userId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "type": "donation_accepted",
  "title": "¡Tu solicitud fue aceptada!",
  "message": "El donante ha aceptado tu solicitud para la Bicicleta de montaña.",
  "relatedId": "c3d4e5f6-a7b8-9012-cdef-123456789012",
  "sendEmail": true,
  "email": "carlos@example.com"
}
```

| Campo       | Tipo    | Requerido | Descripción                                                    |
|-------------|---------|-----------|----------------------------------------------------------------|
| `userId`    | UUID    | ✅        | ID del usuario destinatario                                    |
| `type`      | string  | ✅        | Tipo de notificación (ej: `"donation_accepted"`, `"new_message"`) |
| `title`     | string  | ✅        | Título de la notificación                                      |
| `message`   | string  | ✅        | Cuerpo del mensaje                                             |
| `relatedId` | UUID    | ❌        | ID del recurso relacionado (orden, producto, etc.)             |
| `sendEmail` | boolean | ❌        | Si `true`, también envía un email al usuario                   |
| `email`     | string  | ❌        | Email destino (requerido si `sendEmail` es `true`)             |

**Response 201 — Éxito:**

```json
{
  "id": "a7b8c9d0-e1f2-3456-abcd-567890123456",
  "userId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "type": "donation_accepted",
  "title": "¡Tu solicitud fue aceptada!",
  "message": "El donante ha aceptado tu solicitud para la Bicicleta de montaña.",
  "relatedId": "c3d4e5f6-a7b8-9012-cdef-123456789012",
  "read": false,
  "createdAt": "2024-01-15T14:00:00.000Z"
}
```

> **Nota:** Si `sendEmail` es `true` pero el envío de email falla, la notificación in-app se crea igualmente. El error de email se registra en los logs del servidor pero no afecta la respuesta HTTP.

**Errores:**

| Código | Descripción                                              |
|--------|----------------------------------------------------------|
| `400`  | Faltan campos requeridos: `userId`, `type`, `title`, `message` |
| `500`  | Error interno del servidor                               |

**cURL:**

```bash
curl -X POST http://localhost:5004/api/notifications/send \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "type": "donation_accepted",
    "title": "¡Tu solicitud fue aceptada!",
    "message": "El donante ha aceptado tu solicitud."
  }'
```

---

### GET /api/notifications/user/:userId

Obtiene todas las notificaciones de un usuario, ordenadas de más reciente a más antigua.

**Autenticación requerida:** No

**Parámetros de ruta:**

| Parámetro | Tipo | Descripción    |
|-----------|------|----------------|
| `userId`  | UUID | ID del usuario |

**Response 200 — Éxito:**

```json
[
  {
    "id": "a7b8c9d0-e1f2-3456-abcd-567890123456",
    "userId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "type": "donation_accepted",
    "title": "¡Tu solicitud fue aceptada!",
    "message": "El donante ha aceptado tu solicitud.",
    "read": false,
    "createdAt": "2024-01-15T14:00:00.000Z"
  }
]
```

**cURL:**

```bash
curl http://localhost:5004/api/notifications/user/a1b2c3d4-e5f6-7890-abcd-ef1234567890
```

---

### PUT /api/notifications/:id/read

Marca una notificación como leída.

**Autenticación requerida:** No

**Parámetros de ruta:**

| Parámetro | Tipo | Descripción           |
|-----------|------|-----------------------|
| `id`      | UUID | ID de la notificación |

**Response 200 — Éxito:** Objeto `Notification` con `read: true`.

**Errores:**

| Código | Descripción               |
|--------|---------------------------|
| `404`  | Notificación no encontrada|
| `500`  | Error interno del servidor|

**cURL:**

```bash
curl -X PUT http://localhost:5004/api/notifications/a7b8c9d0-e1f2-3456-abcd-567890123456/read
```

---

### DELETE /api/notifications/:id

Elimina una notificación.

**Autenticación requerida:** No

**Response 200 — Éxito:**

```json
{ "msg": "Notification deleted" }
```

**Errores:**

| Código | Descripción               |
|--------|---------------------------|
| `404`  | Notificación no encontrada|
| `500`  | Error interno del servidor|

**cURL:**

```bash
curl -X DELETE http://localhost:5004/api/notifications/a7b8c9d0-e1f2-3456-abcd-567890123456
```

---

### POST /api/notifications/email _(legacy)_

Envía un email directamente sin crear una notificación in-app. Endpoint de compatibilidad hacia atrás.

**Autenticación requerida:** No

**Body:**

```json
{
  "to": "destinatario@example.com",
  "subject": "Asunto del correo",
  "text": "Cuerpo del mensaje en texto plano."
}
```

**Response 200 — Éxito:**

```json
{ "msg": "Email sent" }
```

**Errores:**

| Código | Descripción                    |
|--------|--------------------------------|
| `500`  | Fallo al enviar el email       |

**cURL:**

```bash
curl -X POST http://localhost:5004/api/notifications/email \
  -H "Content-Type: application/json" \
  -d '{
    "to": "destinatario@example.com",
    "subject": "Prueba de email",
    "text": "Este es un mensaje de prueba."
  }'
```

---

## 8. Messaging Service — Puerto 5005

Base URL: `http://localhost:5005/api/messages`  
WebSocket: `ws://localhost:5005`

Gestiona conversaciones y mensajes entre usuarios. Soporta tanto REST (para persistencia) como WebSocket (para mensajería en tiempo real).

---

### POST /api/messages/create

Envía un mensaje. Si no existe una conversación previa, la crea automáticamente.

**Autenticación requerida:** No

**Body — Mensaje en conversación existente:**

```json
{
  "conversationId": "b8c9d0e1-f2a3-4567-bcde-678901234567",
  "senderId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "senderName": "María García",
  "content": "Hola, ¿sigue disponible la bicicleta?"
}
```

**Body — Primer mensaje (crea conversación nueva):**

```json
{
  "senderId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "senderName": "María García",
  "content": "Hola, ¿sigue disponible la bicicleta?",
  "participantIds": [
    "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "f9e8d7c6-b5a4-3210-fedc-ba9876543210"
  ],
  "productId": "b2c3d4e5-f6a7-8901-bcde-f12345678901",
  "orderId": "c3d4e5f6-a7b8-9012-cdef-123456789012"
}
```

| Campo             | Tipo     | Requerido | Descripción                                                                 |
|-------------------|----------|-----------|-----------------------------------------------------------------------------|
| `senderId`        | UUID     | ✅        | ID del usuario que envía el mensaje                                         |
| `senderName`      | string   | ✅        | Nombre del remitente                                                        |
| `content`         | string   | ✅        | Contenido del mensaje                                                       |
| `conversationId`  | UUID     | ❌        | ID de conversación existente. Si se omite, se crea una nueva               |
| `participantIds`  | UUID[]   | ❌*       | Array de exactamente 2 IDs de usuario. Requerido si no hay `conversationId` |
| `productId`       | UUID     | ❌        | Producto relacionado con la conversación                                    |
| `orderId`         | UUID     | ❌        | Solicitud de donación relacionada                                           |

**Response 201 — Éxito:**

```json
{
  "conversation": {
    "id": "b8c9d0e1-f2a3-4567-bcde-678901234567",
    "participantIds": [
      "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
      "f9e8d7c6-b5a4-3210-fedc-ba9876543210"
    ],
    "productId": "b2c3d4e5-f6a7-8901-bcde-f12345678901",
    "createdAt": "2024-01-15T15:00:00.000Z"
  },
  "message": {
    "id": "c9d0e1f2-a3b4-5678-cdef-789012345678",
    "conversationId": "b8c9d0e1-f2a3-4567-bcde-678901234567",
    "senderId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "senderName": "María García",
    "content": "Hola, ¿sigue disponible la bicicleta?",
    "read": false,
    "createdAt": "2024-01-15T15:00:00.000Z"
  }
}
```

**Errores:**

| Código | Descripción                                                                 |
|--------|-----------------------------------------------------------------------------|
| `400`  | Faltan `senderId`, `senderName` o `content`                                 |
| `400`  | `participantIds` debe ser un array de exactamente 2 IDs (si no hay `conversationId`) |
| `404`  | Conversación no encontrada (si se proveyó `conversationId`)                 |
| `500`  | Error interno del servidor                                                  |

**cURL:**

```bash
# Primer mensaje (crea conversación)
curl -X POST http://localhost:5005/api/messages/create \
  -H "Content-Type: application/json" \
  -d '{
    "senderId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "senderName": "María García",
    "content": "Hola, ¿sigue disponible la bicicleta?",
    "participantIds": [
      "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
      "f9e8d7c6-b5a4-3210-fedc-ba9876543210"
    ],
    "productId": "b2c3d4e5-f6a7-8901-bcde-f12345678901"
  }'
```

---

### GET /api/messages/conversation/:conversationId

Obtiene todos los mensajes de una conversación, ordenados cronológicamente (más antiguo primero).

**Autenticación requerida:** No

**Parámetros de ruta:**

| Parámetro        | Tipo | Descripción           |
|------------------|------|-----------------------|
| `conversationId` | UUID | ID de la conversación |

**Response 200 — Éxito:**

```json
{
  "conversation": {
    "id": "b8c9d0e1-f2a3-4567-bcde-678901234567",
    "participantIds": ["...", "..."],
    "productId": "..."
  },
  "messages": [
    {
      "id": "c9d0e1f2-a3b4-5678-cdef-789012345678",
      "senderId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
      "senderName": "María García",
      "content": "Hola, ¿sigue disponible la bicicleta?",
      "read": false,
      "createdAt": "2024-01-15T15:00:00.000Z"
    }
  ]
}
```

**Errores:**

| Código | Descripción               |
|--------|---------------------------|
| `404`  | Conversación no encontrada|
| `500`  | Error interno del servidor|

**cURL:**

```bash
curl http://localhost:5005/api/messages/conversation/b8c9d0e1-f2a3-4567-bcde-678901234567
```

---

### GET /api/messages/user/:userId

Obtiene todas las conversaciones en las que participa un usuario.

**Autenticación requerida:** No

**Parámetros de ruta:**

| Parámetro | Tipo | Descripción    |
|-----------|------|----------------|
| `userId`  | UUID | ID del usuario |

**Response 200 — Éxito:** Array de objetos `Conversation`.

**cURL:**

```bash
curl http://localhost:5005/api/messages/user/a1b2c3d4-e5f6-7890-abcd-ef1234567890
```

---

### PUT /api/messages/:id/read

Marca un mensaje como leído.

**Autenticación requerida:** No

**Response 200 — Éxito:** Objeto `Message` con `read: true`.

**Errores:**

| Código | Descripción               |
|--------|---------------------------|
| `404`  | Mensaje no encontrado     |
| `500`  | Error interno del servidor|

**cURL:**

```bash
curl -X PUT http://localhost:5005/api/messages/c9d0e1f2-a3b4-5678-cdef-789012345678/read
```

---

### DELETE /api/messages/:id

Elimina un mensaje.

**Autenticación requerida:** No

**Response 200 — Éxito:**

```json
{ "msg": "Message deleted" }
```

**Errores:**

| Código | Descripción               |
|--------|---------------------------|
| `404`  | Mensaje no encontrado     |
| `500`  | Error interno del servidor|

**cURL:**

```bash
curl -X DELETE http://localhost:5005/api/messages/c9d0e1f2-a3b4-5678-cdef-789012345678
```

---

### WebSocket: `ws://localhost:5005`

El Messaging Service expone un servidor WebSocket en el mismo puerto que el HTTP. Permite mensajería en tiempo real dentro de una conversación.

#### Protocolo de mensajes

Todos los mensajes se envían y reciben como **JSON serializado** (`JSON.stringify` / `JSON.parse`).

**1. Unirse a una sala (conversación):**

```json
{
  "type": "join",
  "conversationId": "b8c9d0e1-f2a3-4567-bcde-678901234567"
}
```

Respuesta del servidor:

```json
{
  "type": "joined",
  "conversationId": "b8c9d0e1-f2a3-4567-bcde-678901234567"
}
```

**2. Enviar un mensaje en tiempo real:**

```json
{
  "type": "message",
  "conversationId": "b8c9d0e1-f2a3-4567-bcde-678901234567",
  "senderId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "senderName": "María García",
  "content": "¡Perfecto, nos vemos mañana!"
}
```

Broadcast a todos los participantes en la sala:

```json
{
  "type": "message",
  "conversationId": "b8c9d0e1-f2a3-4567-bcde-678901234567",
  "senderId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "senderName": "María García",
  "content": "¡Perfecto, nos vemos mañana!",
  "timestamp": "2024-01-15T15:05:00.000Z"
}
```

> **Nota:** El WebSocket solo transmite mensajes en tiempo real. Para persistencia, usa `POST /api/messages/create` en paralelo.

**Ejemplo con wscat:**

```bash
# Instalar wscat
npm install -g wscat

# Conectar
wscat -c ws://localhost:5005

# Unirse a una sala
> {"type":"join","conversationId":"b8c9d0e1-f2a3-4567-bcde-678901234567"}

# Enviar mensaje
> {"type":"message","conversationId":"b8c9d0e1-f2a3-4567-bcde-678901234567","senderId":"a1b2c3d4-e5f6-7890-abcd-ef1234567890","senderName":"María","content":"Hola!"}
```

---

## 9. Analytics Service — Puerto 5006

Base URL: `http://localhost:5006/api/analytics`

Registra y consulta eventos de comportamiento de usuarios en la plataforma.

---

### POST /api/analytics/track

Registra un evento de analytics.

**Autenticación requerida:** No

**Body:**

```json
{
  "userId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "eventType": "product_viewed",
  "productId": "b2c3d4e5-f6a7-8901-bcde-f12345678901",
  "metadata": {
    "source": "home_feed",
    "sessionId": "sess_abc123"
  }
}
```

| Campo       | Tipo   | Requerido | Descripción                                                                                    |
|-------------|--------|-----------|------------------------------------------------------------------------------------------------|
| `eventType` | string | ✅        | Tipo de evento. Valores válidos: `"product_viewed"`, `"donation_requested"`, `"donation_completed"`, `"sponsor_clicked"` |
| `userId`    | UUID   | ❌        | ID del usuario que generó el evento (puede ser anónimo)                                        |
| `productId` | UUID   | ❌        | ID del producto relacionado con el evento                                                      |
| `metadata`  | object | ❌        | Datos adicionales en formato JSON libre                                                        |

**Response 201 — Éxito:**

```json
{
  "id": "d0e1f2a3-b4c5-6789-defa-890123456789",
  "userId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "eventType": "product_viewed",
  "productId": "b2c3d4e5-f6a7-8901-bcde-f12345678901",
  "metadata": { "source": "home_feed" },
  "timestamp": "2024-01-15T16:00:00.000Z"
}
```

**Errores:**

| Código | Descripción                    |
|--------|--------------------------------|
| `400`  | `eventType` es requerido       |
| `500`  | Error interno del servidor     |

**cURL:**

```bash
curl -X POST http://localhost:5006/api/analytics/track \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "eventType": "product_viewed",
    "productId": "b2c3d4e5-f6a7-8901-bcde-f12345678901"
  }'
```

---

### GET /api/analytics/user/:userId

Obtiene todos los eventos de analytics de un usuario específico.

**Autenticación requerida:** No

**Parámetros de ruta:**

| Parámetro | Tipo | Descripción    |
|-----------|------|----------------|
| `userId`  | UUID | ID del usuario |

**Response 200 — Éxito:** Array de eventos ordenados por `timestamp` descendente.

**cURL:**

```bash
curl http://localhost:5006/api/analytics/user/a1b2c3d4-e5f6-7890-abcd-ef1234567890
```

---

### GET /api/analytics/product/:productId

Obtiene todos los eventos de analytics relacionados con un producto.

**Autenticación requerida:** No

**Parámetros de ruta:**

| Parámetro   | Tipo | Descripción      |
|-------------|------|------------------|
| `productId` | UUID | ID del producto  |

**Response 200 — Éxito:** Array de eventos ordenados por `timestamp` descendente.

**cURL:**

```bash
curl http://localhost:5006/api/analytics/product/b2c3d4e5-f6a7-8901-bcde-f12345678901
```

---

### GET /api/analytics/dashboard

Devuelve estadísticas agregadas para el panel de administración.

**Autenticación requerida:** No

**Response 200 — Éxito:**

```json
{
  "totalEvents": 1542,
  "recentEvents": 287,
  "eventTypeCounts": [
    { "eventType": "product_viewed", "count": "1100" },
    { "eventType": "donation_requested", "count": "320" },
    { "eventType": "donation_completed", "count": "98" },
    { "eventType": "sponsor_clicked", "count": "24" }
  ],
  "topProducts": [
    { "productId": "b2c3d4e5-...", "views": "45" },
    { "productId": "c3d4e5f6-...", "views": "38" }
  ],
  "donationFunnel": {
    "requested": 320,
    "completed": 98,
    "conversionRate": "30.63%"
  },
  "sponsorClicks": 24
}
```

| Campo              | Descripción                                              |
|--------------------|----------------------------------------------------------|
| `totalEvents`      | Total de eventos registrados en la plataforma            |
| `recentEvents`     | Eventos de los últimos 7 días                            |
| `eventTypeCounts`  | Conteo de eventos agrupado por tipo                      |
| `topProducts`      | Top 10 productos más vistos (`product_viewed`)           |
| `donationFunnel`   | Embudo de conversión: solicitudes vs. donaciones completadas |
| `sponsorClicks`    | Total de clics en patrocinios                            |

**cURL:**

```bash
curl http://localhost:5006/api/analytics/dashboard
```

---

## 10. Admin Service — Puerto 5007

Base URL: `http://localhost:5007/api/admin`

Gestiona reportes de usuarios y acciones de moderación. Los endpoints de moderación requieren rol `admin`.

---

### POST /api/admin/report

Crea un reporte de un usuario contra otro. Cualquier usuario autenticado puede reportar.

**Autenticación requerida:** No (el `reporterUserId` se envía en el body)

**Body:**

```json
{
  "reportedUserId": "f9e8d7c6-b5a4-3210-fedc-ba9876543210",
  "reporterUserId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "reason": "El usuario publicó contenido inapropiado en su perfil."
}
```

| Campo            | Tipo   | Requerido | Descripción                                    |
|------------------|--------|-----------|------------------------------------------------|
| `reportedUserId` | UUID   | ✅        | ID del usuario reportado                       |
| `reporterUserId` | UUID   | ✅        | ID del usuario que hace el reporte             |
| `reason`         | string | ✅        | Motivo del reporte                             |

**Response 201 — Éxito:**

```json
{
  "id": "e1f2a3b4-c5d6-7890-efab-901234567890",
  "reportedUserId": "f9e8d7c6-b5a4-3210-fedc-ba9876543210",
  "reporterUserId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "reason": "El usuario publicó contenido inapropiado.",
  "status": "pending",
  "action": "none",
  "createdAt": "2024-01-15T17:00:00.000Z",
  "updatedAt": "2024-01-15T17:00:00.000Z"
}
```

**Errores:**

| Código | Descripción                                                          |
|--------|----------------------------------------------------------------------|
| `400`  | Faltan campos requeridos: `reportedUserId`, `reporterUserId`, `reason` |
| `400`  | Un usuario no puede reportarse a sí mismo                            |
| `500`  | Error interno del servidor                                           |

**cURL:**

```bash
curl -X POST http://localhost:5007/api/admin/report \
  -H "Content-Type: application/json" \
  -d '{
    "reportedUserId": "f9e8d7c6-b5a4-3210-fedc-ba9876543210",
    "reporterUserId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "reason": "Contenido inapropiado."
  }'
```

---

### GET /api/admin/reports

Lista todos los reportes. Soporta filtrado por estado.

**Autenticación requerida:** Sí (JWT con `role: "admin"`)

**Headers:**

| Header          | Valor                  |
|-----------------|------------------------|
| `Authorization` | `Bearer <admin_token>` |

**Query parameters (opcionales):**

| Parámetro | Tipo   | Descripción                                              |
|-----------|--------|----------------------------------------------------------|
| `status`  | string | Filtrar por estado: `"pending"`, `"reviewed"`, `"resolved"` |

**Response 200 — Éxito:**

```json
[
  {
    "id": "e1f2a3b4-c5d6-7890-efab-901234567890",
    "reportedUserId": "f9e8d7c6-b5a4-3210-fedc-ba9876543210",
    "reporterUserId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "reason": "Contenido inapropiado.",
    "status": "pending",
    "action": "none",
    "createdAt": "2024-01-15T17:00:00.000Z"
  }
]
```

**Errores:**

| Código | Descripción                    |
|--------|--------------------------------|
| `401`  | Token ausente o inválido       |
| `403`  | El token no tiene rol `admin`  |
| `500`  | Error interno del servidor     |

**cURL:**

```bash
# Todos los reportes
curl http://localhost:5007/api/admin/reports \
  -H "Authorization: Bearer TU_ADMIN_JWT_TOKEN"

# Solo reportes pendientes
curl "http://localhost:5007/api/admin/reports?status=pending" \
  -H "Authorization: Bearer TU_ADMIN_JWT_TOKEN"
```

---

### PUT /api/admin/reports/:id

Actualiza el estado y/o la acción tomada sobre un reporte.

**Autenticación requerida:** Sí (JWT con `role: "admin"`)

**Body:**

```json
{
  "status": "resolved",
  "action": "warning"
}
```

| Campo    | Tipo   | Descripción                                                    |
|----------|--------|----------------------------------------------------------------|
| `status` | string | Estado: `"pending"`, `"reviewed"`, `"resolved"`                |
| `action` | string | Acción: `"none"`, `"warning"`, `"suspend"`, `"ban"`            |

**Response 200 — Éxito:** Objeto `Report` actualizado.

**Errores:**

| Código | Descripción                    |
|--------|--------------------------------|
| `401`  | Token ausente o inválido       |
| `403`  | El token no tiene rol `admin`  |
| `404`  | Reporte no encontrado          |
| `500`  | Error interno del servidor     |

**cURL:**

```bash
curl -X PUT http://localhost:5007/api/admin/reports/e1f2a3b4-c5d6-7890-efab-901234567890 \
  -H "Authorization: Bearer TU_ADMIN_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"status": "resolved", "action": "warning"}'
```

---

### POST /api/admin/users/:id/suspend

Suspende a un usuario. Registra la acción como un reporte resuelto con `action: "suspend"`.

**Autenticación requerida:** Sí (JWT con `role: "admin"`)

**Parámetros de ruta:**

| Parámetro | Tipo | Descripción              |
|-----------|------|--------------------------|
| `id`      | UUID | ID del usuario a suspender |

**Body (opcional):**

```json
{ "reason": "Violación reiterada de las normas de la comunidad." }
```

**Response 200 — Éxito:**

```json
{
  "msg": "User f9e8d7c6-b5a4-3210-fedc-ba9876543210 has been suspended",
  "report": {
    "id": "f2a3b4c5-d6e7-8901-fabc-012345678901",
    "reportedUserId": "f9e8d7c6-b5a4-3210-fedc-ba9876543210",
    "reporterUserId": "<admin_userId>",
    "reason": "Violación reiterada de las normas de la comunidad.",
    "status": "resolved",
    "action": "suspend"
  }
}
```

**Errores:**

| Código | Descripción                    |
|--------|--------------------------------|
| `401`  | Token ausente o inválido       |
| `403`  | El token no tiene rol `admin`  |
| `500`  | Error interno del servidor     |

**cURL:**

```bash
curl -X POST http://localhost:5007/api/admin/users/f9e8d7c6-b5a4-3210-fedc-ba9876543210/suspend \
  -H "Authorization: Bearer TU_ADMIN_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"reason": "Violación reiterada de las normas."}'
```

---

### POST /api/admin/users/:id/ban

Banea permanentemente a un usuario. Registra la acción como un reporte resuelto con `action: "ban"`.

**Autenticación requerida:** Sí (JWT con `role: "admin"`)

**Parámetros de ruta:**

| Parámetro | Tipo | Descripción           |
|-----------|------|-----------------------|
| `id`      | UUID | ID del usuario a banear |

**Body (opcional):**

```json
{ "reason": "Fraude comprobado en múltiples transacciones." }
```

**Response 200 — Éxito:**

```json
{
  "msg": "User f9e8d7c6-b5a4-3210-fedc-ba9876543210 has been banned",
  "report": {
    "id": "a3b4c5d6-e7f8-9012-abcd-123456789012",
    "reportedUserId": "f9e8d7c6-b5a4-3210-fedc-ba9876543210",
    "reporterUserId": "<admin_userId>",
    "reason": "Fraude comprobado en múltiples transacciones.",
    "status": "resolved",
    "action": "ban"
  }
}
```

**Errores:**

| Código | Descripción                    |
|--------|--------------------------------|
| `401`  | Token ausente o inválido       |
| `403`  | El token no tiene rol `admin`  |
| `500`  | Error interno del servidor     |

**cURL:**

```bash
curl -X POST http://localhost:5007/api/admin/users/f9e8d7c6-b5a4-3210-fedc-ba9876543210/ban \
  -H "Authorization: Bearer TU_ADMIN_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"reason": "Fraude comprobado."}'
```

---

## 11. Códigos de error globales

| Código HTTP | Significado                                                                 |
|-------------|-----------------------------------------------------------------------------|
| `200`       | OK — Petición exitosa                                                       |
| `201`       | Created — Recurso creado exitosamente                                       |
| `400`       | Bad Request — Faltan campos requeridos o los datos son inválidos            |
| `401`       | Unauthorized — Token JWT ausente o inválido                                 |
| `403`       | Forbidden — El token es válido pero no tiene los permisos necesarios        |
| `404`       | Not Found — El recurso solicitado no existe                                 |
| `500`       | Internal Server Error — Error inesperado en el servidor                     |

### Formato de error estándar

```json
{ "error": "Descripción del error" }
```

o en algunos casos:

```json
{ "msg": "Descripción del error" }
```

---

*Documentación generada para NuevaVida v1.0 · Todos los IDs son UUIDs v4*
