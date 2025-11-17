# Building and Pushing Docker Image to AWS ECR

This guide will help you build your Docker image and push it to Amazon ECR so Kubernetes can pull it.

## Prerequisites

- AWS CLI installed and configured
- Docker installed and running
- AWS account with ECR access
- kubectl configured for your EKS cluster

## Step 1: Create ECR Repository

```bash
# Set your AWS region
export AWS_REGION=ap-south-1

# Create ECR repository
aws ecr create-repository \
  --repository-name saas-backend \
  --region $AWS_REGION
```

**Note:** If the repository already exists, you can skip this step.

## Step 2: Get ECR Login Token

```bash
# Get AWS account ID
export AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)

# Login to ECR
aws ecr get-login-password --region $AWS_REGION | \
  docker login --username AWS --password-stdin $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com
```

## Step 3: Build the Docker Image

```bash
# Navigate to project root
cd /Users/manjeetchauhan/Documents/Projects/saas-backend

# Build the image
docker build -t saas-backend:v1 .
```

## Step 4: Tag the Image for ECR

```bash
# Tag the image with ECR repository URI
docker tag saas-backend:v1 \
  $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/saas-backend:v1
```

## Step 5: Push the Image to ECR

```bash
# Push the image
docker push $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/saas-backend:v1
```

## Step 6: Update Deployment YAML

After pushing, update `deployment.yaml` with your ECR image path:

```yaml
image: <AWS_ACCOUNT_ID>.dkr.ecr.ap-south-1.amazonaws.com/saas-backend:v1
```

## Complete Script (All Steps Together)

Save this as `build-and-push.sh`:

```bash
#!/bin/bash

# Configuration
export AWS_REGION=ap-south-1
export IMAGE_NAME=saas-backend
export IMAGE_TAG=v1

# Get AWS account ID
export AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
export ECR_REPOSITORY=$AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$IMAGE_NAME

echo "AWS Account ID: $AWS_ACCOUNT_ID"
echo "ECR Repository: $ECR_REPOSITORY"

# Create ECR repository (if it doesn't exist)
echo "Creating ECR repository..."
aws ecr create-repository \
  --repository-name $IMAGE_NAME \
  --region $AWS_REGION 2>/dev/null || echo "Repository already exists"

# Login to ECR
echo "Logging in to ECR..."
aws ecr get-login-password --region $AWS_REGION | \
  docker login --username AWS --password-stdin $ECR_REPOSITORY

# Build the image
echo "Building Docker image..."
docker build -t $IMAGE_NAME:$IMAGE_TAG .

# Tag the image
echo "Tagging image..."
docker tag $IMAGE_NAME:$IMAGE_TAG $ECR_REPOSITORY:$IMAGE_TAG

# Push the image
echo "Pushing image to ECR..."
docker push $ECR_REPOSITORY:$IMAGE_TAG

echo "✅ Image pushed successfully!"
echo "Update deployment.yaml with: $ECR_REPOSITORY:$IMAGE_TAG"
```

Make it executable and run:
```bash
chmod +x build-and-push.sh
./build-and-push.sh
```

## Alternative: Using Docker Hub

If you prefer to use Docker Hub instead of ECR:

```bash
# Login to Docker Hub
docker login

# Build and tag
docker build -t your-dockerhub-username/saas-backend:v1 .

# Push
docker push your-dockerhub-username/saas-backend:v1

# Update deployment.yaml
# image: your-dockerhub-username/saas-backend:v1
```

## Verify Image in ECR

```bash
# List images in repository
aws ecr describe-images \
  --repository-name saas-backend \
  --region $AWS_REGION
```

## Troubleshooting

### Permission Denied
If you get permission errors, ensure your AWS credentials have ECR permissions:
- `ecr:GetAuthorizationToken`
- `ecr:BatchCheckLayerAvailability`
- `ecr:GetDownloadUrlForLayer`
- `ecr:BatchGetImage`
- `ecr:PutImage`
- `ecr:InitiateLayerUpload`
- `ecr:UploadLayerPart`
- `ecr:CompleteLayerUpload`

### Image Not Found After Push
- Verify the image was pushed: `aws ecr describe-images --repository-name saas-backend`
- Check the image path in deployment.yaml matches exactly
- Ensure your EKS cluster has IAM permissions to pull from ECR

### Build Fails
- Check Dockerfile syntax
- Ensure all required files are present
- Check `.dockerignore` isn't excluding necessary files

