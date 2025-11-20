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

# Update helm/values.yaml to match each package.json version exactly.
update_helm_values_from_packages() {
    local values="helm/values.yaml"
    if [ ! -f "$values" ]; then
        echo "Warning: $values not found"
        return 1
    fi

    # For each service directory like ./apps/<name>-svc, read its package.json version
    for service in ./apps/*-svc; do
        if [ -f "$service/package.json" ]; then
            svc_dirname=$(basename "$service")
            # image name: strip trailing -svc if present
            image_name="${svc_dirname%-svc}"
            pkg_version=$(grep -m 1 '"version":' "$service/package.json" | cut -d'"' -f4)
            if [ -z "$pkg_version" ]; then
                echo "Warning: no version found in $service/package.json"
                continue
            fi

            # Replace occurrences like questnutri/<image_name>:<tag> -> questnutri/<image_name>:<pkg_version>
            # Use a backup for portability and remove it immediately to avoid leftover files.
            sed -E -i.bak "s|(questnutri/${image_name}):[^[:space:],\"']+|\1:${pkg_version}|g" "$values"
            rm -f "${values}.bak"
            echo "Set questnutri/${image_name} -> ${pkg_version} in $values"
        fi
    done

    echo "Updated $values from package.json versions"
    return 0
}

if [ "$1" == "--current" ]; then
    show_current_versions
fi

# If user invoked --helm, only update helm/values.yaml from current package.json versions
if [ "$1" == "--helm" ]; then
    update_helm_values_from_packages
    exit $?
fi

if [ -z "$1" ]; then
    echo "Error: Version argument is required"
    echo "Usage: ./release.sh <version> | --helm | --current"
    echo "Examples:"
    echo "  ./release.sh 1.0.0        # Update versions and helm values to given version"
    echo "  ./release.sh --helm       # Update helm/values.yaml to match package.json versions"
    echo "  ./release.sh --current    # Show current versions"
    exit 1
fi

NEW_VERSION=$1

update_version() {
    local file=$1
    if [ -f "$file" ]; then
        sed -i.bak "s/\"version\": \".*\"/\"version\": \"$NEW_VERSION\"/" "$file"
        rm -f "${file}.bak"
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