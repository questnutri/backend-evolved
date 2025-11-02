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
print_usage() {
  echo "Usage: $0 [--service <service>]... [--version <version>] [--force]"
  echo
  echo "Options:"
  echo "  --service, -s <service>   Delete specific service(s) (can be repeated or comma-separated)"
  echo "  --version, -v <version>   Specify image version tag (default: latest)"
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

# if no version specified, use latest
if [ -z "$VERSION" ]; then
  VERSION="latest"
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
  echo "  - questnutri/$SERVICE:$VERSION"
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
  echo
  echo "🗑️  Deleting image: questnutri/$SERVICE:$VERSION"
  
  if docker rmi "questnutri/$SERVICE:$VERSION" 2>/dev/null; then
    echo "✅ Deleted questnutri/$SERVICE:$VERSION"
  else
    echo "⚠️  Image not found or could not delete: questnutri/$SERVICE:$VERSION"
  fi
done

echo
echo "✅ Done."