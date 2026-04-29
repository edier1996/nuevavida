# Backend API Documentation

## Overview
This document describes all available API endpoints for the Give-Share-Gain microservices backend.

**Base URL**: `http://localhost:8080/api` (Docker) | `http://api.give-share-gain.com` (Production)

---

## User Service (`/api/users`)

### Register User
- **POST** `/register`
- **Request**:
  ```json
  {
    "name": "John Doe",
    "email": "john@example.com",
    "password": "securePassword123"
  }
  ```
- **Response** (201):
  ```json
  {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
  ```
- **Errors**:
  - 400: User already exists / Missing fields / Invalid email / Password too short
  - 500: Server error

**cURL**:
```bash
curl -X POST http://localhost:5000/api/users/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "password": "securePassword123"
  }'
```

---

### Login User
- **POST** `/login`
- **Request**:
  ```json
  {
    "email": "john@example.com",
    "password": "securePassword123"
  }
  ```
- **Response** (200):
  ```json
  {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "userId": "507f1f77bcf86cd799439011"
  }
  ```
- **Errors**:
  - 400: User not found / Invalid credentials
  - 500: Server error

**cURL**:
```bash
curl -X POST http://localhost:5000/api/users/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "securePassword123"
  }'
```

---

### Get User Profile
- **GET** `/:id`
- **Headers**: `Authorization: Bearer {token}`
- **Response** (200):
  ```json
  {
    "_id": "507f1f77bcf86cd799439011",
    "name": "John Doe",
    "email": "john@example.com"
  }
  ```
- **Errors**:
  - 401: Missing/invalid token
  - 404: User not found
  - 500: Server error

**cURL**:
```bash
curl -X GET http://localhost:5000/api/users/507f1f77bcf86cd799439011 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

### Update User Profile
- **PUT** `/:id`
- **Headers**: `Authorization: Bearer {token}`
- **Request**:
  ```json
  {
    "name": "John Smith",
    "email": "john.smith@example.com"
  }
  ```
- **Response** (200): Updated user object
- **Errors**:
  - 401: Missing/invalid token
  - 404: User not found
  - 500: Server error

**cURL**:
```bash
curl -X PUT http://localhost:5000/api/users/507f1f77bcf86cd799439011 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Smith",
    "email": "john.smith@example.com"
  }'
```

---

## Product Service (`/api/products`)

### List All Products
- **GET** `/`
- **Query Parameters**: `?category=electronics&sort=price`
- **Response** (200):
  ```json
  [
    {
      "_id": "507f1f77bcf86cd799439012",
      "name": "Laptop",
      "price": 999.99,
      "description": "High-performance laptop",
      "category": "electronics",
      "stock": 50
    }
  ]
  ```

**cURL**:
```bash
curl http://localhost:5001/api/products
```

---

### Get Product by ID
- **GET** `/:id`
- **Response** (200): Single product object
- **Error**: 404 Product not found

**cURL**:
```bash
curl http://localhost:5001/api/products/507f1f77bcf86cd799439012
```

---

### Create Product (Admin)
- **POST** `/create`
- **Headers**: `Authorization: Bearer {admin_token}`
- **Request**:
  ```json
  {
    "name": "Laptop",
    "price": 999.99,
    "description": "High-performance laptop",
    "category": "electronics",
    "stock": 50
  }
  ```
- **Response** (201): Created product object
- **Errors**:
  - 400: Missing fields / Invalid data types
  - 401: Not authorized
  - 500: Server error

**cURL**:
```bash
curl -X POST http://localhost:5001/api/products/create \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Laptop",
    "price": 999.99,
    "description": "High-performance laptop",
    "category": "electronics",
    "stock": 50
  }'
```

---

### Update Product
- **PUT** `/:id`
- **Request**: Same as create (all fields optional)
- **Response** (200): Updated product object
- **Errors**: 404 Not found

**cURL**:
```bash
curl -X PUT http://localhost:5001/api/products/507f1f77bcf86cd799439012 \
  -H "Content-Type: application/json" \
  -d '{
    "price": 899.99,
    "stock": 45
  }'
```

---

### Deduct Stock (Called by Order Service)
- **PUT** `/:id/deduct`
- **Request**:
  ```json
  {
    "quantity": 5
  }
  ```
- **Response** (200): Updated product object
- **Errors**:
  - 400: Insufficient stock / Invalid quantity
  - 404: Product not found

**cURL**:
```bash
curl -X PUT http://localhost:5001/api/products/507f1f77bcf86cd799439012/deduct \
  -H "Content-Type: application/json" \
  -d '{"quantity": 5}'
```

---

### Restore Stock (For cancelled orders)
- **PUT** `/:id/restore`
- **Request**: `{"quantity": 5}`
- **Response** (200): Updated product object

---

### Delete Product
- **DELETE** `/:id`
- **Response** (200): `{"msg": "Product deleted"}`

**cURL**:
```bash
curl -X DELETE http://localhost:5001/api/products/507f1f77bcf86cd799439012
```

---

## Shopping Cart Service (`/api/cart`)

### Add Item to Cart
- **POST** `/:userId/add`
- **Request**:
  ```json
  {
    "productId": "507f1f77bcf86cd799439012",
    "quantity": 2
  }
  ```
- **Response** (201):
  ```json
  {
    "userId": "507f1f77bcf86cd799439011",
    "items": [
      {
        "productId": "507f1f77bcf86cd799439012",
        "quantity": 2
      }
    ]
  }
  ```

**cURL**:
```bash
curl -X POST http://localhost:5002/api/cart/507f1f77bcf86cd799439011/add \
  -H "Content-Type: application/json" \
  -d '{
    "productId": "507f1f77bcf86cd799439012",
    "quantity": 2
  }'
```

---

### Get User Cart
- **GET** `/:userId`
- **Response** (200): Cart object with items

**cURL**:
```bash
curl http://localhost:5002/api/cart/507f1f77bcf86cd799439011
```

---

### Remove Item from Cart
- **DELETE** `/:userId/remove/:productId`
- **Response** (200): Updated cart object

**cURL**:
```bash
curl -X DELETE http://localhost:5002/api/cart/507f1f77bcf86cd799439011/remove/507f1f77bcf86cd799439012
```

---

### Update Cart Item Quantity
- **PUT** `/:userId/update/:productId`
- **Request**: `{"quantity": 5}`
- **Response** (200): Updated cart object

**cURL**:
```bash
curl -X PUT http://localhost:5002/api/cart/507f1f77bcf86cd799439011/update/507f1f77bcf86cd799439012 \
  -H "Content-Type: application/json" \
  -d '{"quantity": 5}'
```

---

## Order Service (`/api/orders`)

### Create Order
- **POST** `/:userId`
- **Request**:
  ```json
  {
    "items": [
      {
        "productId": "507f1f77bcf86cd799439012",
        "quantity": 2
      }
    ],
    "totalAmount": 1999.98,
    "shippingAddress": "123 Main St, Bogotá, Colombia",
    "shippingCost": 50000
  }
  ```
- **Response** (201):
  ```json
  {
    "success": true,
    "message": "Order created successfully...",
    "order": {
      "_id": "507f1f77bcf86cd799439013",
      "userId": "507f1f77bcf86cd799439011",
      "status": "confirmed",
      "items": [...],
      "totalAmount": 1999.98,
      "shippingAddress": "123 Main St...",
      "shippingCost": 50000,
      "estimatedDelivery": "2026-04-13T...",
      "createdAt": "2026-04-06T..."
    }
  }
  ```
- **Errors**:
  - 400: Missing fields / Items out of stock
  - 500: Order creation failed

**cURL**:
```bash
curl -X POST http://localhost:5003/api/orders/507f1f77bcf86cd799439011 \
  -H "Content-Type: application/json" \
  -d '{
    "items": [{"productId": "507f1f77bcf86cd799439012", "quantity": 2}],
    "totalAmount": 1999.98,
    "shippingAddress": "123 Main St, Bogotá, Colombia",
    "shippingCost": 50000
  }'
```

---

### Get User Orders
- **GET** `/:userId`
- **Response** (200):
  ```json
  {
    "success": true,
    "count": 3,
    "orders": [...]
  }
  ```

**cURL**:
```bash
curl http://localhost:5003/api/orders/507f1f77bcf86cd799439011
```

---

### Get Single Order
- **GET** `/:userId/:orderId`
- **Response** (200): Order object
- **Error**: 404 Order not found

**cURL**:
```bash
curl http://localhost:5003/api/orders/507f1f77bcf86cd799439011/507f1f77bcf86cd799439013
```

---

### Update Order Status
- **PUT** `/:orderId/status`
- **Request**:
  ```json
  {
    "status": "shipped"
  }
  ```
- **Valid statuses**: `pending`, `confirmed`, `shipped`, `delivered`, `cancelled`
- **Response** (200):
  ```json
  {
    "success": true,
    "message": "Order status updated to shipped",
    "order": {...}
  }
  ```

**cURL**:
```bash
curl -X PUT http://localhost:5003/api/orders/507f1f77bcf86cd799439013/status \
  -H "Content-Type: application/json" \
  -d '{"status": "shipped"}'
```

---

### Cancel Order
- **DELETE** `/:orderId`
- **Response** (200):
  ```json
  {
    "success": true,
    "message": "Order cancelled successfully",
    "order": {...}
  }
  ```
- **Errors**:
  - 400: Cannot cancel shipped/delivered orders
  - 404: Order not found

**cURL**:
```bash
curl -X DELETE http://localhost:5003/api/orders/507f1f77bcf86cd799439013
```

---

## Payment Service (`/api/payments`)

### Create Payment Intent
- **POST** `/:orderId`
- **Request**:
  ```json
  {
    "amount": 1999.98,
    "currency": "USD"
  }
  ```
- **Response** (201):
  ```json
  {
    "clientSecret": "pi_xxx_secret_xxx",
    "publishableKey": "pk_test_xxx"
  }
  ```

**cURL**:
```bash
curl -X POST http://localhost:5004/api/payments/507f1f77bcf86cd799439013 \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 1999.98,
    "currency": "USD"
  }'
```

---

### Get Payment Info
- **GET** `/:paymentId`
- **Response** (200): Payment object

---

### Get Order Payments
- **GET** `/order/:orderId`
- **Response** (200): Array of payment objects

---

## Notification Service (`/api/notification`)

### Send Email
- **POST** `/email`
- **Request**:
  ```json
  {
    "to": "user@example.com",
    "subject": "Order Confirmation",
    "text": "Your order has been confirmed..."
  }
  ```
- **Response** (200): `"Email sent"`

**cURL**:
```bash
curl -X POST http://localhost:5005/api/notification/email \
  -H "Content-Type: application/json" \
  -d '{
    "to": "user@example.com",
    "subject": "Order Confirmation",
    "text": "Your order has been confirmed..."
  }'
```

---

### Send SMS
- **POST** `/sms`
- **Request**:
  ```json
  {
    "to": "+57XXXXXXXXX",
    "message": "Your order #123 has been shipped!"
  }
  ```
- **Response** (200): `"SMS sent"`

**cURL**:
```bash
curl -X POST http://localhost:5005/api/notification/sms \
  -H "Content-Type: application/json" \
  -d '{
    "to": "+57XXXXXXXXX",
    "message": "Your order #123 has been shipped!"
  }'
```

---

## Authentication

Most endpoints require JWT tokens. Include the token in the `Authorization` header:

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## Error Handling

All services follow a consistent error format:

```json
{
  "error": "Error message description",
  "details": ["additional context if applicable"]
}
```

**HTTP Status Codes**:
- `200`: Success
- `201`: Created
- `400`: Bad Request (validation error)
- `401`: Unauthorized (missing/invalid token)
- `404`: Not Found
- `500`: Internal Server Error

---

## Service Discovery (Kubernetes)

In Kubernetes, services communicate via internal DNS:

```
{service}-{namespace}.svc.cluster.local:{port}
```

Example: `product-service.default.svc.cluster.local:5001`

---

## Rate Limiting

Currently, there is no rate limiting implemented. Consider adding it for production use.

---

## Testing with Postman

To test APIs with Postman:

1. Create a new collection named "Give-Share-Gain"
2. Add environment variables:
   - `BASE_URL`: `http://localhost:8080/api` (local) or `http://api.give-share-gain.com` (production)
   - `JWT_TOKEN`: Add token from login response
3. Import requests using the cURL commands above

---

## Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for instructions on deploying services to production with Kubernetes.
