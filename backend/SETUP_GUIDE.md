# NuevaVida — Guía de Configuración para Desarrolladores

> Guía paso a paso para levantar el backend de NuevaVida en un ambiente local de desarrollo.

---

## Tabla de contenidos

1. [Requisitos previos](#1-requisitos-previos)
2. [Estructura del proyecto](#2-estructura-del-proyecto)
3. [Configuración del ambiente local](#3-configuración-del-ambiente-local)
4. [Variables de entorno](#4-variables-de-entorno)
5. [Correr los servicios localmente](#5-correr-los-servicios-localmente)
6. [Conexión a la base de datos](#6-conexión-a-la-base-de-datos)
7. [Testing de endpoints con cURL](#7-testing-de-endpoints-con-curl)
8. [Flujo de integración completo](#8-flujo-de-integración-completo)
9. [Solución de problemas comunes](#9-solución-de-problemas-comunes)

---

## 1. Requisitos previos

Asegúrate de tener instaladas las siguientes herramientas antes de comenzar:

| Herramienta       | Versión mínima | Verificar                        |
|-------------------|----------------|----------------------------------|
| Node.js           | 20.x           | `node --version`                 |
| npm               | 10.x           | `npm --version`                  |
| Docker            | 24.x           | `docker --version`               |
| Docker Compose    | 2.x            | `docker compose version`         |
| MySQL             | 8.0 (via Docker) | —                              |
| Git               | 2.x            | `git --version`                  |

**Opcional (recomendado):**

- **nodemon** — Recarga automática en desarrollo: `npm install -g nodemon`
- **wscat** — Testing de WebSocket: `npm install -g wscat`
- **TablePlus / DBeaver** — Cliente GUI para MySQL

---

## 2. Estructura del proyecto

```
backend/
├── admin-service/          # Puerto 5007 — Reportes y moderación
│   ├── middleware/
│   │   └── adminAuth.js    # Middleware JWT con verificación de rol admin
│   ├── models/
│   │   └── report.js       # Modelo Report (Sequelize)
│   ├── routes/
│   │   └── admin.js        # Endpoints /api/admin
│   ├── db.js               # Conexión MySQL + modelos
│   ├── index.js            # Entry point del servicio
│   └── package.json
│
├── analytics-service/      # Puerto 5006 — Eventos y estadísticas
│   ├── models/
│   │   └── analytics.js    # Modelo Analytics (Sequelize)
│   ├── routes/
│   │   └── analytics.js    # Endpoints /api/analytics
│   ├── db.js
│   ├── index.js
│   └── package.json
│
├── messaging-service/      # Puerto 5005 — Chat + WebSocket
│   ├── models/
│   │   └── message.js      # Modelos Conversation y Message
│   ├── routes/
│   │   └── message.js      # Endpoints /api/messages
│   ├── websocket.js        # Servidor WebSocket (ws://)
│   ├── db.js
│   ├── index.js
│   └── package.json
│
├── notification-service/   # Puerto 5004 — Notificaciones + Email
│   ├── models/
│   │   └── notification.js # Modelo Notification
│   ├── routes/
│   │   └── notification.js # Endpoints /api/notifications
│   ├── services/
│   │   └── emailService.js # Integración Nodemailer
│   ├── db.js
│   ├── index.js
│   └── package.json
│
├── order-service/          # Puerto 5002 — Solicitudes de donación
│   ├── models/
│   │   └── order.js        # Modelo DonationRequest
│   ├── routes/
│   │   └── order.js        # Endpoints /api/orders
│   ├── db.js
│   ├── index.js
│   └── package.json
│
├── payment-service/        # Puerto 5003 — Comisiones y patrocinios
│   ├── models/
│   │   └── payment.js      # Modelos Commission y Sponsorship
│   ├── routes/
│   │   └── payment.js      # Endpoints /api/payments
│   ├── db.js
│   ├── index.js
│   └── package.json
│
├── product-service/        # Puerto 5001 — Catálogo de artículos
│   ├── models/
│   │   └── product.js      # Modelo Product
│   ├── routes/
│   │   └── product.js      # Endpoints /api/products
│   ├── db.js
│   ├── index.js
│   └── package.json
│
├── user-service/           # Puerto 5000 — Usuarios y autenticación
│   ├── models/
│   │   └── user.js         # Modelo User
│   ├── routes/
│   │   └── user.js         # Endpoints /api/users
│   ├── db.js
│   ├── index.js
│   └── package.json
│
├── docker-compose.yml      # Orquestación de todos los servicios
├── nginx.conf              # API Gateway / Load Balancer
├── init.sql                # Script de inicialización de bases de datos
├── API_DOCUMENTATION.md    # Documentación completa de endpoints
└── SETUP_GUIDE.md          # Este archivo
```

---

## 3. Configuración del ambiente local

### Opción A — Docker Compose (Recomendado)

La forma más rápida de levantar todo el stack. Docker Compose inicia MySQL, todos los microservicios y Nginx automáticamente.

```bash
# 1. Clonar el repositorio
git clone https://github.com/edier1996/nuevavida.git
cd nuevavida/backend

# 2. Crear el archivo de variables de entorno
cp .env.example .env   # Si existe, o créalo manualmente (ver sección 4)

# 3. Levantar todos los servicios
docker compose up --build

# Para correr en segundo plano (detached)
docker compose up --build -d

# Ver logs en tiempo real
docker compose logs -f

# Ver logs de un servicio específico
docker compose logs -f user-service
```

Servicios disponibles tras el inicio:

| Servicio             | URL local                          |
|----------------------|------------------------------------|
| User Service         | `http://localhost:5000`            |
| Product Service      | `http://localhost:5001`            |
| Order Service        | `http://localhost:5002`            |
| Payment Service      | `http://localhost:5003`            |
| Notification Service | `http://localhost:5004`            |
| Messaging Service    | `http://localhost:5005`            |
| Analytics Service    | `http://localhost:5006`            |
| Admin Service        | `http://localhost:5007`            |
| phpMyAdmin           | `http://localhost:8081`            |
| Nginx (API Gateway)  | `http://localhost:80`              |

### Opción B — Servicios individuales (Desarrollo)

Útil cuando solo necesitas trabajar en un servicio específico. Requiere MySQL corriendo localmente o via Docker.

```bash
# Levantar solo MySQL con Docker
docker run -d \
  --name nuevavida-mysql \
  -e MYSQL_ROOT_PASSWORD=password \
  -e MYSQL_DATABASE=defaultdb \
  -p 3306:3306 \
  mysql:8.0

# Instalar dependencias de un servicio
cd backend/user-service
npm install

# Correr en modo desarrollo (con recarga automática)
npm run dev

# Correr en modo producción
npm start
```

Repite el proceso para cada servicio que necesites. Cada uno tiene su propio `package.json`.

---

## 4. Variables de entorno

Cada servicio lee su configuración desde variables de entorno. En desarrollo local, crea un archivo `.env` en la raíz de cada servicio (o en `backend/` para Docker Compose).

### Variables comunes a todos los servicios

```env
# Base de datos MySQL
DB_HOST=localhost          # "mysql" cuando se usa Docker Compose
DB_USER=root
DB_PASSWORD=password
DB_NAME=<nombre_de_la_db>  # Ver tabla abajo
PORT=<puerto_del_servicio> # Ver tabla abajo
```

### Base de datos y puerto por servicio

| Servicio             | `DB_NAME`     | `PORT` |
|----------------------|---------------|--------|
| user-service         | `userdb`      | `5000` |
| product-service      | `productdb`   | `5001` |
| order-service        | `orderdb`     | `5002` |
| payment-service      | `paymentdb`   | `5003` |
| notification-service | `notifdb`     | `5004` |
| messaging-service    | `messagingdb` | `5005` |
| analytics-service    | `analyticsdb` | `5006` |
| admin-service        | `admindb`     | `5007` |

### Variables específicas por servicio

#### User Service

```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=password
DB_NAME=userdb
PORT=5000
JWT_SECRET=tu-clave-secreta-super-segura-cambiar-en-produccion
```

#### Product Service

```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=password
DB_NAME=productdb
PORT=5001
```

#### Order Service

```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=password
DB_NAME=orderdb
PORT=5002
```

#### Payment Service

```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=password
DB_NAME=paymentdb
PORT=5003
```

#### Notification Service

```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=password
DB_NAME=notifdb
PORT=5004

# Nodemailer (Gmail)
NODEMAILER_EMAIL=tu-email@gmail.com
NODEMAILER_PASSWORD=tu-app-password-de-16-caracteres

# Twilio (SMS) — Opcional
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=tu_auth_token
TWILIO_PHONE_NUMBER=+1234567890
```

> **Configurar Gmail App Password:**
> 1. Activa la verificación en 2 pasos en tu cuenta Google
> 2. Ve a [myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords)
> 3. Genera una contraseña de aplicación para "Correo"
> 4. Usa esa contraseña de 16 caracteres como `NODEMAILER_PASSWORD`

#### Messaging Service

```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=password
DB_NAME=messagingdb
PORT=5005
```

#### Analytics Service

```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=password
DB_NAME=analyticsdb
PORT=5006
```

#### Admin Service

```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=password
DB_NAME=admindb
PORT=5007
JWT_SECRET=tu-clave-secreta-super-segura-cambiar-en-produccion
```

> ⚠️ El `JWT_SECRET` del Admin Service **debe ser idéntico** al del User Service, ya que los tokens de admin son emitidos por el User Service y verificados por el Admin Service.

### Archivo `.env` para Docker Compose

Crea un único archivo `backend/.env` con todas las variables:

```env
# JWT (compartido entre user-service y admin-service)
JWT_SECRET=mi-clave-secreta-local-cambiar-en-produccion

# Email (Notification Service)
NODEMAILER_EMAIL=tu-email@gmail.com
NODEMAILER_PASSWORD=tu-app-password

# Twilio (Notification Service) — Opcional
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=tu_auth_token
TWILIO_PHONE_NUMBER=+1234567890
```

> Las variables de base de datos (`DB_HOST`, `DB_USER`, etc.) ya están definidas directamente en `docker-compose.yml`.

### Notas de seguridad

- **Nunca** subas archivos `.env` al repositorio. Están en `.gitignore`.
- Usa valores distintos para desarrollo, staging y producción.
- Rota el `JWT_SECRET` periódicamente en producción.
- En Railway/producción, configura las variables desde el panel de Railway (no desde archivos `.env`).

---

## 5. Correr los servicios localmente

### Con Docker Compose

```bash
# Levantar todo el stack
docker compose up --build

# Detener todos los servicios
docker compose down

# Detener y eliminar volúmenes (borra datos de MySQL)
docker compose down -v

# Reiniciar un servicio específico
docker compose restart user-service

# Reconstruir solo un servicio
docker compose up --build user-service

# Ver estado de los contenedores
docker compose ps
```

### Sin Docker (servicio individual)

```bash
# Instalar dependencias
cd backend/user-service
npm install

# Modo desarrollo (nodemon — recarga automática)
npm run dev

# Modo producción
npm start
```

### Orden recomendado de inicio (sin Docker)

Si levantas los servicios manualmente, respeta este orden para evitar errores de dependencias:

1. **MySQL** (base de datos)
2. **user-service** (autenticación — otros servicios pueden depender de sus tokens)
3. **product-service**
4. **order-service**
5. **payment-service**
6. **notification-service**
7. **messaging-service**
8. **analytics-service**
9. **admin-service**

### Verificar que un servicio está corriendo

Cada servicio imprime en consola al iniciar correctamente:

```
✅ User Service is Connected to MySQL
Database synchronized
Server is running on port 5000
```

Si ves `🚫 Failed to connect to MySQL`, revisa las variables de entorno `DB_HOST`, `DB_USER`, `DB_PASSWORD` y `DB_NAME`.

---

## 6. Conexión a la base de datos

### Con Docker Compose — phpMyAdmin

Accede a `http://localhost:8081` con las siguientes credenciales:

| Campo    | Valor      |
|----------|------------|
| Host     | `mysql`    |
| Usuario  | `root`     |
| Password | `password` |

### Con cliente MySQL CLI

```bash
# Conectar al MySQL de Docker
mysql -h 127.0.0.1 -P 3306 -u root -p
# Ingresa la contraseña: password

# Ver bases de datos
SHOW DATABASES;

# Usar la base de datos del user-service
USE userdb;

# Ver tablas
SHOW TABLES;

# Consultar usuarios
SELECT id, name, email, createdAt FROM Users;
```

### Con TablePlus / DBeaver

Configura una nueva conexión con:

| Campo    | Valor       |
|----------|-------------|
| Host     | `127.0.0.1` |
| Puerto   | `3306`      |
| Usuario  | `root`      |
| Password | `password`  |
| Database | (cualquiera de las listadas arriba) |

### Sincronización automática de esquemas

Todos los servicios usan `sequelize.sync({ alter: true })` al iniciar, lo que significa que:

- Las tablas se crean automáticamente si no existen.
- Las columnas nuevas se agregan automáticamente.
- **No se eliminan** columnas existentes (modo `alter`, no `force`).

No necesitas ejecutar migraciones manualmente en desarrollo.

---

## 7. Testing de endpoints con cURL

### Flujo básico de autenticación

```bash
# 1. Registrar un usuario
curl -X POST http://localhost:5000/api/users/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Ana Martínez",
    "email": "ana@example.com",
    "password": "Password123"
  }'

# Guarda el token de la respuesta:
# {"token":"eyJ...","userId":"uuid-aqui","user":{...}}

# 2. Iniciar sesión
curl -X POST http://localhost:5000/api/users/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "ana@example.com",
    "password": "Password123"
  }'

# 3. Usar el token en peticiones protegidas
TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

curl http://localhost:5000/api/users/TU_USER_ID \
  -H "Authorization: Bearer $TOKEN"
```

### Flujo completo de donación

```bash
# Variables de entorno para el ejemplo
TOKEN="tu_jwt_token"
USER_ID="tu_user_id"

# 1. Publicar un artículo para donar
curl -X POST http://localhost:5001/api/products/create \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Silla de oficina ergonómica",
    "description": "Silla en excelente estado, con soporte lumbar.",
    "category": "muebles",
    "isGift": true,
    "condition": "bueno",
    "city": "Bogotá",
    "sellerId": "'"$USER_ID"'",
    "sellerEmail": "ana@example.com",
    "sellerName": "Ana Martínez"
  }'

# Guarda el productId de la respuesta
PRODUCT_ID="product-uuid-aqui"

# 2. Registrar que alguien vio el producto (analytics)
curl -X POST http://localhost:5006/api/analytics/track \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "'"$USER_ID"'",
    "eventType": "product_viewed",
    "productId": "'"$PRODUCT_ID"'"
  }'

# 3. Crear una solicitud de donación
curl -X POST http://localhost:5002/api/orders/create \
  -H "Content-Type: application/json" \
  -d '{
    "productId": "'"$PRODUCT_ID"'",
    "requesterId": "otro-user-id",
    "requesterEmail": "carlos@example.com",
    "requesterName": "Carlos Pérez",
    "donorId": "'"$USER_ID"'",
    "message": "Necesito la silla para trabajar desde casa.",
    "city": "Bogotá"
  }'

# Guarda el orderId
ORDER_ID="order-uuid-aqui"

# 4. Aceptar la solicitud (el donante actualiza el estado)
curl -X PUT http://localhost:5002/api/orders/$ORDER_ID \
  -H "Content-Type: application/json" \
  -d '{"status": "accepted"}'

# 5. Notificar al solicitante
curl -X POST http://localhost:5004/api/notifications/send \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "otro-user-id",
    "type": "donation_accepted",
    "title": "¡Tu solicitud fue aceptada!",
    "message": "Ana Martínez aceptó tu solicitud para la Silla de oficina.",
    "relatedId": "'"$ORDER_ID"'"
  }'

# 6. Registrar la donación completada
curl -X POST http://localhost:5006/api/analytics/track \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "otro-user-id",
    "eventType": "donation_completed",
    "productId": "'"$PRODUCT_ID"'"
  }'

# 7. Marcar el producto como entregado
curl -X PUT http://localhost:5001/api/products/$PRODUCT_ID \
  -H "Content-Type: application/json" \
  -d '{"sold": true, "donationStatus": "entregado", "status": "inactive"}'
```

### Testing del Messaging Service

```bash
# 1. Iniciar una conversación (primer mensaje)
curl -X POST http://localhost:5005/api/messages/create \
  -H "Content-Type: application/json" \
  -d '{
    "senderId": "user-id-1",
    "senderName": "Ana Martínez",
    "content": "Hola Carlos, ¿cuándo puedes pasar a recoger la silla?",
    "participantIds": ["user-id-1", "user-id-2"],
    "productId": "'"$PRODUCT_ID"'"
  }'

# Guarda el conversationId
CONV_ID="conversation-uuid-aqui"

# 2. Responder en la misma conversación
curl -X POST http://localhost:5005/api/messages/create \
  -H "Content-Type: application/json" \
  -d '{
    "conversationId": "'"$CONV_ID"'",
    "senderId": "user-id-2",
    "senderName": "Carlos Pérez",
    "content": "Puedo el sábado en la mañana, ¿te parece bien?"
  }'

# 3. Ver todos los mensajes de la conversación
curl http://localhost:5005/api/messages/conversation/$CONV_ID

# 4. Ver todas las conversaciones de un usuario
curl http://localhost:5005/api/messages/user/user-id-1
```

### Testing del Admin Service

```bash
# Primero necesitas un token con rol admin
# (El rol admin debe estar en el payload del JWT: { userId, role: "admin" })

ADMIN_TOKEN="tu_admin_jwt_token"

# 1. Ver todos los reportes pendientes
curl "http://localhost:5007/api/admin/reports?status=pending" \
  -H "Authorization: Bearer $ADMIN_TOKEN"

# 2. Crear un reporte de usuario
curl -X POST http://localhost:5007/api/admin/report \
  -H "Content-Type: application/json" \
  -d '{
    "reportedUserId": "user-id-reportado",
    "reporterUserId": "user-id-reportador",
    "reason": "Publicó artículos falsos repetidamente."
  }'

# 3. Resolver el reporte con una advertencia
REPORT_ID="report-uuid-aqui"
curl -X PUT http://localhost:5007/api/admin/reports/$REPORT_ID \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"status": "resolved", "action": "warning"}'

# 4. Suspender un usuario
curl -X POST http://localhost:5007/api/admin/users/user-id-reportado/suspend \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"reason": "Violación de términos de servicio."}'
```

### Testing del Analytics Dashboard

```bash
# Ver estadísticas del dashboard
curl http://localhost:5006/api/analytics/dashboard

# Ver eventos de un usuario específico
curl http://localhost:5006/api/analytics/user/user-id-1

# Ver eventos de un producto específico
curl http://localhost:5006/api/analytics/product/$PRODUCT_ID
```

### Testing del WebSocket con wscat

```bash
# Instalar wscat
npm install -g wscat

# Conectar al Messaging Service
wscat -c ws://localhost:5005

# Una vez conectado, unirse a una sala:
{"type":"join","conversationId":"tu-conversation-id"}

# Enviar un mensaje en tiempo real:
{"type":"message","conversationId":"tu-conversation-id","senderId":"user-id-1","senderName":"Ana","content":"Mensaje de prueba en tiempo real"}
```

---

## 8. Flujo de integración completo

Este diagrama muestra cómo interactúan los servicios en el flujo principal de NuevaVida:

```
Usuario A (Donante)                    Usuario B (Solicitante)
       │                                        │
       │ POST /api/products/create              │
       │──────────────────────────►             │
       │         (Product Service)              │
       │                                        │
       │                          GET /api/products
       │                          ◄─────────────│
       │                                        │
       │                    POST /api/analytics/track (product_viewed)
       │                          ◄─────────────│
       │                                        │
       │                    POST /api/orders/create
       │                          ◄─────────────│
       │                         (Order Service)│
       │                                        │
       │ PUT /api/orders/:id (status: accepted) │
       │──────────────────────────►             │
       │                                        │
       │                    POST /api/notifications/send
       │                          ──────────────►│
       │                    (Notification Service)│
       │                                        │
       │ POST /api/messages/create              │
       │◄──────────────────────────────────────►│
       │         (Messaging Service)            │
       │                                        │
       │ PUT /api/products/:id (sold: true)     │
       │──────────────────────────►             │
       │                                        │
       │                    POST /api/analytics/track (donation_completed)
       │                          ◄─────────────│
```

---

## 9. Solución de problemas comunes

### Error: `ECONNREFUSED 127.0.0.1:3306`

MySQL no está corriendo o no es accesible.

```bash
# Verificar que MySQL está corriendo (Docker)
docker ps | grep mysql

# Si no está corriendo, iniciarlo
docker compose up mysql

# Verificar conectividad
mysql -h 127.0.0.1 -P 3306 -u root -p
```

### Error: `🚫 Failed to connect to MySQL`

Las variables de entorno de base de datos son incorrectas.

```bash
# Verificar variables en el servicio
cat backend/user-service/.env

# Asegúrate de que DB_HOST sea "localhost" (desarrollo local)
# o "mysql" (dentro de Docker Compose)
```

### Error: `Token is not valid` (401)

El JWT expiró (duración: 1 hora) o el `JWT_SECRET` no coincide entre servicios.

```bash
# Volver a hacer login para obtener un token nuevo
curl -X POST http://localhost:5000/api/users/login \
  -H "Content-Type: application/json" \
  -d '{"email": "tu@email.com", "password": "tuPassword"}'

# Verificar que JWT_SECRET es idéntico en user-service y admin-service
```

### Error: `Access denied: admin role required` (403)

El token JWT no contiene `role: "admin"` en su payload.

Los tokens de admin deben generarse con el payload `{ userId, role: "admin" }`. Actualmente esto debe hacerse directamente en la base de datos o mediante un endpoint de administración interno.

### Error: `CORS blocked for origin`

El origen del frontend no está en la lista de orígenes permitidos.

Orígenes permitidos por defecto:
- `https://nuevavida1327.com`
- `https://nuevavida-production.up.railway.app`
- `http://localhost:8080`
- `http://localhost:5173`
- Cualquier subdominio `*.up.railway.app`

Para agregar un origen en desarrollo, edita el array `allowedOrigins` en el `index.js` del servicio correspondiente.

### Puerto ya en uso

```bash
# Encontrar qué proceso usa el puerto (ej: 5000)
lsof -i :5000        # macOS / Linux
netstat -ano | findstr :5000  # Windows

# Matar el proceso
kill -9 <PID>        # macOS / Linux
taskkill /PID <PID> /F  # Windows
```

### Tablas no se crean automáticamente

Sequelize usa `sync({ alter: true })` al iniciar. Si las tablas no se crean:

1. Verifica que la conexión a MySQL es exitosa (busca `✅ ... Connected to MySQL` en los logs).
2. Verifica que el usuario MySQL tiene permisos `CREATE TABLE`.
3. Revisa los logs del servicio para errores de Sequelize.

```bash
# Ver logs detallados de un servicio en Docker
docker compose logs user-service

# O en desarrollo local, el error aparece en la consola
```

### Reiniciar desde cero (borrar todos los datos)

```bash
# Detener servicios y eliminar volúmenes de MySQL
docker compose down -v

# Volver a levantar (recrea todas las tablas)
docker compose up --build
```

---

## Recursos adicionales

- [Documentación completa de endpoints](./API_DOCUMENTATION.md)
- [Guía de deployment en Kubernetes](./DEPLOYMENT.md)
- [Configuración de variables de entorno](./ENV_SETUP.md)
- [Node.js 20 Docs](https://nodejs.org/docs/latest-v20.x/api/)
- [Sequelize Docs](https://sequelize.org/docs/v6/)
- [Express.js Docs](https://expressjs.com/)
- [JWT.io — Debugger de tokens](https://jwt.io/)

---

*NuevaVida Backend · Node.js 20 · Express · MySQL 8 · Sequelize · Docker*
