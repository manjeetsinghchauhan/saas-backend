#!/bin/bash

echo "Checking Ingress Controller LoadBalancer IP..."
echo "=========================================="
echo ""

# Check ingress controller service
echo "Ingress Controller Service:"
kubectl get svc -n ingress-nginx ingress-nginx-controller

echo ""
echo "Ingress Resource:"
kubectl get ingress saas-backend

echo ""
echo "Waiting for LoadBalancer IP to be assigned..."
echo "This may take 2-5 minutes for AWS to provision the ELB..."
echo ""

# Wait for external IP
while true; do
  EXTERNAL_IP=$(kubectl get svc -n ingress-nginx ingress-nginx-controller -o jsonpath='{.status.loadBalancer.ingress[0].hostname}' 2>/dev/null)
  
  if [ -n "$EXTERNAL_IP" ]; then
    echo ""
    echo "✅ LoadBalancer IP/Hostname assigned!"
    echo "=========================================="
    echo "External Hostname: $EXTERNAL_IP"
    echo ""
    echo "Access your application at:"
    echo "  http://$EXTERNAL_IP"
    echo ""
    
    # Try to get IP if it's a hostname
    IP=$(kubectl get svc -n ingress-nginx ingress-nginx-controller -o jsonpath='{.status.loadBalancer.ingress[0].ip}' 2>/dev/null)
    if [ -n "$IP" ]; then
      echo "  or http://$IP"
    fi
    echo ""
    break
  else
    echo -n "."
    sleep 5
  fi
done

