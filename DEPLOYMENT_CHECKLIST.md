# ✅ Checklist Completo para Despliegue a Producción

## 🔥 Antes de Empezar
- [ ] Tienes acceso a la repo en GitHub
- [ ] Tienes conexión a internet estable
- [ ] Tienes 1 hora libre (el despliegue es rápido)
- [ ] Compraste/tendrás dominio (opcional, Railway da subdominio gratis)

---

## 📋 FASE 1: Preparación Local (15 minutos)

### 1.1 Verificar que todo está en orden localmente

```bash
# En la carpeta raíz del proyecto

# ✅ Verificar estructura
ls -la                          # Debe ver: backend/, src/, package.json
ls backend/                     # 6 servicios

# ✅ Verificar que package.json tiene scripts
grep '"build":' package.json   # Debe encontrar script de build

# ✅ Actualizar código
git status                      # Asegurar que está limpio
git add .
git commit -m "Pre-deployment commit"
git push origin main
```

- [ ] Estructura de carpetas está completa
- [ ] Todos los servicios están en `backend/`
- [ ] `package.json` en raíz con script `build`
- [ ] Archivos commitados a GitHub

### 1.2 Crear archivos necesarios para despliegue

He creado estos archivos para ti:

```
✅ Dockerfile.frontend         # Imagen Docker del frontend
✅ docker-compose.prod.yml     # Compose para producción
✅ .env.production.example     # Plantilla de variables
✅ DEPLOY_RAILWAY.md           # Guía detallada
✅ DEPLOYMENT_OPTIONS.md       # Opciones evaluadas
```

- [ ] Verificar que existen los archivos arriba

---

## 🛠️ FASE 2: Configuración de Servicios Externos (30 minutos)

### 2.1 MongoDB Atlas

**Tarea**: Obtener connection strings para cada base de datos

1. [ ] Ir a https://www.mongodb.com/cloud/atlas
2. [ ] Crear cuenta gratis
3. [ ] Crear proyecto "give-share-gain"
4. [ ] Crear cluster "production" (Free Tier)
5. [ ] Crear usuario DB: username="admin", password=GENERAR
6. [ ] Network Access: Agregar "0.0.0.0/0" (allow all)
7. [ ] Copiar connection string para cada DB:
   - [ ] `MONGO_URI_USERS`
   - [ ] `MONGO_URI_PRODUCTS`
   - [ ] `MONGO_URI_CART`
   - [ ] `MONGO_URI_ORDER`
   - [ ] `MONGO_URI_PAYMENT`

**Guardar en bloc de notas temporal** (usaremos en siguiente fase)

### 2.2 Stripe (Pagos)

**Tarea**: Obtener claves API de Stripe

1. [ ] Ir a https://dashboard.stripe.com/register
2. [ ] Crear cuenta
3. [ ] Ir a "API Keys"
4. [ ] Copiar:
   - [ ] `STRIPE_SECRET_KEY` (sk_live_...)
   - [ ] `STRIPE_PUBLISHABLE_KEY` (pk_live_...)
5. [ ] También copiar webhook secret si lo tienes

**Guardar en bloc de notas temporal**

### 2.3 Gmail (Email)

**Tarea**: Configurar email para notificaciones

1. [ ] Ir a https://myaccount.google.com/security
2. [ ] Habilitar "2-Step Verification" si no lo tienes
3. [ ] Ir a https://myaccount.google.com/apppasswords
4. [ ] Crear App Password para "Mail" y "Windows"
5. [ ] Copiar contraseña generada
6. [ ] Guardar en bloc de notas temporal:
   - [ ] `NODEMAILER_EMAIL` (tu email)
   - [ ] `NODEMAILER_PASSWORD` (app password)

### 2.4 Twilio (SMS) - OPCIONAL

**Tarea**: Configurar SMS (opcional, puede dejarse sin esto)

1. [ ] Ir a https://www.twilio.com/console
2. [ ] Crear cuenta (trial gratis con $15 crédito)
3. [ ] Copiar:
   - [ ] `TWILIO_ACCOUNT_SID`
   - [ ] `TWILIO_AUTH_TOKEN`
   - [ ] `TWILIO_PHONE_NUMBER`
4. [ ] Guardar en bloc de notas temporal

**O saltarse este paso si no usarás SMS ahorita**

---

## 🚀 FASE 3: Railway.app Deployment (20 minutos)

### 3.1 Crear Cuenta Railway

1. [ ] Ir a https://railway.app
2. [ ] Click "Build in 5 minutes"
3. [ ] "Continue with GitHub"
4. [ ] Autorizar acceso a repos
5. [ ] Seleccionar repo `give-share-gain-main`

### 3.2 Crear Proyecto Railway

1. [ ] Nombre: "give-share-gain"
2. [ ] Region: La más cercana a ti
3. [ ] Click "Create Project"

### 3.3 Desplegar Frontend

1. [ ] Click "Add Service" → "GitHub"
2. [ ] Selecciona repo
3. [ ] Branch: `main`
4. [ ] Root directory: `.` (punto, raíz)
5. [ ] Click "Deploy"
6. [ ] **ESPERA a que termine el build** (2-3 min)
7. [ ] Click en el servicio "frontend"
8. [ ] Click "Settings"
9. [ ] En "Environment" → Agregar variables:
   - `PUBLIC_API_URL`: (dejaremos para después)
   - `VITE_API_URL`: (dejaremos para después)
   - `NODE_ENV`: `production`

- [ ] Frontend desplegado y en construcción

### 3.4 Desplegar User Service

1. [ ] Click "Add Service" → "GitHub"
2. [ ] Root directory: `backend/user-service`
3. [ ] Click "Deploy"
4. [ ] Espera a que termine
5. [ ] **OBTENER URL del servicio**: 
   - Click en el servicio
   - Click "Settings"
   - Copiar "URL" (ej: user-service-prod-xxxx.up.railway.app)
6. [ ] Agregar Environment Variables:
   - `MONGO_URI`: (Pega la URL de MongoDB Atlas para usuarios)
   - `JWT_SECRET`: (Generar con: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`)
   - `NODE_ENV`: `production`
   - `PORT`: `5000`

- [ ] User Service desplegado

### 3.5 Desplegar Product Service

1. [ ] Click "Add Service" → "GitHub"
2. [ ] Root directory: `backend/product-service`
3. [ ] Click "Deploy"
4. [ ] Agregar Environment Variables:
   - `MONGO_URI`: (URL de MongoDB para productos)
   - `NODE_ENV`: `production`
   - `PORT`: `5001`

- [ ] Product Service desplegado

### 3.6 Desplegar Cart Service

1. [ ] Click "Add Service" → "GitHub"
2. [ ] Root directory: `backend/shopping-cart-service`
3. [ ] Click "Deploy"
4. [ ] Agregar Environment Variables:
   - `MONGO_URI`: (URL de MongoDB para cart)
   - `PRODUCT_SERVICE_URI`: (URL de product service en Railway)
   - `NODE_ENV`: `production`
   - `PORT`: `5002`

- [ ] Cart Service desplegado

### 3.7 Desplegar Order Service

1. [ ] Click "Add Service" → "GitHub"
2. [ ] Root directory: `backend/order-service`
3. [ ] Click "Deploy"
4. [ ] Agregar Environment Variables:
   - `MONGO_URI`: (URL de MongoDB para orders)
   - `PRODUCT_SERVICE_URI`: (URL de product service)
   - `USER_SERVICE_URI`: (URL de user service)
   - `NOTIFICATION_SERVICE_URI`: (URL de notification service)
   - `NODE_ENV`: `production`
   - `PORT`: `5003`

- [ ] Order Service desplegado

### 3.8 Desplegar Payment Service

1. [ ] Click "Add Service" → "GitHub"
2. [ ] Root directory: `backend/payment-service`
3. [ ] Click "Deploy"
4. [ ] Agregar Environment Variables:
   - `MONGO_URI`: (URL de MongoDB para payments)
   - `STRIPE_SECRET_KEY`: (De Stripe)
   - `STRIPE_PUBLISHABLE_KEY`: (De Stripe)
   - `NODE_ENV`: `production`
   - `PORT`: `5004`

- [ ] Payment Service desplegado

### 3.9 Desplegar Notification Service

1. [ ] Click "Add Service" → "GitHub"
2. [ ] Root directory: `backend/notification-service`
3. [ ] Click "Deploy"
4. [ ] Agregar Environment Variables:
   - `NODEMAILER_EMAIL`: (Tu email de Gmail)
   - `NODEMAILER_PASSWORD`: (App password de Gmail)
   - `TWILIO_ACCOUNT_SID`: (Si tienes, si no dejar vacío)
   - `TWILIO_AUTH_TOKEN`: (Si tienes, si no dejar vacío)
   - `TWILIO_PHONE_NUMBER`: (Si tienes, si no dejar vacío)
   - `NODE_ENV`: `production`
   - `PORT`: `5005`

- [ ] Notification Service desplegado

### 3.10 Actualizar URLs en Frontend

1. [ ] Ir a Frontend en Railway
2. [ ] Click "Settings" → "Environment"
3. [ ] Actualizar variables:
   - `PUBLIC_API_URL`: `https://[tu-backend-url]/api` 
   - `VITE_API_URL`: `https://[tu-backend-url]/api`
4. [ ] Railway auto-redeploy el frontend

- [ ] Frontend actualizado con URLs correctas

---

## ✅ FASE 4: Testing (10 minutos)

### 4.1 Verificar Servicios

En terminal, prueba cada endpoint:

```bash
# Frontend
curl https://[frontend-url]
# Deberías ver HTML

# User Service
curl https://[user-service-url]/api/users

# Product Service
curl https://[product-service-url]/api/products

# Cart Service 
curl https://[cart-service-url]/api/cart

# Order Service
curl https://[order-service-url]/api/orders

# Payment Service
curl https://[payment-service-url]/api/payments
```

- [ ] Frontend responde con HTML
- [ ] User Service responde
- [ ] Product Service responde
- [ ] Cart Service responde
- [ ] Order Service responde
- [ ] Payment Service responde

### 4.2 Testear Funcionalidad

En el navegador:

1. [ ] Ir a `https://[frontend-url]`
2. [ ] Crear cuenta (debe enviar email)
3. [ ] Login
4. [ ] Buscar productos
5. [ ] Agregar al carrito
6. [ ] Checkout
7. [ ] Procesar pago (con Stripe test keys)
8. [ ] Verificar que orden se creó
9. [ ] Revisar email de confirmación

- [ ] Frontend carga correctamente
- [ ] Puedo crear cuenta
- [ ] Puedo hacer login
- [ ] Puedo ver productos
- [ ] Puedo agregar al carrito
- [ ] Puedo completar compra
- [ ] Recibo email de confirmación

---

## 🌐 FASE 5: Dominio (Opcional, 5 minutos)

### 5.1 Opción A: Usar subdominio gratis Railway

**Listo automáticamente en Railway!** Tu app está en:
```
https://[proyecto]-[random].up.railway.app
```

- [ ] Subdominio de Railway funciona

### 5.2 Opción B: Usar dominio propio

1. [ ] Comprar dominio en Namecheap/GoDaddy (~$5/año)
2. [ ] En Railway → Frontend Settings → "Custom Domain"
3. [ ] Ingresar dominio (ej: `giveshare.com`)
4. [ ] Copiar CNAME target de Railway
5. [ ] En registrador de dominio → DNS settings
6. [ ] Agregar CNAME:
   - Name: `www`
   - Value: (CNAME de Railway)
7. [ ] Esperar 24-48 horas para propagación

- [ ] Dominio personalizado activo (o saltado)

---

## 🔒 FASE 6: Seguridad & Producción (5 minutos)

### 6.1 HTTPS

✅ **Ya está habilitado automáticamente con Railway y certificados Let's Encrypt**

- [ ] HTTPS funciona (verifica en navegador 🔒)

### 6.2 Variables de Entorno Seguras

1. [ ] Verificar que NO hay secretos en código
2. [ ] Todas las credenciales están en Railway Environment, no en .env en repo
3. [ ] JWT_SECRET es único y seguro
4. [ ] Stripe keys son "Live" no "Test"
5. [ ] MongoDB password es de 12+ caracteres

- [ ] No hay secretos en repositorio
- [ ] Todas las credenciales en Railway
- [ ] Certificados HTTPS activos

### 6.3 Backups

1. [ ] En MongoDB Atlas → Backup
2. [ ] Verificar que hay backups automáticos cada 6 horas
3. [ ] Anotar cómo restaurar en caso de emergencia

- [ ] Backups automáticos activos

---

## 📊 FASE 7: Monitoreo (2 minutos)

### 7.1 Configurar Alertas Railway

1. [ ] Railway → Project Settings → "Alerts"
2. [ ] Click "New Alert"
3. [ ] Seleccionar condición:
   - [ ] CPU > 80%
   - [ ] Memory > 80%
   - [ ] Deploy failed
4. [ ] Seleccionar notificación: Email

- [ ] Alertas configuradas

### 7.2 Ver Logs

1. [ ] Railway → Cada servicio → "Logs"
2. [ ] Click "Live" para ver logs en tiempo real
3. [ ] Buscar errores

- [ ] Puedo ver logs en tiempo real

---

## 📈 FASE 8: Post-Deployment (Cuando todo esté funcionando)

### 8.1 Optimizaciones Futuras

- [ ] Agregar CDN para assets estáticos (Cloudflare gratis)
- [ ] Implementar caching (Redis)
- [ ] Optimizar imágenes con WebP
- [ ] Implementar lazy loading en frontend
- [ ] Agregar analytics (Google Analytics gratis)

### 8.2 Mantenimiento

- [ ] Revisar logs diariamente la primera semana
- [ ] Monitorear costos en Railway (debe ser $5-10/mes)
- [ ] Actualizar dependencias mensualmente
- [ ] Hacer backup manual de datos mensuales

### 8.3 Escalar (Cuando crezca)

- [ ] Aumentar resources en Railway
- [ ] Agregar réplicas de bases de datos
- [ ] Implementar caché distribuido
- [ ] Load balancing automático

---

## 🆘 Si algo falla:

| Problema | Solución |
|----------|----------|
| "Build failed" | Revisar logs en Railway, verificar Dockerfile |
| "Cannot connect to MongoDB" | Verificar MONGO_URI, confirmar IP whitelist |
| "500 error" | Ver logs del servicio en Railway |
| "Email no se envía" | Verificar credenciales Gmail, usar App Password |
| "Frontend no ve backend" | Actualizar PUBLIC_API_URL con URL correcta |

---

## ✨ ¡LISTO!

Una vez completado:
- ✅ Aplicación en producción
- ✅ Accesible desde internet
- ✅ Tomando órdenes reales
- ✅ Enviando emails
- ✅ Procesando pagos
- ✅ Monitoreable

**Costo estimado**: $8-12 USD/mes en Railway

**URL de acceso**: 
- Frontend: https://[tu-proyecto].up.railway.app
- APIs: https://[tu-proyecto].up.railway.app/api

**Próximo paso após esto**: Invita usuarios a beta testing!
