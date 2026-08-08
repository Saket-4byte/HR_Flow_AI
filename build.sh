#!/usr/bin/env bash

# HR Flow AI - Unix/Linux/macOS Build Script Wrapper
# Executes cross-platform Node.js build runner

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo "=================================================="
echo "🚀 HR Flow AI - Unix/Linux Build Launcher"
echo "=================================================="

node "$SCRIPT_DIR/scripts/build.js"
