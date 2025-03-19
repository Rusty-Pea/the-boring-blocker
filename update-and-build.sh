#!/bin/bash
# Script to update project from GitHub and build

echo "=== Starting update and build process ==="

# Step 1: Save any uncommitted changes
echo "Stashing any uncommitted changes..."
git stash

# Step 2: Pull the latest version from GitHub
echo "Pulling latest changes from GitHub..."
git pull origin main

# Step 3: Update dependencies
echo "Installing/updating dependencies..."
npm install

# Step 4: Build the project
echo "Building the project..."
npm run build

echo "=== Process completed ==="
echo "If you had local changes, you can restore them with 'git stash pop'"
