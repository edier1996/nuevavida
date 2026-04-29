# Guía Completa: Desplegar Give-Share-Gain en Railway.app

## 🚀 ¿Por qué Railway?

✅ **$5-20/mes**: Presupuesto perfecto  
✅ **CI/CD integrado**: Push a GitHub → Deploy automático  
✅ **Escalable**: Crece con tus usuarios  
✅ **Sin mantenimiento**: Railway gestiona la infraestructura  
✅ **Excelente documentación**: Comunidad activa  

---

## 📋 Pre-requisitos

1. **Cuenta Railway.app** (creamosr ahora)
2. **GitHub repository** (ya tienes)
3. **Dominio** (opcional, puedes usar *.up.railway.app)
4. **MongoDB Atlas** (usaremos free tier)
5. **Stripe API keys** (para pagos)
6. **Email/Twilio credentials** (para notificaciones)

---

## Part 1️⃣: Preparar MongoDB en MongoDB Atlas

### Paso 1: Crear cuenta en MongoDB Atlas

1. Ve a https://www.mongodb.com/cloud/atlas
2. Crea cuenta gratis
3. Crea un nuevo proyecto llamado "give-share-gain"

### Paso 2: Crear Cluster Gratis

1. Click en "Build a cluster"
2. Selecciona "Free Tier"
3. Proveedor: AWS
4. Región: us-east-1 (la más cercana a ti)
5. Nombre: "production"
6. Click "Create Deployment"

### Paso 3: Configurar Acceso

1. Ve a "Database Access"
2. Click "Add new database user"
   - **Username**: `admin`
   - **Password**: Genera una segura (ej: `K9#mP2$xQ5@wL1!`)
   - Click "Create User"

### Paso 4: Agregar IP a Whitelist

1. Ve a "Network Access"
2. Click "Add IP Address"
3. Selecciona "Allow access from anywhere"
   - Entrada: `0.0.0.0/0` (permite acceso desde cualquier lado)
4. Click "Confirm"

### Paso 5: Obtener Connection String

1. Ve a "Databases" → tu cluster "production"
2. Click "Connect"
3. Selecciona "Drivers"
4. Copia la URI de conexión
5. Reemplaza `<password>` con tu contraseña real

**Ejemplo**:
```
mongodb+srv://admin:K9#mP2$xQ5@wL1!@production.m7kj3.mongodb.net/?retryWrites=true&w=majority
```

### Paso 6: Crear Bases de Datos

Haz estos cambios a la URI para cada servicio:

```
# Users database
mongodb+srv://admin:PASSWORD@production.m7kj3.mongodb.net/users?retryWrites=true&w=majority

# Products database
mongodb+srv://admin:PASSWORD@production.m7kj3.mongodb.net/products?retryWrites=true&w=majority

# Cart database
mongodb+srv://admin:PASSWORD@production.m7kj3.mongodb.net/cart?retryWrites=true&w=majority

# Orders database
mongodb+srv://admin:PASSWORD@production.m7kj3.mongodb.net/orders?retryWrites=true&w=majority

# Payments database
mongodb+srv://admin:PASSWORD@production.m7kj3.mongodb.net/payments?retryWrites=true&w=majority
```

**Guarda estas URIs**, las necesitarás en el siguiente paso.

---

## 2️⃣: Preparar Railway

### Paso 1: Crear Cuenta en Railway

1. Ve a https://railway.app
2. Click "Build in 5 minutes"
3. Continue with GitHub ("Continuar con GitHub")
4. Autoriza a Railway
5. Selecciona tu repositorio

### Paso 2: Crear Proyecto en Railway

1. Click "New Project"
2. Selecciona "Blank Project"
3. Nombre: "give-share-gain"

### Paso 3: Agregar Servicios

Vamos a agregar servicios en este orden:

#### a) Agregar Frontend

1. Click "Add service"
2. "Deploy from GitHub"
3. Selecciona tu repositorio
4. Branch: `main`
5. Root directory: `.` (raíz)
6. Click "Deploy"

**Configurar Variables de Entorno** (en Railway):
- Ve a "Variables"
- Agrega:
  - `PUBLIC_API_URL`: `<backend-url>/api` (obtendremos después)
  - `VITE_API_URL`: `<backend-url>/api`
  - `NODE_ENV`: `production`

#### b) Agregar Backend (User Service)

1. Click "Add Service" → "GitHub"
2. Selecciona repo
3. Root directory: `backend/user-service`
4. Variables de ambiente:
   - `MONGO_URI`: (Copia de MongoDB Atlas - usuarios)
   - `JWT_SECRET`: `KhH7$mP2@wQ4*Lj9&dF1xN8!` (Cambia esto)
   - `NODE_ENV`: `production`
   - `PORT`: `5000`

#### c) Agregar Backend (Product Service)

1. Click "Add Service" → "GitHub"
2. Root directory: `backend/product-service`
3. Variables de ambiente:
   - `MONGO_URI`: (MongoDB Atlas - productos)
   - `NODE_ENV`: `production`
   - `PORT`: `5001`

#### d) Repite para los demás servicios

- Order Service (root: `backend/order-service`)
  - Requiere: `MONGO_URI`, `PRODUCT_SERVICE_URI`, `USER_SERVICE_URI`, `NOTIFICATION_SERVICE_URI`

- Payment Service (root: `backend/payment-service`)
  - Requiere: `MONGO_URI`, `STRIPE_SECRET_KEY`

- Notification Service (root: `backend/notification-service`)
  - Requiere: `NODEMAILER_EMAIL`, `NODEMAILER_PASSWORD`, `TWILIO_***`

---

## 3️⃣: Configurar Dominio (Opcional)

### Opción A: Usar Subdominio Railway (GRATIS)

1. Ve a tu servicio Frontend en Railway
2. Click "Settings"
3. "Public Networking"
4. Usa la URL generada: `your-app-XXXXX.up.railway.app`
5. **Listo!** Tu frontend está online

### Opción B: Usar Tu Dominio

1. Compra dominio en **Namecheap** o **GoDaddy** (~$5/año)
2. En Railway:
   - Click "Custom Domain"
   - Ingresa tu dominio (ej: `giveshare.com`)
   - Copia el CNAME target

3. En tu registrador de dominio:
   - Ir a DNS settings
   - Agregar CNAME:
     - Name: `www`
     - Value: (el CNAME de Railway)
   - Aguarda 24-48 horas para propagación DNS

---

## 4️⃣: Variables de Entorno Críticas

### Crear en Railway (Project Settings → Variables)

```
# Database
MONGO_URI_USERS=mongodb+srv://admin:PASSWORD@...
MONGO_URI_PRODUCTS=mongodb+srv://admin:PASSWORD@...
MONGO_URI_CART=mongodb+srv://admin:PASSWORD@...
MONGO_URI_ORDER=mongodb+srv://admin:PASSWORD@...
MONGO_URI_PAYMENT=mongodb+srv://admin:PASSWORD@...

# Security
JWT_SECRET=KhH7$mP2@wQ4*Lj9&dF1xN8!  # GENERA UNO NUEVO
JWT_EXPIRY=7d

# Payment
STRIPE_SECRET_KEY=sk_live_... (o sk_test_ para development)
STRIPE_PUBLISHABLE_KEY=pk_live_...

# Email (Gmail)
NODEMAILER_EMAIL=tu-email@gmail.com
NODEMAILER_PASSWORD=tu-app-password  # NO tu contraseña de Gmail
NODEMAILER_HOST=smtp.gmail.com
NODEMAILER_PORT=587

# SMS (Twilio - opcional)
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_PHONE_NUMBER=+1234567890

# Application
NODE_ENV=production
API_URL=https://tu-dominio.com
CORS_ORIGIN=https://tu-dominio.com
```

---

## 5️⃣: Desplegar

### Paso 1: Commit y Push a GitHub

```bash
git add .
git commit -m "Preparado para despliegue en Railway"
git push origin main
```

### Paso 2: Railway Auto-Deploy

Railway detectará que hiciste push y automáticamente:
1. ✅ Clonará tu repo
2. ✅ Instalará dependencias
3. ✅ Buildará la imagen docker
4. ✅ Desplegará en producción

**Monitorear deployment**:
- Ve a tu proyecto Railway
- Click "Deployments"
- Ves el historial y logs en tiempo real

---

## 6️⃣: Verificar que Todo Funciona

### Test Frontend

```bash
curl https://tu-app.up.railway.app
# Deberías ver el HTML del frontend
```

### Test Backend APIs

```bash
# Registrar usuario
curl -X POST https://tu-app.up.railway.app/api/users/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","email":"test@example.com","password":"pass123"}'

# Listar productos
curl https://tu-app.up.railway.app/api/products

# Crear orden
curl -X POST https://tu-app.up.railway.app/api/orders/USER_ID \
  -H "Content-Type: application/json" \
  -d '{
    "items":[{"productId":"PROD_ID","quantity":2}],
    "totalAmount":1999.98,
    "shippingAddress":"123 Main St"
  }'
```

---

## 7️⃣: Configuración de Nginx

Tu nginx.conf necesita actualización para producción:

```nginx
# En backend/nginx.conf

upstream frontend {
    server frontend:8080;
}

upstream user_service {
    server user-service:5000;
}

upstream product_service {
    server product-service:5001;
}

upstream cart_service {
    server shopping-cart-service:5002;
}

upstream order_service {
    server order-service:5003;
}

upstream payment_service {
    server payment-service:5004;
}

upstream notification_service {
    server notification-service:5005;
}

server {
    listen 80;
    server_name _;

    # Frontend
    location / {
        proxy_pass http://frontend;
    }

    # API routes
    location /api/users {
        proxy_pass http://user_service;
    }

    location /api/products {
        proxy_pass http://product_service;
    }

    location /api/cart {
        proxy_pass http://cart_service;
    }

    location /api/orders {
        proxy_pass http://order_service;
    }

    location /api/payments {
        proxy_pass http://payment_service;
    }

    location /api/notification {
        proxy_pass http://notification_service;
    }
}
```

---

## 🆘 Solución de Problemas

### Problema: "Build failed"
```
Solución:
1. Verifica que el root directory sea correcto
2. Revisa los logs (click "Deploy logs")
3. Asegúrate que package.json existe en esa carpeta
```

### Problema: "500 error" en APIs
```
Solución:
1. Verifica que MONGO_URI sea correcto
2. Confirma que MongoDB Atlas que allow connections from "0.0.0.0/0"
3. Revisa logs de Railway: click "Logs"
```

### Problema: Frontend no conecta al backend
```
Solución:
1. Asegúrate que PUBLIC_API_URL en frontend apunta a tu backend
2. Configura CORS en el backend
3. Prueba con: curl https://tu-backend.up.railway.app/api/products
```

### Problema: Email no se envía
```
Solución:
1. Verifica credenciales Nodemailer/Gmail
2. Para Gmail, usa "App Password" NO tu contraseña
3. Revisa logs de Notification Service
```

---

## 💰 Monitoreo de Costos

### Cómo ver costos en Railway

1. Dashboard Railway → Tu Proyecto
2. Click "Billing"
3. Ves breakdown por servicio

### Cómo reducir costos

1. **Reducir instancias**: Combina servicios (ej: todos en 1 pod)
2. **Aumentar límites de memoria**: Reduce el uso de CPU
3. **Usar free tier MongoDB Atlas**: Gratis hasta 512MB
4. **Deshabilitar servicios no usados**: Notification Service puede ejecutarse on-demand

---

## ✅ Checklist Final

- [ ] Cuenta Railway.app creada
- [ ] GitHub conectado a Railway
- [ ] MongoDB Atlas configura y funcionando
- [ ] Variables de entorno agregadas
- [ ] Frontend desplegado y accesible
- [ ] Todos los servicios backend desplegados
- [ ] APIs testadas y funcionando
- [ ] Dominio configurado (opcional)
- [ ] HTTPS habilitado (Railway lo hace automáticamente)
- [ ] Monitoreo de logs activo

---

## 🎉 ¡Listo!

Tu aplicación Give-Share-Gain ahora está en internet y tomando usuarios.

**URLs**:
- Frontend: https://tu-app.up.railway.app (o tu dominio)
- APIs: https://tu-app.up.railway.app/api/...

**Próximos pasos**:
1. Añadir más instancias si crece el tráfico
2. Configurar alertas de rendimiento
3. Optimizar base de datos
4. Implementar caché
5. Considerar CDN para archivos estáticos

---

## 📚 Referencias

- [Railway Docs](https://docs.railway.app)
- [MongoDB Atlas Guide](https://docs.atlas.mongodb.com)
- [Nginx Proxy Config](https://nginx.org/en/docs/http/ngx_http_proxy_module.html)
- [Express.js Best Practices](https://expressjs.com/en/advanced/best-practice-performance.html)

**¡Éxito con tu despliegue!** 🚀
