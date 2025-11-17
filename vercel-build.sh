#!/bin/bash

# Vercel build script for full-stack deployment
echo "Building VaccineTrack for Vercel..."

# Install dependencies
echo "Installing dependencies..."
npm install

# Build frontend
echo "Building frontend..."
npm run build:frontend

# Backend is already compiled, just copy files
echo "Setting up backend structure..."
mkdir -p dist/api
cp -r api/* dist/api/ 2>/dev/null || true

# Create main API entry point
echo "Creating API entry point..."
cp dist/api/index.js dist/api/server.js 2>/dev/null || true

echo "Build completed successfully!"