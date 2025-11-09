#!/bin/bash
set -e

source ./services.sh

# ensure script runs from repo root
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# parse args: --service <name> | -s <name> (can be repeated or a comma-separated list)
SELECTED=()
VERSION=""
FORCE=false
ALL_VERSIONS=false
print_usage() {
  echo "Usage: $0 [--service <service>]... [--version <version>] [--all-versions] [--force]"
  echo
  echo "Options:"
  echo "  --service, -s <service>   Delete specific service(s) (can be repeated or comma-separated)"
  echo "  --version, -v <version>   Specify image version tag (default: latest)"
  echo "  --all-versions, -a        Delete all versions of the image(s), including <none> tags"
  echo "  --force, -f               Skip confirmation prompt"
  echo
  echo "If no --service is provided, all services will be deleted."
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
      --all-versions|-a)
        ALL_VERSIONS=true
        shift
        ;;
      --force|-f)
        FORCE=true
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

# if none selected, delete all
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

# Show what will be deleted
echo "🗑️  The following images will be deleted:"
for SERVICE in "${VALID[@]}"; do
  if [ "$ALL_VERSIONS" = true ]; then
    docker images --format "{{.Repository}}:{{.Tag}} {{.ID}}" | grep "^questnutri/$SERVICE:" | awk '{print $1 " (" $2 ")"}' || echo "  - No images found for questnutri/$SERVICE"
    # Also show <none> tags for this repo
    docker images --format "{{.Repository}}:{{.Tag}} {{.ID}}" | grep "^questnutri/$SERVICE:<none>" | awk '{print $1 " (" $2 ")"}'
  else
    TAG="${VERSION:-latest}"
    echo "  - questnutri/$SERVICE:$TAG"
  fi
done
echo

# Confirm unless --force flag is used
if [ "$FORCE" = false ]; then
  read -p "Continue? (y/N) " -n 1 -r
  echo
  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Cancelled."
    exit 1
  fi
fi

# Delete images
for SERVICE in "${VALID[@]}"; do
  if [ "$ALL_VERSIONS" = true ]; then
    # Get all images for this service, including <none> tags
    IMAGE_IDS=$(docker images --format "{{.Repository}}:{{.Tag}} {{.ID}}" | grep "^questnutri/$SERVICE:" | awk '{print $2}' | sort -u)
    if [ -z "$IMAGE_IDS" ]; then
      echo "⚠️  No images found for questnutri/$SERVICE"
    else
      for IMAGE_ID in $IMAGE_IDS; do
        if [ "$IMAGE_ID" != "<none>" ]; then
          echo
          echo "🗑️  Deleting image ID: $IMAGE_ID"
          if docker rmi "$IMAGE_ID" 2>/dev/null; then
            echo "✅ Deleted $IMAGE_ID"
          else
            echo "⚠️  Image not found or could not delete: $IMAGE_ID"
          fi
        fi
      done
      # Now delete <none> tags for this repo
      NONE_IDS=$(docker images --format "{{.Repository}}:{{.Tag}} {{.ID}}" | grep "^questnutri/$SERVICE:<none>" | awk '{print $2}' | sort -u)
      for NONE_ID in $NONE_IDS; do
        echo
        echo "🗑️  Deleting <none> image ID: $NONE_ID"
        if docker rmi "$NONE_ID" 2>/dev/null; then
          echo "✅ Deleted $NONE_ID"
        else
          echo "⚠️  <none> image not found or could not delete: $NONE_ID"
        fi
      done
    fi
  else
    TAG="${VERSION:-latest}"
    IMAGE="questnutri/$SERVICE:$TAG"
    echo
    echo "🗑️  Deleting image: $IMAGE"
    if docker rmi "$IMAGE" 2>/dev/null; then
      echo "✅ Deleted $IMAGE"
    else
      echo "⚠️  Image not found or could not delete: $IMAGE"
    fi
  fi
done

echo
echo "✅ Done."