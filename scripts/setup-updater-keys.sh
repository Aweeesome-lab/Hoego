#!/bin/bash
# Setup Tauri updater signing keys
# Run this once to generate keys for auto-update signing

set -e

KEY_DIR="$HOME/.tauri"
KEY_FILE="$KEY_DIR/hoego.key"

mkdir -p "$KEY_DIR"

echo "🔐 Generating Tauri updater signing keys..."
echo ""
echo "Enter a password (or leave empty for no password):"
echo ""

npx @tauri-apps/cli signer generate -w "$KEY_FILE"

echo ""
echo "✅ Keys generated!"
echo ""
echo "📋 Next steps:"
echo ""
echo "1. Copy the PUBLIC key above and paste it in:"
echo "   src-tauri/tauri.conf.json → tauri.updater.pubkey"
echo ""
echo "2. Add these to GitHub Secrets:"
echo "   - TAURI_SIGNING_PRIVATE_KEY: contents of $KEY_FILE"
echo "   - TAURI_SIGNING_PRIVATE_KEY_PASSWORD: your password"
echo ""
echo "3. Update the endpoint URL in tauri.conf.json"
echo "   Replace YOUR_USERNAME with your GitHub username"
