#!/bin/bash
set -euo pipefail
# ...existing code...

print_usage() {
    echo "Usage: $0 --service <service-name>  (or -s <service-name>)"
    echo "Example: $0 --service aliment-svc"
    exit 1
}

SERVICE=""

while [ "$#" -gt 0 ]; do
  case "$1" in
    -s|--service)
      shift
      [ -z "${1-}" ] && { echo "Missing value for --service"; print_usage; }
      SERVICE="$1"
      shift
      ;;
    -h|--help)
      print_usage
      ;;
    *)
      echo "Unknown option: $1"
      print_usage
      ;;
  esac
done

[ -n "$SERVICE" ] || print_usage

# ensure script runs from repo root
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# uninstall existing helm release (ignore errors if not present)
if command -v helm >/dev/null 2>&1; then
  echo "⟳ Running: helm uninstall questnutri (if present)"
  helm uninstall questnutri --namespace default || true
else
  echo "⚠️  helm not found in PATH, skipping helm uninstall"
fi

echo "1/4 ▶ Running frontend/build: npm run build:all"
npm run build:all

echo "2/4 ▶ Building docker image for service: $SERVICE"
./build-docker.sh --service "$SERVICE"

IMAGE="${SERVICE}:latest"

echo "3/4 ▶ Removing image from minikube (if present): $IMAGE"
if command -v minikube >/dev/null 2>&1; then
  if minikube image rm "$IMAGE" >/dev/null 2>&1; then
    echo "Removed $IMAGE via 'minikube image rm'."
  else
    echo "'minikube image rm' not successful or image not present, trying inside minikube VM..."
    minikube ssh -- docker image rm -f "$IMAGE" >/dev/null 2>&1 || true
  fi
else
  echo "minikube not found in PATH"
  exit 1
fi

echo "4/4 ▶ Loading local image into minikube: $IMAGE"
minikube image load "$IMAGE"

echo "✅ Done. Loaded $IMAGE into minikube."

# install helm chart
if command -v helm >/dev/null 2>&1; then
  echo "⟳ Running: helm install questnutri ./helm"
  helm install questnutri ./helm
else
  echo "⚠️  helm not found in PATH, skipping helm install"
fi