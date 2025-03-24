#!/bin/bash

# Script to copy files from current repository to the-boring-blocker

# Display what we're doing
echo "Copying files from current repository to the-boring-blocker..."

# Get the current directory name
CURRENT_DIR=$(basename "$PWD")
echo "Current directory: $CURRENT_DIR"

# Define the target directory (adjust if needed)
TARGET_DIR="../the-boring-blocker"
echo "Target directory: $TARGET_DIR"

# Check if target directory exists
if [ ! -d "$TARGET_DIR" ]; then
  echo "Error: Target directory $TARGET_DIR does not exist."
  echo "Please make sure the-boring-blocker repository is cloned at the same level as this repository."
  exit 1
fi

# Create a backup of the target directory (just in case)
BACKUP_DIR="../the-boring-blocker-backup-$(date +%Y%m%d_%H%M%S)"
echo "Creating backup of target directory at $BACKUP_DIR"
cp -r "$TARGET_DIR" "$BACKUP_DIR"

# Clean the target directory (preserving .git folder and LICENSE)
echo "Cleaning target directory (preserving .git folder and LICENSE)..."
find "$TARGET_DIR" -mindepth 1 -not -path "$TARGET_DIR/.git*" -not -name "LICENSE" -exec rm -rf {} \; 2>/dev/null || true

# Copy all files from current directory to target, excluding .git and node_modules
echo "Copying files to target directory..."
rsync -av --progress ./* "$TARGET_DIR" --exclude .git --exclude node_modules --exclude "copy-to-release-repo.sh"

# Copy hidden files (but not .git directory)
echo "Copying hidden files..."
find . -maxdepth 1 -name ".*" -type f | grep -v ".git" | xargs -I{} cp {} "$TARGET_DIR"

# Build the project in the target directory
echo "Building the project in target directory..."
cd "$TARGET_DIR" || exit 1
npm install
npm run build

# Create the release ZIP file
echo "Creating release ZIP file..."
cd dist || exit 1
mkdir -p "../../releases"
zip -r "../../releases/boring-blocker-extension.zip" *

# Go back to original directory
cd "$OLDPWD" || exit 1

echo "Done!"
echo "Files copied from $CURRENT_DIR to $TARGET_DIR"
echo "Project built and release ZIP created at ../releases/boring-blocker-extension.zip"
echo "Don't forget to commit and push the changes to the-boring-blocker repository!" 