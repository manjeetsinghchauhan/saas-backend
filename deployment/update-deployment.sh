#!/bin/bash

# Script to update deployment.yaml with the latest ECR image
# Usage: ./update-deployment.sh [image-tag]
# Example: ./update-deployment.sh v1-20241118-120530

# Configuration
export AWS_REGION=ap-south-1
export IMAGE_NAME=saas-backend
export AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
export ECR_REPOSITORY=$AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$IMAGE_NAME

# Get image tag from argument or use latest
if [ -z "$1" ]; then
  echo "Getting latest image tag from ECR..."
  IMAGE_TAG=$(aws ecr describe-images \
    --repository-name $IMAGE_NAME \
    --region $AWS_REGION \
    --query 'sort_by(imageDetails,&imagePushedAt)[-1].imageTags[0]' \
    --output text 2>/dev/null)
  
  if [ -z "$IMAGE_TAG" ] || [ "$IMAGE_TAG" = "None" ]; then
    echo "❌ Could not find latest image tag. Please specify manually:"
    echo "   ./update-deployment.sh <tag>"
    exit 1
  fi
  echo "Found latest tag: $IMAGE_TAG"
else
  IMAGE_TAG=$1
fi

DEPLOYMENT_FILE="$(dirname "$0")/deployment.yaml"
FULL_IMAGE_URI="$ECR_REPOSITORY:$IMAGE_TAG"

echo "Updating deployment.yaml with image: $FULL_IMAGE_URI"

# Update the image in deployment.yaml
if [[ "$OSTYPE" == "darwin"* ]]; then
  # macOS
  sed -i '' "s|image:.*saas-backend.*|image: $FULL_IMAGE_URI|" "$DEPLOYMENT_FILE"
else
  # Linux
  sed -i "s|image:.*saas-backend.*|image: $FULL_IMAGE_URI|" "$DEPLOYMENT_FILE"
fi

if [ $? -eq 0 ]; then
  echo "✅ deployment.yaml updated successfully"
  echo ""
  echo "Next step:"
  echo "  kubectl apply -f deployment/deployment.yaml"
else
  echo "❌ Failed to update deployment.yaml"
  exit 1
fi

