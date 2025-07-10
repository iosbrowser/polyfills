#!/bin/bash

# Script to build and optimize polyfill scripts for packaging
# This processes all scripts from ./scripts and ./scripts-post, transpiles and minifies them
# for optimal package size and runtime performance
#
# Usage: ./build-scripts.sh [--force]
#   --force: Force rebuild all files regardless of whether they've changed

set -e

# Parse command line arguments
FORCE_REBUILD=false
if [[ "$1" == "--force" ]]; then
    FORCE_REBUILD=true
    echo "Force rebuild mode: all files will be processed"
fi

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SOURCE_SCRIPTS="$SCRIPT_DIR/scripts"
SOURCE_SCRIPTS_PRIORITY="$SCRIPT_DIR/scripts-priority"
SOURCE_SCRIPTS_POST="$SCRIPT_DIR/scripts-post"
TARGET_BASE="$SCRIPT_DIR/layout/Library/Application Support/Polyfills"
CACHE_FILE="$SCRIPT_DIR/.build-cache"

echo "Building and optimizing polyfill scripts..."

# Function to get file checksum for change detection
get_file_checksum() {
    local file_path="$1"
    if [ -f "$file_path" ]; then
        shasum -a 256 "$file_path" | cut -d' ' -f1
    else
        echo ""
    fi
}

# Function to check if file has changed since last build
file_has_changed() {
    local source_file="$1"
    local target_file="$2"

    # If force rebuild is enabled, always return true
    if [ "$FORCE_REBUILD" = true ]; then
        return 0
    fi

    # If target doesn't exist, file needs processing
    if [ ! -f "$target_file" ]; then
        return 0
    fi

    # Get current checksum
    local current_checksum
    current_checksum=$(get_file_checksum "$source_file")

    # Get cached checksum
    local cached_checksum=""
    if [ -f "$CACHE_FILE" ]; then
        cached_checksum=$(grep "^$source_file:" "$CACHE_FILE" 2>/dev/null | cut -d':' -f2)
    fi

    # Compare checksums
    if [ "$current_checksum" != "$cached_checksum" ]; then
        return 0 # File has changed
    else
        return 1 # File unchanged
    fi
}

# Function to update cache with file checksum
update_cache() {
    local source_file="$1"
    local checksum
    checksum=$(get_file_checksum "$source_file")

    # Create cache file if it doesn't exist
    touch "$CACHE_FILE"

    # Remove old entry if exists
    if [ -f "$CACHE_FILE" ]; then
        grep -v "^$source_file:" "$CACHE_FILE" >"$CACHE_FILE.tmp" 2>/dev/null || true
        mv "$CACHE_FILE.tmp" "$CACHE_FILE"
    fi

    # Add new entry
    echo "$source_file:$checksum" >>"$CACHE_FILE"
}

# Function to copy file only if it doesn't exist in target or has changed
copy_if_needed() {
    local source_file="$1"
    local target_file="$2"
    local target_dir=$(dirname "$target_file")

    # Create target directory if it doesn't exist
    mkdir -p "$target_dir"

    # If target doesn't exist, copy it
    if [ ! -f "$target_file" ]; then
        cp "$source_file" "$target_file"
        return 0
    fi

    # If force rebuild is enabled, always copy
    if [ "$FORCE_REBUILD" = true ]; then
        cp "$source_file" "$target_file"
        return 0
    fi

    # Check if source file has changed
    if file_has_changed "$source_file" "$target_file"; then
        cp "$source_file" "$target_file"
        return 0
    fi

    # File hasn't changed, don't copy
    return 1
}

# Function to copy directory structure intelligently
copy_directory_structure() {
    local source_dir="$1"
    local target_dir="$2"
    local dir_name="$3"

    if [ ! -d "$source_dir" ]; then
        return 0
    fi

    echo "Copying $dir_name structure..."

    # Create target directory
    mkdir -p "$target_dir"

    # Copy directory structure (non-JS files and directories)
    find "$source_dir" -type d | while IFS= read -r dir; do
        local relative_dir="${dir#$source_dir/}"
        if [ "$relative_dir" != "$dir" ]; then # Skip the root directory
            mkdir -p "$target_dir/$relative_dir"
        fi
    done

    # Copy non-JS files
    find "$source_dir" -type f ! -name "*.js" | while IFS= read -r file; do
        local relative_file="${file#$source_dir/}"
        copy_if_needed "$file" "$target_dir/$relative_file"
    done

    # Create base directory
    mkdir -p "$target_dir/base"

    # Handle JS files
    find "$source_dir" -maxdepth 1 -name "*.js" -type f | while IFS= read -r js_file; do
        local filename=$(basename "$js_file")
        local target_file="$target_dir/base/$filename"

        if copy_if_needed "$js_file" "$target_file"; then
            echo "  Copied $(basename "$js_file") to base folder"
        fi
    done

    # Handle JS files in subdirectories
    find "$source_dir" -mindepth 2 -name "*.js" -type f | while IFS= read -r js_file; do
        local relative_file="${js_file#$source_dir/}"
        local target_file="$target_dir/$relative_file"

        if copy_if_needed "$js_file" "$target_file"; then
            echo "  Copied $relative_file"
        fi
    done

    # Remove disabled files
    find "$target_dir" -name "*.disabled" -delete 2>/dev/null || true
}
process_js_folder() {
    local folder_path="$1"
    local folder_name=$(basename "$folder_path")

    if [ ! -d "$folder_path" ]; then
        return 0
    fi

    # Check if there are any JS files to process
    local js_files
    js_files=$(find "$folder_path" -maxdepth 1 -name "*.js" -type f)

    if [ -z "$js_files" ]; then
        echo "Processing folder: $folder_name - No JavaScript files found"
        return 0
    fi

    echo "Processing folder: $folder_name"

    # Check for npx command once per folder
    if ! command -v npx &>/dev/null; then
        echo "  Warning: npx not found. Skipping transpilation/minification for $folder_name" >&2
        return 0
    fi

    # Process each JS file in the folder
    echo "$js_files" | while IFS= read -r js_file; do
        local filename=$(basename "$js_file")

        # Find corresponding source file to check for changes
        local source_file=""
        local relative_path="${js_file#$TARGET_BASE/}"

        # Determine source file path based on target location
        if [[ "$relative_path" == scripts-priority/* ]]; then
            local sub_path="${relative_path#scripts-priority/}"
            # Handle base folder mapping (base/file.js -> file.js)
            if [[ "$sub_path" == base/* ]]; then
                source_file="$SOURCE_SCRIPTS_PRIORITY/${sub_path#base/}"
            else
                source_file="$SOURCE_SCRIPTS_PRIORITY/$sub_path"
            fi
        elif [[ "$relative_path" == scripts-post/* ]]; then
            local sub_path="${relative_path#scripts-post/}"
            # Handle base folder mapping (base/file.js -> file.js)
            if [[ "$sub_path" == base/* ]]; then
                source_file="$SOURCE_SCRIPTS_POST/${sub_path#base/}"
            else
                source_file="$SOURCE_SCRIPTS_POST/$sub_path"
            fi
        elif [[ "$relative_path" == scripts/* ]]; then
            local sub_path="${relative_path#scripts/}"
            # Handle base folder mapping (base/file.js -> file.js)
            if [[ "$sub_path" == base/* ]]; then
                source_file="$SOURCE_SCRIPTS/${sub_path#base/}"
            else
                source_file="$SOURCE_SCRIPTS/$sub_path"
            fi
        fi

        # Check if file has changed
        if [ -n "$source_file" ] && ! file_has_changed "$source_file" "$js_file"; then
            echo "  ↻ Unchanged: $filename (skipped)"
            continue
        fi

        local temp_js_transpiled
        local temp_js_minified

        temp_js_transpiled=$(mktemp)
        temp_js_minified=$(mktemp)

        # Local trap for temp files
        trap 'rm -f "$temp_js_transpiled" "$temp_js_minified"; trap - RETURN EXIT INT TERM' RETURN EXIT INT TERM

        # Transpile with Babel
        if npx babel "$js_file" -o "$temp_js_transpiled" 2>/dev/null; then
            # Minify with UglifyJS
            if npx uglifyjs "$temp_js_transpiled" -o "$temp_js_minified" 2>/dev/null; then
                cp "$temp_js_minified" "$js_file"
                echo "  ✓ Processed: $filename (transpiled + minified)"

                # Update cache if we have source file
                if [ -n "$source_file" ]; then
                    update_cache "$source_file"
                fi
            else
                # Minification failed, use transpiled version
                cp "$temp_js_transpiled" "$js_file"
                echo "  ⚠ Transpiled only: $filename (minification failed)"

                # Update cache if we have source file
                if [ -n "$source_file" ]; then
                    update_cache "$source_file"
                fi
            fi
        else
            # Transpilation failed, keep original
            echo "  ✗ Skipped: $filename (transpilation failed)"
        fi

        # Cleanup handled by trap
    done

    echo "  Completed processing $folder_name"
    return 0
}

# Create target directories
mkdir -p "$TARGET_BASE/scripts"
mkdir -p "$TARGET_BASE/scripts-post"
mkdir -p "$TARGET_BASE/scripts-priority"

# Copy directory structures intelligently
copy_directory_structure "$SOURCE_SCRIPTS" "$TARGET_BASE/scripts" "scripts"
copy_directory_structure "$SOURCE_SCRIPTS_PRIORITY" "$TARGET_BASE/scripts-priority" "scripts-priority"
copy_directory_structure "$SOURCE_SCRIPTS_POST" "$TARGET_BASE/scripts-post" "scripts-post"

echo ""
echo "Building and optimizing JavaScript files with Babel and UglifyJS..."

# Process all folders in scripts directory (excluding root level)
if [ -d "$TARGET_BASE/scripts" ]; then
    find "$TARGET_BASE/scripts" -mindepth 1 -type d | while IFS= read -r folder; do
        process_js_folder "$folder"
    done
fi

# Process all folders in scripts-priority directory (excluding root level)
if [ -d "$TARGET_BASE/scripts-priority" ]; then
    find "$TARGET_BASE/scripts-priority" -mindepth 1 -type d | while IFS= read -r folder; do
        process_js_folder "$folder"
    done
fi

# Process all folders in scripts-post directory (excluding root level)
if [ -d "$TARGET_BASE/scripts-post" ]; then
    find "$TARGET_BASE/scripts-post" -mindepth 1 -type d | while IFS= read -r folder; do
        process_js_folder "$folder"
    done
fi

echo ""
if [ "$FORCE_REBUILD" = true ]; then
    echo "Force rebuild completed. All JavaScript files have been transpiled and minified."
else
    echo "Incremental build completed. Only changed JavaScript files were processed."
fi
echo "Optimized structure created at: $TARGET_BASE"
echo "Build cache stored at: $CACHE_FILE"
