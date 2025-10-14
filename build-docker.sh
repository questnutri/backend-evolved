#!/bin/bash
set -e

source ./services.sh

# ensure script runs from repo root
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# parse args: --service <name> | -s <name> (can be repeated or a comma-separated list)
SELECTED=()
PUSH_TO_HUB=false
print_usage() {
  echo "Usage: $0 [--service <service>]... [--push]"
  echo
  echo "Options:"
  echo "  --service, -s <service>   Build specific service(s) (can be repeated or comma-separated)"
  echo "  --push                    Push built images to Docker Hub after building"
  echo
  echo "If no --service is provided, all services will be built."
  echo "Known services: ${SERVICES[*]}"
  exit 1
}

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
      --push)
        PUSH_TO_HUB=true
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

# if none selected, build all
if [ "${#SELECTED[@]}" -eq 0 ]; then
  SELECTED=("${SERVICES[@]}")
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

for SERVICE in "${VALID[@]}"; do
  echo
  echo "🔨 Building service: $SERVICE"

  # Priority:
  # 1) ./<service>/Dockerfile
  # 2) ./Dockerfile.<service>
  # 3) ./Dockerfile.base with --build-arg SERVICE=<service>
  if [ -d "$SERVICE" ] && [ -f "$SERVICE/Dockerfile" ]; then
    docker build --pull -t "questnutri/$SERVICE:latest" -f "$SERVICE/Dockerfile" "$SERVICE"
  elif [ -f "Dockerfile.$SERVICE" ]; then
    docker build --pull -t "questnutri/$SERVICE:latest" -f "Dockerfile.$SERVICE" .
  elif [ -f "Dockerfile.base" ]; then
    docker build --pull -t "questnutri/$SERVICE:latest" --build-arg SERVICE="$SERVICE" -f Dockerfile.base .
  else
    echo "⚠️  No Dockerfile found for $SERVICE (checked $SERVICE/Dockerfile, Dockerfile.$SERVICE, Dockerfile.base)"
    exit 1
  fi

  # Push to Docker Hub if --push flag was provided
  if [ "$PUSH_TO_HUB" = true ]; then
    echo "📤 Pushing questnutri/$SERVICE:latest to Docker Hub..."
    docker push "questnutri/$SERVICE:latest"
    echo "✅ Pushed questnutri/$SERVICE:latest"
  fi
done

echo
echo "✅ Done."
