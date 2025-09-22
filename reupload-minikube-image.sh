#!/bin/bash
set -euo pipefail

source ./services.sh

print_usage() {
    echo "Usage: $0 [--service <service>]..."
    echo
    echo "If no --service is provided, ALL services will be uploaded."
    echo "Known services: ${SERVICES[*]}"
    echo "Example: $0 --service aliment-svc"
    echo "Example: $0 --service auth-svc,diet-svc"
    echo "Example: $0  (uploads ALL services)"
    exit 1
}

# ensure script runs from repo root
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# parse args: --service <name> | -s <name> (can be repeated or a comma-separated list)
SELECTED=()

if [ "$#" -gt 0 ]; then
  while [ "$#" -gt 0 ]; do
    case "$1" in
      --service|-s)
        shift
        [ -z "${1-}" ] && { echo "Missing value for --service"; print_usage; }
        # allow comma separated list like svc1,svc2
        IFS=',' read -r -a parts <<< "$1"
        for p in "${parts[@]}"; do
          SELECTED+=("$p")
        done
        shift
        ;;
      --help|-h)
        print_usage
        ;;
      *)
        echo "Unknown option: $1"
        print_usage
        ;;
    esac
  done
fi

# if none selected, upload ALL services
if [ "${#SELECTED[@]}" -eq 0 ]; then
  SELECTED=("${SERVICES[@]}")
  echo "📋 No specific service selected - uploading ALL services: ${SELECTED[*]}"
else
  echo "📋 Selected services: ${SELECTED[*]}"
fi

# validate selected services
VALID=()
for s in "${SELECTED[@]}"; do
  found=false
  for ok in "${SERVICES[@]}"; do
    if [ "$s" = "$ok" ]; then
      found=true
      break
    fi
  done
  if ! $found; then
    echo "⚠️  Unknown service: $s"
    echo "Known: ${SERVICES[*]}"
    exit 1
  fi
  VALID+=("$s")
done

# uninstall existing helm release (ignore errors if not present)
if command -v helm >/dev/null 2>&1; then
  echo "⟳ Running: helm uninstall questnutri (if present)"
  helm uninstall questnutri --namespace default || true
else
  echo "⚠️  helm not found in PATH, skipping helm uninstall"
fi

echo "1/4 ▶ Running frontend/build: npm run build:all"
npm run build:all

echo "2/4 ▶ Building docker images for ${#VALID[@]} service(s)"
for SERVICE in "${VALID[@]}"; do
  echo "  🔨 Building service: $SERVICE"
  
  # Same priority logic as build-docker.sh
  if [ -d "$SERVICE" ] && [ -f "$SERVICE/Dockerfile" ]; then
    docker build --pull -t "$SERVICE:latest" -f "$SERVICE/Dockerfile" "$SERVICE"
  elif [ -f "Dockerfile.$SERVICE" ]; then
    docker build --pull -t "$SERVICE:latest" -f "Dockerfile.$SERVICE" .
  elif [ -f "Dockerfile.base" ]; then
    docker build --pull -t "$SERVICE:latest" --build-arg SERVICE="$SERVICE" -f Dockerfile.base .
  else
    echo "⚠️  No Dockerfile found for $SERVICE (checked $SERVICE/Dockerfile, Dockerfile.$SERVICE, Dockerfile.base)"
    exit 1
  fi
done

echo "3/4 ▶ Removing and loading ${#VALID[@]} image(s) into minikube"
for SERVICE in "${VALID[@]}"; do
  IMAGE="${SERVICE}:latest"
  
  echo "  ↻ Removing image from minikube (if present): $IMAGE"
  minikube ssh -- docker image rm -f "$IMAGE" >/dev/null 2>&1 || true
  
  echo "  ↑ Loading local image into minikube: $IMAGE"
  minikube image load "$IMAGE"
done

echo "4/4 ▶ Installing helm chart"
if command -v helm >/dev/null 2>&1; then
  echo "⟳ Running: helm install questnutri ./helm"
  helm install questnutri ./helm
else
  echo "⚠️  helm not found in PATH, skipping helm install"
fi

echo "✅ Done. Uploaded ${#VALID[@]} service(s) to minikube: ${VALID[*]}"