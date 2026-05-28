#!/bin/bash
set -e

echo "Installing dependencies..."
npm install

echo "Creating uploads directory..."
mkdir -p uploads

echo "Build complete!"
