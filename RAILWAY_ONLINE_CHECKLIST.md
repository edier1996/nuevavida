# Checklist Online en Railway (Frontend + API + BD compartida)

Este proyecto puede quedar online para multiples usuarios desplegando frontend y microservicios en Railway con una base MySQL administrada.

## 1) Frontend (servicio web)

- Crear servicio desde la raiz del repo.
- Build command: `npm run build`
- Start command: `npm run preview -- --host 0.0.0.0 --port $PORT`
- Variables:
  - `VITE_USERS_API_BASE_URL=https://user-service-production.up.railway.app`
  - `VITE_PRODUCTS_API_BASE_URL=https://product-service-production.up.railway.app`

Nota: el frontend ahora tambien acepta `VITE_API_BASE_URL`, `VITE_API_URL` y `PUBLIC_API_URL` por compatibilidad, pero para Railway es mejor separar usuarios y productos.

## 2) Base de datos MySQL en Railway

- Crear plugin MySQL en Railway.
- Guardar estos valores del plugin: host, port, user, password, database.

## 3) User Service (backend/user-service)

- Crear servicio apuntando a `backend/user-service`.
- Variables:
  - `PORT=5000`
  - `DB_HOST=HOST_MYSQL`
  - `DB_USER=USER_MYSQL`
  - `DB_PASSWORD=PASSWORD_MYSQL`
  - `DB_NAME=userdb`
  - `JWT_SECRET=TU_SECRETO_LARGO`

## 4) Product Service (backend/product-service)

- Crear servicio apuntando a `backend/product-service`.
- Variables:
  - `PORT=5001`
  - `DB_HOST=HOST_MYSQL`
  - `DB_USER=USER_MYSQL`
  - `DB_PASSWORD=PASSWORD_MYSQL`
  - `DB_NAME=productdb`

## 5) Variables en frontend para datos compartidos

- `VITE_USERS_API_BASE_URL` debe apuntar al dominio publico del `user-service` en Railway.
- `VITE_PRODUCTS_API_BASE_URL` debe apuntar al dominio publico del `product-service` en Railway.
- Con esto ya pueden funcionar login, registro, listado y publicacion sin gateway extra.

## 6) Dominio

- Apuntar `nuevavida1327.com` al servicio frontend en Railway (CNAME o A segun panel).
- Apuntar `www.nuevavida1327.com` al mismo servicio frontend.
- `api.nuevavida1327.com` es opcional en esta primera fase.

## 7) Verificacion minima

- Registro/login debe responder desde API online.
- Publicar producto desde un dispositivo A.
- Abrir desde dispositivo B y validar que aparece sin refrescar localStorage.

## 8) Orden exacto en Railway para que funcione Publicar

- Crear plugin MySQL.
- Crear servicio `user-service` desde `backend/user-service`.
- Crear servicio `product-service` desde `backend/product-service`.
- Crear servicio frontend desde la raiz.
- Copiar los dominios publicos de `user-service` y `product-service` al frontend como variables `VITE_USERS_API_BASE_URL` y `VITE_PRODUCTS_API_BASE_URL`.
- Hacer redeploy del frontend.

## 9) Nota tecnica importante

- Este repo tenia guias viejas con MongoDB. El codigo actual de estos servicios usa MySQL por `sequelize`.
- Para despliegue online de productos compartidos, usa la configuracion MySQL de esta checklist.
