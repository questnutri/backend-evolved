#!/bin/bash
set -e

source ./services.sh

# ensure script runs from repo root
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# parse args: --service <name> | -s <name> (can be repeated or comma-separated list)
SELECTED=()
PUSH_TO_HUB=false
VERSION=""
DO_BUILD=false
print_usage() {
  echo "Usage: $0 [--service <service>]... [--version <version>] [--push] [--build]"
  echo
  echo "Options:"
  echo "  --service, -s <service>   Build specific service(s) (can be repeated or comma-separated)"
  echo "  --version, -v <version>   Specify image version tag (default: extracted from package.json or latest)"
  echo "  --push                    Push built images to Docker Hub after building"
  echo "  --build, -b               Run nx build for selected services before building Docker images"
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
      --version|-v)
        shift
        [ -z "${1-}" ] && { echo "Missing value for --version"; print_usage; }
        VERSION="$1"
        shift
        ;;
      --push|-p)
        PUSH_TO_HUB=true
        shift
        ;;
      --build|-b)
        DO_BUILD=true
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

# If --build/-b is set, run nx build for each selected service
if [ "$DO_BUILD" = true ]; then
  NX_BUILD_ARGS=()
  for SERVICE in "${VALID[@]}"; do
    NX_BUILD_ARGS+=("-p" "$SERVICE")
  done
  echo "🏗️  Running: npx nx run-many -t build ${NX_BUILD_ARGS[*]}"
  npx nx run-many -t build "${NX_BUILD_ARGS[@]}"
fi

for SERVICE in "${VALID[@]}"; do
  # --- Version extraction logic ---
  VERSION_TO_USE="$VERSION"
  if [ -z "$VERSION" ]; then
    PKG_JSON_PATH="apps/$SERVICE/package.json"
    if [ -f "$PKG_JSON_PATH" ]; then
      if command -v jq >/dev/null 2>&1; then
        EXTRACTED_VERSION=$(jq -r '.version // empty' "$PKG_JSON_PATH")
      else
        EXTRACTED_VERSION=$(grep '"version"' "$PKG_JSON_PATH" | head -1 | sed -E 's/.*"version": *"([^"]+)".*/\1/')
      fi
      if [ -n "$EXTRACTED_VERSION" ]; then
        VERSION_TO_USE="$EXTRACTED_VERSION"
      else
        echo "⚠️  Could not extract version from $PKG_JSON_PATH, using 'latest'"
        VERSION_TO_USE="latest"
      fi
    else
      echo "⚠️  No package.json found at $PKG_JSON_PATH, using 'latest'"
      VERSION_TO_USE="latest"
    fi
  fi

  echo
  echo "🔨 Building service: $SERVICE (version: $VERSION_TO_USE)"

  # Priority:
  # 1) ./<service>/Dockerfile
  # 2) ./Dockerfile.<service>
  # 3) ./Dockerfile.base with --build-arg SERVICE=<service>
  if [ -d "$SERVICE" ] && [ -f "$SERVICE/Dockerfile" ]; then
    docker build --pull -t "questnutri/$SERVICE:$VERSION_TO_USE" -f "$SERVICE/Dockerfile" "$SERVICE"
  elif [ -f "Dockerfile.$SERVICE" ]; then
    docker build --pull -t "questnutri/$SERVICE:$VERSION_TO_USE" -f "Dockerfile.$SERVICE" .
  elif [ -f "Dockerfile.base" ]; then
    docker build --pull -t "questnutri/$SERVICE:$VERSION_TO_USE" --build-arg SERVICE="$SERVICE" -f Dockerfile.base .
  else
    echo "⚠️  No Dockerfile found for $SERVICE (checked $SERVICE/Dockerfile, Dockerfile.$SERVICE, Dockerfile.base)"
    exit 1
  fi

  # Push to Docker Hub if --push flag was provided
  if [ "$PUSH_TO_HUB" = true ]; then
    echo "📤 Pushing questnutri/$SERVICE:$VERSION_TO_USE to Docker Hub..."
    docker push "questnutri/$SERVICE:$VERSION_TO_USE"
    echo "✅ Pushed questnutri/$SERVICE:$VERSION_TO_USE"
  fi
done

echo
echo "✅ Done."