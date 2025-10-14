#!/bin/bash

# Source the services list
source ./services.sh

# Default values
VERSION=""
SELECTED_SERVICES=()
DOCKER_USERNAME="questnutri"

# Color codes for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Function to display usage
usage() {
    echo "Usage: $0 -v <version> [-s <service1>] [-s <service2>] ..."
    echo ""
    echo "Options:"
    echo "  -v <version>    Version tag to apply (required)"
    echo "  -s <service>    Specific service to retag (optional, can be used multiple times)"
    echo ""
    echo "If no -s is provided, all services will be retagged"
    echo ""
    echo "Example:"
    echo "  $0 -v 1.0 -s auth-svc -s nutritionist-svc"
    echo "  $0 -v 2.0  (retags all services)"
    exit 1
}

# Parse command line arguments
while getopts "v:s:h" opt; do
    case $opt in
        v)
            VERSION="$OPTARG"
            ;;
        s)
            SELECTED_SERVICES+=("$OPTARG")
            ;;
        h)
            usage
            ;;
        \?)
            echo "Invalid option: -$OPTARG" >&2
            usage
            ;;
    esac
done

# Validate version is provided
if [ -z "$VERSION" ]; then
    echo -e "${RED}Error: Version is required${NC}"
    usage
fi

# If no specific services selected, use all services
if [ ${#SELECTED_SERVICES[@]} -eq 0 ]; then
    SELECTED_SERVICES=("${SERVICES[@]}")
    echo -e "${YELLOW}No specific services selected. Processing all services...${NC}"
else
    echo -e "${BLUE}Processing selected services only...${NC}"
fi

echo ""
echo -e "${GREEN}======================================${NC}"
echo -e "${GREEN}Docker Image Rebase to version: ${VERSION}${NC}"
echo -e "${GREEN}======================================${NC}"
echo ""

# Process each selected service
for service in "${SELECTED_SERVICES[@]}"; do
    # Check if service exists in SERVICES array
    if [[ ! " ${SERVICES[@]} " =~ " ${service} " ]]; then
        echo -e "${RED}Warning: ${service} not found in services list. Skipping...${NC}"
        continue
    fi

    OLD_IMAGE="${DOCKER_USERNAME}/${service}:latest"
    NEW_IMAGE="${DOCKER_USERNAME}/${service}:${VERSION}"
    
    echo -e "${BLUE}Processing: ${service}${NC}"
    echo "  Old tag: ${OLD_IMAGE}"
    echo "  New tag: ${NEW_IMAGE}"
    
    # Pull the latest image
    echo "  Pulling latest image..."
    if docker pull "${OLD_IMAGE}"; then
        echo -e "  ${GREEN}✓${NC} Pull successful"
    else
        echo -e "  ${RED}✗${NC} Failed to pull image. Skipping ${service}..."
        echo ""
        continue
    fi
    
    # Tag with new version
    echo "  Tagging with new version..."
    if docker tag "${OLD_IMAGE}" "${NEW_IMAGE}"; then
        echo -e "  ${GREEN}✓${NC} Tag successful"
    else
        echo -e "  ${RED}✗${NC} Failed to tag image. Skipping push..."
        echo ""
        continue
    fi
    
    # Push to Docker Hub
    echo "  Pushing to Docker Hub..."
    if docker push "${NEW_IMAGE}"; then
        echo -e "  ${GREEN}✓${NC} Push successful"
    else
        echo -e "  ${RED}✗${NC} Failed to push image"
        echo ""
        continue
    fi
    
    echo -e "${GREEN}==> ${service}:${VERSION} ✓${NC}"
    echo ""
done

echo ""
echo -e "${GREEN}======================================${NC}"
echo -e "${GREEN}Rebase completed!${NC}"
echo -e "${GREEN}======================================${NC}"
