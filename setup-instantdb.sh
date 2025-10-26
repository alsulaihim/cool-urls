#!/bin/bash

# InstantDB Setup Script
# This script will attempt to push schema and permissions to InstantDB

set -e

echo "🚀 InstantDB Setup Script"
echo "=========================="
echo ""

# Check if instant-cli is available
echo "📦 Checking InstantDB CLI..."
echo ""

# Push schema
echo "📋 Pushing schema to InstantDB..."
echo "⚠️  You'll need to press ENTER to confirm the changes"
echo ""
npx instant-cli@latest push schema

echo ""
echo "✅ Schema pushed successfully!"
echo ""

# Push permissions
echo "🔒 Pushing permissions to InstantDB..."
echo "⚠️  You'll need to press ENTER to confirm the changes"
echo ""
npx instant-cli@latest push perms

echo ""
echo "✅ Permissions pushed successfully!"
echo ""

echo "🎉 InstantDB setup complete!"
echo ""
echo "Next steps:"
echo "1. Refresh your app at http://localhost:3000"
echo "2. Try creating a short URL"
echo "3. The 'Mutation failed' error should be gone!"
echo ""
