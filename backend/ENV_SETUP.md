# Backend Microservices - Environment Variables Guide

This file documents all required environment variables for the Give-Share-Gain backend microservices.

## Quick Start

Copy `.env.example` to `.env` in the `backend/` directory and fill in your actual values:

```bash
cp .env.example .env
```

## Database Configuration

```
MONGO_URI_USERS=mongodb://admin:password@mongo-0.mongo.default.svc.cluster.local:27017/users?authSource=admin
MONGO_URI_PRODUCTS=mongodb://admin:password@mongo-0.mongo.default.svc.cluster.local:27017/products?authSource=admin
MONGO_URI_CART=mongodb://admin:password@mongo-0.mongo.default.svc.cluster.local:27017/cart?authSource=admin
MONGO_URI_ORDER=mongodb://admin:password@mongo-0.mongo.default.svc.cluster.local:27017/orders?authSource=admin
MONGO_URI_PAYMENT=mongodb://admin:password@mongo-0.mongo.default.svc.cluster.local:27017/payments?authSource=admin
```

- Local Development: `mongodb://localhost:27017/[database_name]`
- Kubernetes: `mongodb://admin:password@mongo-0.mongo.default.svc.cluster.local:27017/[database_name]?authSource=admin`

## Authentication & Security

```
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRY=1h
```

## Payment Gateway (Stripe)

```
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key
```

## Email Service (NodeMailer)

```
NODEMAILER_EMAIL=your-email@gmail.com
NODEMAILER_PASSWORD=your-app-specific-password
NODEMAILER_HOST=smtp.gmail.com
NODEMAILER_PORT=587
```

### Gmail Setup:
1. Enable 2-Factor Authentication on your Google account
2. Generate App Password: https://myaccount.google.com/apppasswords
3. Use the generated 16-character password

## SMS Service (Twilio)

```
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_PHONE_NUMBER=+1234567890
```

## Service Discovery (Kubernetes/Inter-service Communication)

```
USER_SERVICE_URI=http://user-service.default.svc.cluster.local:5000
PRODUCT_SERVICE_URI=http://product-service.default.svc.cluster.local:5001
CART_SERVICE_URI=http://shopping-cart-service.default.svc.cluster.local:5002
ORDER_SERVICE_URI=http://order-service.default.svc.cluster.local:5003
PAYMENT_SERVICE_URI=http://payment-service.default.svc.cluster.local:5004
NOTIFICATION_SERVICE_URI=http://notification-service.default.svc.cluster.local:5005
```

### Local Development:
```
USER_SERVICE_URI=http://localhost:5000
PRODUCT_SERVICE_URI=http://localhost:5001
CART_SERVICE_URI=http://localhost:5002
ORDER_SERVICE_URI=http://localhost:5003
PAYMENT_SERVICE_URI=http://localhost:5004
NOTIFICATION_SERVICE_URI=http://localhost:5005
```

## Application Settings

```
NODE_ENV=production|development|test
PORT=5000
LOG_LEVEL=debug|info|warn|error
API_VERSION=v1
```

## Database Backup (Optional)

```
MONGO_BACKUP_ENABLED=true
MONGO_BACKUP_SCHEDULE=0 2 * * *
BACKUP_DESTINATION=s3://bucket-name
```

## Example Docker Compose `.env`

```
MONGO_URI_USERS=mongodb://admin:password@mongo:27017/users?authSource=admin
MONGO_URI_PRODUCTS=mongodb://admin:password@mongo:27017/products?authSource=admin
MONGO_URI_CART=mongodb://admin:password@mongo:27017/cart?authSource=admin
MONGO_URI_ORDER=mongodb://admin:password@mongo:27017/orders?authSource=admin
MONGO_URI_PAYMENT=mongodb://admin:password@mongo:27017/payments?authSource=admin

PRODUCT_SERVICE_URI=http://product-service:5001
NOTIFICATION_SERVICE_URI=http://notification-service:5005
JWT_SECRET=dev-secret-change-in-production
STRIPE_SECRET_KEY=sk_test_xxx
NODEMAILER_EMAIL=dev@example.com
NODEMAILER_PASSWORD=dev-password
TWILIO_ACCOUNT_SID=ACxxx
TWILIO_AUTH_TOKEN=xxx
TWILIO_PHONE_NUMBER=+1234567890
```

## Validation

After setting environment variables, verify services start correctly:

```bash
docker compose up
# Check logs for "Connected to MongoDB" messages from each service
```

## Security Notes

- **NEVER commit `.env` to version control**
- Use different secrets for development, staging, and production
- Rotate `JWT_SECRET` regularly
- Use Kubernetes Secrets for production deployments
- Enable HTTPS in production
- Use separate email/SMS accounts for production
