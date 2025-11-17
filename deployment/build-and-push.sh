#!/bin/bash

# Configuration
export AWS_REGION=ap-south-1
export IMAGE_NAME=saas-backend

# Tag generation options:
# Option 1: Use timestamp (recommended for unique tags)
#export IMAGE_TAG="v1-$(date +%Y%m%d-%H%M%S)"

# Option 2: Use git commit hash (uncomment to use)
# export IMAGE_TAG="v1-$(git rev-parse --short HEAD)"

# Option 3: Use fixed tag (not recommended - requires manual updates)
 export IMAGE_TAG="v2"

# Option 4: Auto-update deployment (set to true to auto-update deployment.yaml)
AUTO_UPDATE_DEPLOYMENT=true

# Get AWS account ID
export AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
export ECR_REPOSITORY=$AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$IMAGE_NAME

echo "=========================================="
echo "Building and Pushing Docker Image to ECR"
echo "=========================================="
echo "AWS Account ID: $AWS_ACCOUNT_ID"
echo "AWS Region: $AWS_REGION"
echo "ECR Repository: $ECR_REPOSITORY"
echo "Image Tag: $IMAGE_TAG"
echo "=========================================="
echo ""

# Create ECR repository (if it doesn't exist)
echo "Step 1: Creating ECR repository (if needed)..."
aws ecr create-repository \
  --repository-name $IMAGE_NAME \
  --region $AWS_REGION 2>/dev/null && echo "✅ Repository created" || echo "ℹ️  Repository already exists"

# Login to ECR
echo ""
echo "Step 2: Logging in to ECR..."
aws ecr get-login-password --region $AWS_REGION | \
  docker login --username AWS --password-stdin $ECR_REPOSITORY

if [ $? -eq 0 ]; then
  echo "✅ ECR login successful"
else
  echo "❌ ECR login failed"
  exit 1
fi

# Navigate to project root
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
cd "$PROJECT_ROOT"

# Build the image
echo ""
echo "Step 3: Building Docker image..."
docker build -t $IMAGE_NAME:$IMAGE_TAG .

if [ $? -eq 0 ]; then
  echo "✅ Docker image built successfully"
else
  echo "❌ Docker build failed"
  exit 1
fi

# Tag the image
echo ""
echo "Step 4: Tagging image for ECR..."
docker tag $IMAGE_NAME:$IMAGE_TAG $ECR_REPOSITORY:$IMAGE_TAG
echo "✅ Image tagged"

# Push the image
echo ""
echo "Step 5: Pushing image to ECR..."
docker push $ECR_REPOSITORY:$IMAGE_TAG

if [ $? -eq 0 ]; then
  echo ""
  echo "=========================================="
  echo "✅ SUCCESS! Image pushed to ECR"
  echo "=========================================="
  echo ""
  echo "ECR Image URI: $ECR_REPOSITORY:$IMAGE_TAG"
  echo ""
  
  # Auto-update deployment.yaml if enabled
  if [ "$AUTO_UPDATE_DEPLOYMENT" = true ]; then
    echo "Auto-updating deployment.yaml..."
    DEPLOYMENT_FILE="$PROJECT_ROOT/deployment/deployment.yaml"
    
    # Update the image in deployment.yaml
    if [[ "$OSTYPE" == "darwin"* ]]; then
      # macOS
      sed -i '' "s|image:.*saas-backend.*|image: $ECR_REPOSITORY:$IMAGE_TAG|" "$DEPLOYMENT_FILE"
    else
      # Linux
      sed -i "s|image:.*saas-backend.*|image: $ECR_REPOSITORY:$IMAGE_TAG|" "$DEPLOYMENT_FILE"
    fi
    
    echo "✅ deployment.yaml updated with new image"
    echo ""
    echo "Next step:"
    echo "  kubectl apply -f deployment/deployment.yaml"
    echo ""
  else
    echo "Next steps:"
    echo "1. Update deployment.yaml with this image:"
    echo "   image: $ECR_REPOSITORY:$IMAGE_TAG"
    echo ""
    echo "2. Apply the updated deployment:"
    echo "   kubectl apply -f deployment/deployment.yaml"
    echo ""
    echo "💡 Tip: Set AUTO_UPDATE_DEPLOYMENT=true in this script to auto-update deployment.yaml"
    echo ""
  fi
else
  echo "❌ Docker push failed"
  exit 1
fi

