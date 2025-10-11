#!/bin/bash

# Script to generate .env.example from .env file
# This script reads the .env file and creates a .env.example with empty values

ENV_FILE=".env"
EXAMPLE_FILE=".env.example"

# Variables to exclude from .env.example
EXCLUDE_VARS=("AUTH_PRIVATE_KEY" "AUTH_PUBLIC_KEY")

# Check if .env file exists
if [ ! -f "$ENV_FILE" ]; then
    echo "Error: $ENV_FILE file not found!"
    exit 1
fi

# Create or overwrite .env.example
echo "# Example environment file" > "$EXAMPLE_FILE"
echo "# Copy this file to .env and fill in the values" >> "$EXAMPLE_FILE"
echo "" >> "$EXAMPLE_FILE"

# Flag to track if we're inside a multi-line value that should be skipped
skip_until_end=false

# Read .env line by line
while IFS= read -r line || [ -n "$line" ]; do
    # If we're currently skipping lines (inside an excluded multi-line value)
    if [[ "$skip_until_end" == true ]]; then
        # Check if this line ends with a closing quote (end of multi-line value)
        if [[ "$line" =~ \"[[:space:]]*$ ]]; then
            skip_until_end=false
        fi
        continue
    fi
    
    # Check if this line starts with an excluded variable
    should_exclude=false
    for exclude_var in "${EXCLUDE_VARS[@]}"; do
        if [[ "$line" =~ ^${exclude_var}= ]]; then
            should_exclude=true
            # Check if it's a multi-line value (starts with quote but doesn't end with quote on same line)
            if [[ "$line" =~ =\"[^\"]*$ ]]; then
                skip_until_end=true
            fi
            break
        fi
    done
    
    # Skip this line if it's an excluded variable
    if [[ "$should_exclude" == true ]]; then
        continue
    fi
    
    # Skip empty lines and comments - preserve them
    if [[ -z "$line" ]] || [[ "$line" =~ ^[[:space:]]*# ]]; then
        echo "$line" >> "$EXAMPLE_FILE"
    # Process lines with = (environment variables)
    elif [[ "$line" =~ = ]]; then
        # Extract the key (everything before the first =)
        key="${line%%=*}"
        # Write key with empty value
        echo "${key}=" >> "$EXAMPLE_FILE"
    else
        # Keep other lines as-is
        echo "$line" >> "$EXAMPLE_FILE"
    fi
done < "$ENV_FILE"

echo "Successfully created $EXAMPLE_FILE from $ENV_FILE"
