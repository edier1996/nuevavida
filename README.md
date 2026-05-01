# Nueva Vida

Plataforma web para donar, solicitar y gestionar la entrega de objetos con enfoque comunitario.

## Stack

- Vite + React + TypeScript
- Tailwind CSS + shadcn-ui
- Microservicios Node.js (backend/)

## Requisitos

- Node.js 20.x
- npm 10+

## Desarrollo local

```bash
npm install
npm run dev
```

App frontend en `http://localhost:8080`.

## Scripts principales

- `npm run dev`: servidor de desarrollo
- `npm run build`: build de producción
- `npm run preview`: vista previa de build
- `npm test`: ejecutar pruebas Vitest

## Backend

El backend de microservicios está en la carpeta `backend/`.

Para levantarlo con Docker Compose (según configuración del proyecto):

```bash
cd backend
docker compose up --build
```

## Documentación útil

- `QUICKSTART.md`
- `PLAN_IMPLEMENTACION_SISTEMA_ENVIOS.md`
- `backend/README.md`
