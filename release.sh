#!/bin/bash

show_current_versions() {
    echo "Current Versions"
    echo "================================="
    
    echo "Services:"
    for service in ./apps/*; do
        if [ -f "$service/package.json" ]; then
            VERSION=$(grep -m 1 '"version":' "$service/package.json" | cut -d'"' -f4)
            echo "🔹 $(basename "$service"): v${VERSION}"
        fi
    done
    
    echo
    echo "Helm Images:"
    if [ -f "helm/values.yaml" ]; then
        grep 'image:' helm/values.yaml | while read -r line; do
            if [[ $line =~ questnutri/([^:]+):([^ ]+) ]]; then
                echo "🔹 ${BASH_REMATCH[1]}: v${BASH_REMATCH[2]}"
            fi
        done
    else
        echo "helm/values.yaml not found"
    fi
    echo "================================="
    exit 0
}

if [ "$1" == "--current" ]; then
    show_current_versions
fi

if [ -z "$1" ]; then
    echo "Error: Version argument is required"
    echo "Usage: ./release.sh <version> | --current"
    echo "Examples:"
    echo "  ./release.sh 1.0.0    # Update versions"
    echo "  ./release.sh --current # Show current versions"
    exit 1
fi

NEW_VERSION=$1

update_version() {
    local file=$1
    if [ -f "$file" ]; then
        sed -i "s/\"version\": \".*\"/\"version\": \"$NEW_VERSION\"/" "$file"
        echo "Updated version in $file to $NEW_VERSION"
    fi
}

update_helm_values() {
    local file="helm/values.yaml"
    if [ -f "$file" ]; then
        sed -i "s/:latest/:$NEW_VERSION/g" "$file"
        echo "Updated image versions in $file to $NEW_VERSION"
    else
        echo "Warning: $file not found"
    fi
}

echo "Updating service versions..."
for service in ./apps/*-svc; do
    if [ -d "$service" ]; then
        update_version "$service/package.json"
    fi
done

echo "Updating Helm values..."
update_helm_values

echo "Version update complete! All services and Helm configurations updated to version $NEW_VERSION"