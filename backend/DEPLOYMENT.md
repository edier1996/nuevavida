# Kubernetes Deployment Guide

Complete guide for deploying Give-Share-Gain backend microservices to Kubernetes.

## Prerequisites

- Kubernetes cluster (local: Docker Desktop with K8s enabled, or cloud: AWS EKS, Google GKE, etc.)
- `kubectl` CLI installed and configured
- Docker images built and pushed to a registry (Docker Hub, ECR, GCR, etc.)
- `helm` (optional, for advanced deployments)

```bash
# Verify kubectl configuration
kubectl cluster-info
kubectl get nodes
```

---

## Step 1: Set Up Kubernetes Cluster

### Option 1: Local Development (Docker Desktop)

1. Open Docker Desktop settings
2. Go to **Kubernetes** tab
3. Enable Kubernetes
4. Wait for the cluster to start (status shows "Kubernetes is running")

```bash
# Verify local cluster
kubectl get nodes
# Should show: docker-desktop   Ready   control-plane   ...
```

### Option 2: Cloud Deployment (AWS EKS)

```bash
# Install AWS CLI and EKS CLI
aws --version
eksctl version

# Create cluster
eksctl create cluster --name give-share-gain --region us-east-1 --nodes 3

# Update kubeconfig
aws eks update-kubeconfig --name give-share-gain --region us-east-1
```

---

## Step 2: Create Namespace

Isolate your application in a dedicated namespace:

```bash
kubectl create namespace givesgain
kubectl config set-context --current --namespace=givesgain

# Verify namespace
kubectl get namespaces
kubectl config current-context
```

---

## Step 3: Create Kubernetes Secrets

Store sensitive configuration securely:

```bash
# Create Secret for MongoDB credentials
kubectl create secret generic mongo-credentials \
  --from-literal=username=admin \
  --from-literal=password=your-secure-password \
  -n givesgain

# Create Secret for JWT
kubectl create secret generic jwt-secret \
  --from-literal=JWT_SECRET=your-super-secret-key-change-this \
  -n givesgain

# Create Secret for Stripe
kubectl create secret generic stripe-secret \
  --from-literal=STRIPE_SECRET_KEY=sk_test_your_key \
  -n givesgain

# Create Secret for Email (NodeMailer)
kubectl create secret generic email-secret \
  --from-literal=NODEMAILER_EMAIL=your-email@gmail.com \
  --from-literal=NODEMAILER_PASSWORD=your-app-password \
  -n givesgain

# Create Secret for Twilio
kubectl create secret generic twilio-secret \
  --from-literal=TWILIO_ACCOUNT_SID=your_sid \
  --from-literal=TWILIO_AUTH_TOKEN=your_token \
  --from-literal=TWILIO_PHONE_NUMBER=+1234567890 \
  -n givesgain

# Verify secrets
kubectl get secrets -n givesgain
```

---

## Step 4: Deploy MongoDB

### Using StatefulSet (Recommended)

```bash
# Create persistent storage
kubectl apply -f mongo-statefulset.yaml -n givesgain
kubectl apply -f mongo-service.yaml -n givesgain

# Wait for MongoDB to be ready
kubectl wait --for=condition=Ready pod -l app=mongo -n givesgain --timeout=300s

# Verify MongoDB is running
kubectl get pods -n givesgain -l app=mongo
kubectl logs mongo-0 -n givesgain
```

### Test MongoDB Connection

```bash
# Port forward to test locally
kubectl port-forward mongo-0 27017:27017 -n givesgain &

# Test connection with MongoDB client
mongo --host localhost:27017 -u admin -p "your-password" --authenticationDatabase admin
# > show databases
# > exit
```

---

## Step 5: Build and Push Docker Images

Build images and push to registry (Docker Hub example):

```bash
cd backend

# For each microservice:
for service in user-service product-service shopping-cart-service order-service payment-service notification-service; do
  cd $service
  docker build -t {your-docker-username}/$service:latest .
  docker push {your-docker-username}/$service:latest
  cd ..
done
```

**Or push to AWS ECR**:

```bash
# Create ECR repository
aws ecr create-repository --repository-name give-share-gain/user-service --region us-east-1

# Login to ECR
aws ecr get-login-password --region us-east-1 | \
  docker login --username AWS --password-stdin YOUR_AWS_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com

# Tag and push
docker tag user-service:latest YOUR_AWS_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/give-share-gain/user-service:latest
docker push YOUR_AWS_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/give-share-gain/user-service:latest
```

---

## Step 6: Create ConfigMap for Service URIs

```bash
# Create ConfigMap with inter-service URIs
kubectl create configmap service-uris \
  --from-literal=USER_SERVICE_URI=http://user-service.givesgain.svc.cluster.local:5000 \
  --from-literal=PRODUCT_SERVICE_URI=http://product-service.givesgain.svc.cluster.local:5001 \
  --from-literal=CART_SERVICE_URI=http://shopping-cart-service.givesgain.svc.cluster.local:5002 \
  --from-literal=ORDER_SERVICE_URI=http://order-service.givesgain.svc.cluster.local:5003 \
  --from-literal=PAYMENT_SERVICE_URI=http://payment-service.givesgain.svc.cluster.local:5004 \
  --from-literal=NOTIFICATION_SERVICE_URI=http://notification-service.givesgain.svc.cluster.local:5005 \
  -n givesgain

# Verify ConfigMap
kubectl get configmaps -n givesgain
```

---

## Step 7: Deploy Microservices

Deploy services in this order (to respect dependencies):

```bash
# 1. Deploy core services first
kubectl apply -f user-service/deployment.yaml -n givesgain
kubectl apply -f user-service/service.yaml -n givesgain

kubectl apply -f product-service/deployment.yaml -n givesgain
kubectl apply -f product-service/service.yaml -n givesgain

# 2. Deploy dependent services
kubectl apply -f shopping-cart-service/deployment.yaml -n givesgain
kubectl apply -f shopping-cart-service/service.yaml -n givesgain

kubectl apply -f order-service/deployment.yaml -n givesgain
kubectl apply -f order-service/service.yaml -n givesgain

kubectl apply -f payment-service/deployment.yaml -n givesgain
kubectl apply -f payment-service/service.yaml -n givesgain

# 3. Deploy notification service
kubectl apply -f notification-service/deployment.yaml -n givesgain
kubectl apply -f notification-service/service.yaml -n givesgain

# Verify all pods are running
kubectl get pods -n givesgain
kubectl wait --for=condition=Ready pod -l app -n givesgain --timeout=300s
```

---

## Step 8: Deploy API Gateway (Ingress)

Configure external access to the cluster:

```bash
# Install Ingress controller (if not already installed)
kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/controller-v1.8.0/deploy/static/provider/cloud/deploy.yaml

# Apply Ingress configuration
kubectl apply -f ingress.yaml -n givesgain

# Get Ingress IP/hostname (wait 1-2 minutes for external IP to be assigned)
kubectl get ingress -n givesgain
# You'll see External IP like: 104.XXX.XXX.XXX

# For local testing, use port-forward instead:
kubectl port-forward svc/user-service 5000:5000 -n givesgain &
kubectl port-forward svc/product-service 5001:5001 -n givesgain &
# ... etc for other services
```

---

## Step 9: Configure DNS

Point your domain to the Ingress IP:

```bash
# Get Ingress IP
INGRESS_IP=$(kubectl get ingress api-gateway-ingress -n givesgain -o jsonpath='{.status.loadBalancer.ingress[0].ip}')
echo "Ingress IP: $INGRESS_IP"

# In your DNS provider (Route 53, Cloudflare, etc.):
# A record: api.give-share-gain.com -> $INGRESS_IP
```

**For local testing**, update your `/etc/hosts` (Mac/Linux) or `C:\Windows\System32\drivers\etc\hosts` (Windows):

```
127.0.0.1 api.give-share-gain.local
127.0.0.1 product-service.local
```

---

## Step 10: Verify Deployment

### Check Service Health

```bash
# View all resources
kubectl get all -n givesgain

# Check logs of a specific service
kubectl logs deployment/user-service -n givesgain
kubectl logs deployment/user-service -f -n givesgain  # Follow logs

# Describe pod for events/errors
kubectl describe pod user-service-xxxxx -n givesgain
```

### Test API Endpoints

```bash
# Port forward for testing
kubectl port-forward svc/user-service 5000:5000 -n givesgain

# In another terminal, test endpoint
curl http://localhost:5000/api/users/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "password": "password123"
  }'
```

---

## Step 11: Set Up Monitoring

### Install Prometheus & Grafana (Optional)

```bash
# Add Prometheus Helm repository
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm repo update

# Install Prometheus
helm install prometheus prometheus-community/kube-prometheus-stack -n givesgain

# Access Grafana
kubectl port-forward svc/prometheus-grafana 3000:80 -n givesgain
# Visit http://localhost:3000
# Default credentials: admin/prom-operator
```

---

## Step 12: Enable Auto-Scaling

```bash
# Install Metrics Server (if not installed)
kubectl apply -f https://github.com/kubernetes-sigs/metrics-server/releases/latest/download/components.yaml

# Create Horizontal Pod Autoscaler
kubectl autoscale deployment user-service --min=2 --max=5 --cpu-percent=80 -n givesgain
kubectl autoscale deployment product-service --min=2 --max=5 --cpu-percent=80 -n givesgain
kubectl autoscale deployment order-service --min=2 --max=5 --cpu-percent=80 -n givesgain

# View HPA status
kubectl get hpa -n givesgain
kubectl describe hpa user-service -n givesgain
```

---

## Production Checklist

- [ ] Secrets stored in Kubernetes Secrets (not in code/deployment files)
- [ ] ConfigMaps for environment-specific configuration
- [ ] Resource requests/limits set for all pods
- [ ] Liveness and readiness probes configured
- [ ] Horizontal Pod Autoscaling enabled
- [ ] Network policies restricting inter-pod traffic
- [ ] Persistent volumes for MongoDB data
- [ ] Log aggregation configured (ELK, Cloud Logging)
- [ ] HTTPS/TLS enabled for Ingress
- [ ] Regular backups of MongoDB data
- [ ] Monitoring and alerting configured
- [ ] Load testing completed before go-live

---

## Troubleshooting

### Pod stuck in CrashLoopBackOff

```bash
kubectl logs deployment/user-service -n givesgain
# Check error messages and fix configuration
```

### MongoDB connection fails

```bash
# Verify MongoDB is running
kubectl get pods -n givesgain -l app=mongo

# Check MongoDB logs
kubectl logs mongo-0 -n givesgain

# Test connection
kubectl exec -it mongo-0 -n givesgain -- mongosh -u admin
```

### Service can't reach another service

```bash
# Test DNS resolution inside pod
kubectl exec -it user-service-xxxxx -n givesgain -- nslookup product-service

# Test network connectivity
kubectl exec -it user-service-xxxxx -n givesgain -- curl http://product-service:5001/api/products
```

---

## Cleanup

```bash
# Delete entire namespace (removes all resources)
kubectl delete namespace givesgain

# Or delete specific resources
kubectl delete deployment -n givesgain --all
kubectl delete service -n givesgain --all
```

---

## Resources

- [Kubernetes Documentation](https://kubernetes.io/docs/)
- [kubectl Cheat Sheet](https://kubernetes.io/docs/reference/kubectl/cheatsheet/)
- [Kubernetes Best Practices](https://kubernetes.io/docs/concepts/configuration/overview/)
