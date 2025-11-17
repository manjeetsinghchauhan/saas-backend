# Kubernetes Deployment Guide

This guide walks you through deploying the SaaS Backend application to Kubernetes step by step.

## Prerequisites

- Kubernetes cluster running and accessible
- `kubectl` configured to connect to your cluster
- AWS CLI installed and configured (for ECR)
- Docker installed and running
- PostgreSQL database accessible (either in-cluster or external)
- Ingress controller installed (e.g., NGINX Ingress Controller)

## Step-by-Step Deployment

### ⚠️ IMPORTANT: Build and Push Docker Image First

**Before deploying, you must build and push your Docker image to a container registry (ECR, Docker Hub, etc.).**

If you see `ImagePullBackOff` errors, it means the image doesn't exist in the registry.

**Quick fix using the provided script:**

```bash
# Make script executable (if not already)
chmod +x deployment/build-and-push.sh

# Run the script to build and push to ECR
./deployment/build-and-push.sh
```

The script will output your ECR image URI. Update `deployment.yaml` with that URI.

**Manual steps:** See `BUILD_AND_PUSH.md` for detailed instructions.

---

### Step 1: Create Kubernetes Secrets

First, create a secret for sensitive configuration (database password and JWT secret):

```bash
kubectl create secret generic saas-backend-secrets \
  --from-literal=db-password='postgres' \
  --from-literal=jwt-secret='saas_poc_created_by_manjeet'
```

**Verify the secret:**
```bash
kubectl get secret saas-backend-secrets
```

**Note:** Replace `your_postgres_password` and `your_super_secret_jwt_key_here` with your actual values.

---

### Step 2: Deploy the Application (Deployment)

Deploy the application pods:

```bash
kubectl apply -f deployment.yaml
```

**Verify deployment:**
```bash
# Check deployment status
kubectl get deployment saas-backend

# Check pods
kubectl get pods -l app=saas-backend

# View pod logs (if needed)
kubectl logs -l app=saas-backend --tail=50
```

**Wait for pods to be ready:**
```bash
kubectl wait --for=condition=ready pod -l app=saas-backend --timeout=300s
```

---

### Step 3: Create the Service

Expose the deployment via a Service:

```bash
kubectl apply -f service.yaml
```

**Verify service:**
```bash
# Check service
kubectl get service saas-backend

# Get service details
kubectl describe service saas-backend
```

---

### Step 4: Configure Ingress

Deploy the ingress to expose the service externally:

```bash
kubectl apply -f ingress.yaml
```

**Verify ingress:**
```bash
# Check ingress
kubectl get ingress saas-backend

# Get ingress details (to see the LoadBalancer IP)
kubectl describe ingress saas-backend
```

**Get the LoadBalancer IP:**
```bash
# If using LoadBalancer service for ingress controller
kubectl get svc -n ingress-nginx  # or your ingress controller namespace

# Or get from ingress directly
kubectl get ingress saas-backend -o jsonpath='{.status.loadBalancer.ingress[0].ip}'
```

---

## Quick Deployment (All at Once)

If you prefer to deploy everything at once:

```bash
# Create secret first
kubectl create secret generic saas-backend-secrets \
  --from-literal=db-password='your_postgres_password' \
  --from-literal=jwt-secret='your_super_secret_jwt_key_here'

# Deploy all resources
kubectl apply -f deployment.yaml
kubectl apply -f service.yaml
kubectl apply -f ingress.yaml
```

---

## Verification Commands

### Check All Resources

```bash
# View all resources
kubectl get all -l app=saas-backend

# Or check individually
kubectl get deployment,service,ingress saas-backend
```

### Check Pod Status

```bash
# Get pod status
kubectl get pods -l app=saas-backend

# View pod details
kubectl describe pod -l app=saas-backend

# View logs
kubectl logs -l app=saas-backend -f
```

### Test the Application

```bash
# Get the LoadBalancer IP
INGRESS_IP=$(kubectl get ingress saas-backend -o jsonpath='{.status.loadBalancer.ingress[0].ip}')

# Test the API
curl http://$INGRESS_IP/api/v1/health

# Or access in browser
echo "Access the application at: http://$INGRESS_IP"
```

---

## Troubleshooting

### ImagePullBackOff Error (Most Common)

**Symptoms:** Pods show `ImagePullBackOff` or `ErrImagePull` status

**Cause:** Kubernetes cannot pull the Docker image because:
- Image doesn't exist in the registry
- Image path in `deployment.yaml` is incorrect
- Missing authentication for private registry

**Solution:**

1. **Build and push the image first:**
   ```bash
   ./deployment/build-and-push.sh
   ```

2. **Update `deployment.yaml` with the correct ECR image URI:**
   ```yaml
   image: <AWS_ACCOUNT_ID>.dkr.ecr.ap-south-1.amazonaws.com/saas-backend:v1
   ```

3. **Apply the updated deployment:**
   ```bash
   kubectl apply -f deployment/deployment.yaml
   ```

4. **Verify the image path:**
   ```bash
   kubectl get pod -l app=saas-backend -o jsonpath='{.items[0].spec.containers[0].image}'
   ```

5. **Check pod events for detailed error:**
   ```bash
   kubectl describe pod -l app=saas-backend
   ```

### Pods Not Starting

```bash
# Check pod events
kubectl describe pod -l app=saas-backend

# Check logs
kubectl logs -l app=saas-backend

# Check if image exists
kubectl get pod -l app=saas-backend -o jsonpath='{.items[0].spec.containers[0].image}'
```

### Database Connection Issues

```bash
# Verify database connectivity from a pod
kubectl exec -it $(kubectl get pod -l app=saas-backend -o jsonpath='{.items[0].metadata.name}') -- \
  sh -c 'echo $DB_HOST $DB_PORT $DB_NAME'
```

### Service Not Accessible

```bash
# Check service endpoints
kubectl get endpoints saas-backend

# Test service from within cluster
kubectl run -it --rm debug --image=curlimages/curl --restart=Never -- \
  curl http://saas-backend/api/v1/health
```

### Ingress Not Working

```bash
# Check ingress controller
kubectl get pods -n ingress-nginx  # or your ingress namespace

# Check ingress status
kubectl describe ingress saas-backend

# Verify ingress controller is running
kubectl get svc -n ingress-nginx
```

---

## Updating the Deployment

### Update Environment Variables

Edit `deployment.yaml` and apply:

```bash
kubectl apply -f deployment.yaml
kubectl rollout restart deployment saas-backend
```

### Update Secrets

```bash
# Update secret
kubectl create secret generic saas-backend-secrets \
  --from-literal=db-password='new_password' \
  --from-literal=jwt-secret='new_jwt_secret' \
  --dry-run=client -o yaml | kubectl apply -f -

# Restart pods to pick up new secrets
kubectl rollout restart deployment saas-backend
```

### Scale the Deployment

```bash
# Scale to 5 replicas
kubectl scale deployment saas-backend --replicas=5

# Or edit deployment.yaml and change replicas, then apply
kubectl apply -f deployment.yaml
```

---

## Cleanup

To remove all resources:

```bash
kubectl delete -f ingress.yaml
kubectl delete -f service.yaml
kubectl delete -f deployment.yaml
kubectl delete secret saas-backend-secrets
```

Or delete all at once:

```bash
kubectl delete -f deployment/ -R
kubectl delete secret saas-backend-secrets
```

---

## Important Notes

1. **Database Configuration**: Update `DB_HOST` in `deployment.yaml` to match your PostgreSQL service name or external database host.

2. **Image Tag**: Ensure the Docker image `saas-backend:v1` is available in your cluster's container registry. If using a different registry, update the image path in `deployment.yaml`.

3. **Secrets**: Never commit secrets to version control. Use Kubernetes secrets or a secrets management system.

4. **Health Checks**: Consider implementing a `/api/v1/health` endpoint and uncomment the health check probes in `deployment.yaml`.

5. **Resource Limits**: Consider adding resource requests and limits to the deployment for production use.

6. **Ingress Controller**: Make sure you have an ingress controller installed. Common options:
   - NGINX Ingress Controller
   - Traefik
   - AWS ALB Ingress Controller
   - GKE Ingress

---

## Next Steps

- Set up monitoring and logging
- Configure autoscaling (HPA)
- Set up CI/CD pipeline
- Configure backup for database
- Set up SSL/TLS certificates
- Configure resource limits and requests

