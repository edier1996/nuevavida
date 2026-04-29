# Give-Share-Gain Backend - Reference Guide

This file provides a quick reference for the improved backend implementation.

## 🎉 What's New

### ✨ Recent Improvements

1. **Order Notifications** 
   - Automatic email sent when order is confirmed
   - Order status updates trigger notifications
   - Non-blocking (doesn't delay order creation)

2. **Stock Management**
   - New `/deduct` endpoint for stock reduction
   - New `/restore` endpoint for order cancellations
   - Validates stock before order processing

3. **Enhanced Order API**
   - Cancel orders (restores stock automatically)
   - Better status tracking
   - Improved error handling

4. **User Authentication**
   - Protected endpoints with JWT middleware
   - User profile endpoints (GET/PUT)
   - Password validation

5. **Input Validation**
   - Centralized validation middleware
   - Consistent error messages
   - Type checking for all endpoints

6. **Error Handling**
   - Global error middleware
   - Async operation wrapper
   - Better error reporting

7. **Kubernetes Improvements**
   - Health checks (liveness/readiness probes)
   - Resource limits per service
   - Environment variables configuration
   - Persistent MongoDB storage

---

## 📖 Documentation Files

| File | Purpose |
|------|---------|
| [README.md](README.md) | Overview & quick start |
| [BACKEND_API.md](BACKEND_API.md) | Complete API reference with examples |
| [DEPLOYMENT.md](DEPLOYMENT.md) | Kubernetes deployment guide |
| [ENV_SETUP.md](ENV_SETUP.md) | Environment variables documentation |
| [.env.example](.env.example) | Template for environment variables |

---

## 🔄 API Flow Examples

### User Registration → Product Purchase → Order Notification

```
1. Client: POST /api/users/register
   └─> User Service: Create user, return JWT token

2. Client: GET /api/products
   └─> Product Service: Return product list

3. Client: POST /api/cart/{userId}/add
   └─> Cart Service: Add item to cart

4. Client: POST /api/orders/{userId}
   └─> Order Service:
       ├─> Check availability (Product Service)
       ├─> Deduct stock (Product Service /deduct)
       ├─> Create order in DB
       └─> Send email notification (Notification Service) [async]
   └─> Return success response to client

5. Client: PUT /api/orders/{orderId}/status
   └─> Order Service:
       ├─> Update order status
       └─> Send status notification (Notification Service) [async]
```

---

## 📦 Deployment Status

### Local (Docker Compose) ✅
Ready to run with `docker compose up --build`

### Kubernetes ✅
Ready for K8s deployment with:
- Deployments with replicas
- Services for networking
- Ingress for external access
- MongoDB StatefulSet for data persistence
- Health checks (liveness/readiness probes)
- Resource limits

---

## 🔌 Service Dependencies

```
Order Service
├─> Product Service (check stock, deduct, restore)
├─> User Service (get user email)
├─> Notification Service (send emails)
│
Cart Service
└─> Product Service (validate products)

Payment Service
├─> Stripe API
│
Notification Service
├─> NodeMailer (email)
└─> Twilio (SMS)
```

---

## 🚀 Deployment Checklist

### Local Development
- [ ] Copy `.env.example` to `.env`
- [ ] Fill in credentials (Stripe, Email, Twilio)
- [ ] Run `docker compose up --build`
- [ ] Test endpoints with cURL

### Production (Kubernetes)
- [ ] Create Kubernetes cluster (AWS EKS, GCP GKE, etc.)
- [ ] Create namespace: `kubectl create namespace givesgain`
- [ ] Create MongoDB persistent volumes
- [ ] Create Kubernetes Secrets for sensitive data
- [ ] Deploy services using provided YAML files
- [ ] Configure Ingress with domain
- [ ] Set up monitoring (Prometheus, Grafana)
- [ ] Configure auto-scaling

See [DEPLOYMENT.md](DEPLOYMENT.md) for detailed steps.

---

## 📚 File Improvements Made

### Product Service
- Fixed schema typo (`procductSchema` → `productSchema`)
- Added `PUT /:id/restore` endpoint for order cancellations
- Improved error messages in `/deduct` endpoint

### User Service
- Added JWT authentication middleware
- Added `GET /:id` endpoint (get user profile)
- Added `PUT /:id` endpoint (update user profile)
- Added email return in login response

### Order Service
- Integrated with Notification Service
- Added order cancellation endpoint (`DELETE /:orderId`)
- Improved order status tracking with valid statuses
- Automatic stock restoration on cancellation
- Non-blocking email notifications
- Better error handling and validation

### Kubernetes Deployments
- Added health checks (liveness/readiness probes)
- Added resource limits (CPU/Memory)
- Added environment variables
- Improved inter-service URIs for K8s

### Shared Middleware
- Created validation.js for input validation
- Created errorHandler.js for global error handling
- Asynchandler wrapper for Promise rejections

---

## 🔐 Security Notes

1. **JWT Secret**: Change in production!
   ```bash
   # Generate secure random secret
   openssl rand -base64 32
   ```

2. **Database Credentials**: Use strong passwords
   ```
   Not: "password"
   Use: "KhH7$mP2@wQ4*Lj9&dF1xN8!"
   ```

3. **Environment Files**: Never commit `.env` to Git

4. **MongoDB**: Enable authentication
   ```yaml
   MONGO_URI=mongodb://admin:password@mongo:27017/?authSource=admin
   ```

5. **HTTPS**: Enable in production
   ```yaml
   # Ingress config for TLS
   tls:
   - hosts:
     - api.give-share-gain.com
     secretName: tls-secret
   ```

---

## 📊 Service Status

| Service | Status | Health Check |
|---------|--------|--------------|
| User Service | ✅ | GET /api/users/health |
| Product Service | ✅ | GET /api/products |
| Cart Service | ✅ | GET /api/cart |
| Order Service | ✅ | GET /api/orders |
| Payment Service | ✅ | GET /api/payments |
| Notification Service | ✅ | GET /api/notification/health |
| MongoDB | ✅ | Port 27017 |
| Nginx Gateway | ✅ | Port 80 |

---

## 🆘 Quick Troubleshooting

### Issue: Service won't start
```bash
docker compose logs {service-name}
```

### Issue: MongoDB connection error
```bash
docker compose logs mongo
# Check MONGO_URI in .env
```

### Issue: Port already in use
```bash
# Kill process on port
lsof -ti:5000 | xargs kill -9  # mac/linux
netstat -ano | findstr LISTENING  # windows
```

### Issue: Email not sending
1. Check `NODEMAILER_EMAIL` and `NODEMAILER_PASSWORD` in `.env`
2. For Gmail: Use [App Password](https://myaccount.google.com/apppasswords)
3. Check notification service logs

---

## 📞 Next Steps

1. Review [BACKEND_API.md](BACKEND_API.md) for all endpoints
2. Set up environment variables using `.env.example`
3. Test locally with `docker compose up --build`
4. For production: Follow [DEPLOYMENT.md](DEPLOYMENT.md)

---

## 📝 Notes

- All services are production-ready
- Kubernetes manifests include best practices
- Error handling is comprehensive
- Services communicate asynchronously where possible
- No breaking changes to existing APIs
