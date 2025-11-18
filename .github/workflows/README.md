# GitHub Actions Workflow Setup

This document explains how to configure the GitHub Actions workflow for automatic CI/CD to AWS EKS.

## Workflow Overview

The workflow (`build-and-deploy.yml`) automatically:
1. **Builds** a Docker image when code is pushed to `main` branch or when a PR is merged
2. **Pushes** the image to Amazon ECR
3. **Deploys** the new image to your EKS cluster

## Required GitHub Secrets

You need to configure the following secrets in your GitHub repository:

### 1. Go to Repository Settings
- Navigate to: `https://github.com/YOUR_USERNAME/saas-backend/settings/secrets/actions`
- Or: Repository → Settings → Secrets and variables → Actions

### 2. Add the Following Secrets

#### `AWS_ACCESS_KEY_ID`
- Your AWS Access Key ID
- Required permissions:
  - ECR: `ecr:GetAuthorizationToken`, `ecr:BatchCheckLayerAvailability`, `ecr:GetDownloadUrlForLayer`, `ecr:BatchGetImage`, `ecr:PutImage`, `ecr:InitiateLayerUpload`, `ecr:UploadLayerPart`, `ecr:CompleteLayerUpload`
  - EKS: `eks:DescribeCluster`, `eks:ListClusters`
  - IAM: `iam:PassRole` (if using IAM roles for service accounts)

#### `AWS_SECRET_ACCESS_KEY`
- Your AWS Secret Access Key (corresponding to the Access Key ID above)

#### `EKS_CLUSTER_NAME`
- The name of your EKS cluster
- Example: `my-eks-cluster` or `saas-backend-cluster`
- You can find this in AWS Console → EKS → Clusters

## AWS IAM Permissions

The AWS credentials need the following permissions:

### ECR Permissions
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "ecr:GetAuthorizationToken",
        "ecr:BatchCheckLayerAvailability",
        "ecr:GetDownloadUrlForLayer",
        "ecr:BatchGetImage",
        "ecr:PutImage",
        "ecr:InitiateLayerUpload",
        "ecr:UploadLayerPart",
        "ecr:CompleteLayerUpload"
      ],
      "Resource": "*"
    }
  ]
}
```

### EKS Permissions
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "eks:DescribeCluster",
        "eks:ListClusters"
      ],
      "Resource": "*"
    }
  ]
}
```

### Recommended: Use IAM Role for GitHub Actions

For better security, consider using OIDC to connect GitHub Actions to AWS:
1. Create an IAM role with the above permissions
2. Configure GitHub OIDC provider in AWS
3. Update the workflow to use `role-to-assume` instead of access keys

## Workflow Triggers

The workflow runs automatically when:
- ✅ Code is pushed to `main` branch
- ✅ A Pull Request is merged to `main` branch
- ✅ A tag starting with `v` is pushed (e.g., `v1.0.0`)
- ✅ Manually triggered via GitHub Actions UI (workflow_dispatch)

## Workflow Steps

### Job 1: Build and Push
1. Checks out the code
2. Configures AWS credentials
3. Logs into Amazon ECR
4. Builds Docker image
5. Tags image with commit SHA (and also as `latest` and `v1`)
6. Pushes image to ECR

### Job 2: Deploy to EKS
1. Configures AWS credentials
2. Installs kubectl and AWS CLI
3. Configures kubectl to connect to EKS cluster
4. Updates deployment with new image
5. Applies Kubernetes manifests (deployment, service, ingress)
6. Waits for rollout to complete
7. Verifies deployment status

## Image Tagging Strategy

- **Main branch**: Images are tagged with the first 7 characters of the commit SHA (e.g., `abc1234`)
- **Tags**: Images are tagged with the tag name (e.g., `v1.0.0`)
- **Additional tags**: All images are also tagged as `latest` and `v1` for convenience

## Troubleshooting

### Workflow Fails at ECR Login
- Verify `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY` are correct
- Check that the credentials have ECR permissions
- Ensure the ECR repository exists

### Workflow Fails at kubectl Connection
- Verify `EKS_CLUSTER_NAME` secret is set correctly
- Check that AWS credentials have EKS permissions
- Ensure the EKS cluster exists and is accessible

### Deployment Fails
- Check that the deployment name matches: `saas-backend`
- Verify the namespace (defaults to `default`)
- Check EKS cluster logs: `kubectl logs -l app=saas-backend`

### Image Pull Errors
- Ensure EKS nodes have IAM permissions to pull from ECR
- Check that the image URI in deployment matches the pushed image
- Verify ECR repository policy allows EKS to pull images

## Manual Testing

You can manually trigger the workflow:
1. Go to Actions tab in GitHub
2. Select "Build, Push to ECR, and Deploy to EKS"
3. Click "Run workflow"
4. Select branch and click "Run workflow"

## Monitoring

After deployment, check:
- GitHub Actions logs for build and deployment status
- EKS cluster: `kubectl get pods -l app=saas-backend`
- Application logs: `kubectl logs -l app=saas-backend`

