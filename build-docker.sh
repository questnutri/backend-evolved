#!/bin/bash
set -e

SERVICES=(
  "auth-svc"
  "diet-svc"
  "patient-svc"
  "admin-svc"
  "nutritionist-svc"
  "gateway"
  "aliment-svc"
)

for SERVICE in "${SERVICES[@]}"; do
  echo
  echo "🔨 Building service: $SERVICE"
  
  docker build \
    -f Dockerfile.base \
    -t "$SERVICE:latest" \
    --build-arg SERVICE="$SERVICE" \
    .
done

echo
echo "✅ All images have been built successfully!"
