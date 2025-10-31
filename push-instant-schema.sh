#!/bin/bash

echo "📦 Pushing InstantDB Schema and Permissions..."
echo ""

# Push schema
echo "1️⃣ Pushing schema..."
npx instant-cli@latest push schema --skip-push-check 2>&1 | grep -v "npm warn"

echo ""
echo "2️⃣ Pushing permissions..."
npx instant-cli@latest push perms --skip-push-check 2>&1 | grep -v "npm warn"

echo ""
echo "✅ Done! Your InstantDB schema and permissions have been updated."
echo "🔄 Please restart your development server for changes to take effect."
