#!/bin/bash

# make sure this script is outside both frontend and backend directories
# This script builds the frontend and copies the build output to the backend directory.

# Exit immediately on error
set -e

# Define paths
FRONTEND_DIR="./FSDFront"
BACKEND_DIR="./FSDBackend"
BUILD_DIR="$FRONTEND_DIR/dist" # change to build if using CRA
TARGET_DIR="$BACKEND_DIR/front"

# Step 1: Build frontend
echo "Building frontend..."
cd "$FRONTEND_DIR"
npm install
npm run build
cd - > /dev/null

# Step 2: Copy build to backend
echo "Copying frontend build to backend..."
rm -rf "$TARGET_DIR"
mkdir -p "$TARGET_DIR"
cp -r "$BUILD_DIR"/. "$TARGET_DIR"

echo "✅ Done: Frontend build copied to backend."
