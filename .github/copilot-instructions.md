# Project Guidelines

## Code Style
- TypeScript with React, using shadcn-ui components and Tailwind CSS
- Path alias: `@` for `src/` directory
- State management via React Contexts (Auth, Cart, Transactions)
- Component naming: Dashboards for different roles (AdminDashboard, SellerDashboard, WorkerDashboard)

## Architecture
- Frontend: Vite + React + TypeScript
- Backend: Node.js microservices (User, Product, Shopping Cart, Order, Payment, Notification) with API Gateway (Nginx)
- Business model: Platform charges 50% commission on shipping costs
- Authentication: JWT with argon2 hashing, roles ('admin', 'worker', 'user')

See [PLAN_IMPLEMENTACION_SISTEMA_ENVIOS.md](PLAN_IMPLEMENTACION_SISTEMA_ENVIOS.md) for shipping system architecture and data models.

## Build and Test
Frontend (root directory):
- `npm run dev` - Development server on port 8080
- `npm run build` - Production build
- `npm test` - Run Vitest tests

Backend (`backend/` directory):
- `docker compose up --build` - Full stack with microservices & Nginx

## Conventions
- File structure: `src/contexts/` for global state, `src/pages/` for routes, `src/components/` for UI, `src/lib/` for utilities
- Environment variables required for backend services (MongoDB URIs, JWT secret, Stripe keys)
- Shipping cost calculations assume Colombian cities with hardcoded routes
- Platform commission hardcoded at 50% in transaction logic

See [README.md](README.md) for tech stack, [QUICKSTART.md](QUICKSTART.md) for testing guide, [backend/README.md](backend/README.md) for microservices details.