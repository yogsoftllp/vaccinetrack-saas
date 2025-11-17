#!/bin/bash

echo "Starting Vercel build process..."

# Install dependencies
echo "Installing dependencies..."
npm install

# Build frontend
echo "Building frontend..."
npm run build:frontend

# Build backend (if needed)
echo "Building backend..."
npm run build:backend

# Create dist structure
echo "Creating dist structure..."
mkdir -p dist/api
cp -r api/* dist/api/
echo 'const app = require("./app.js"); module.exports = app;' > dist/api/index.js

echo "Build completed successfully!"