#!/bin/bash

echo "============================================"
echo "  IrwFS Mobile App - Android Build Script"
echo "============================================"
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "ERROR: Node.js is not installed!"
    echo "Please install Node.js from https://nodejs.org/"
    exit 1
fi

# Check if Android SDK is installed
if [ -z "$ANDROID_HOME" ]; then
    echo "WARNING: ANDROID_HOME is not set!"
    echo "Please install Android SDK and set ANDROID_HOME"
    echo ""
    echo "On Linux/Mac, add to ~/.bashrc or ~/.zshrc:"
    echo "  export ANDROID_HOME=\$HOME/Android/Sdk"
    echo "  export PATH=\$PATH:\$ANDROID_HOME/emulator"
    echo "  export PATH=\$PATH:\$ANDROID_HOME/platform-tools"
fi

echo "[1/4] Installing dependencies..."
npm install
if [ $? -ne 0 ]; then
    echo "ERROR: Failed to install dependencies"
    exit 1
fi

echo ""
echo "[2/4] Creating Android project..."
npx react-native init IrwFS --directory . --skip-install 2>/dev/null || true

echo ""
echo "[3/4] Building APK..."
cd android
./gradlew assembleRelease
if [ $? -ne 0 ]; then
    echo "ERROR: Build failed"
    exit 1
fi

echo ""
echo "[4/4] Build complete!"
echo ""
echo "APK location:"
echo "  android/app/build/outputs/apk/release/app-release.apk"
echo ""
