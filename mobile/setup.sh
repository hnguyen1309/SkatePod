#!/bin/sh
# One-time setup. Installs the newest Expo SDK, then lets Expo pick the
# exact package versions that match it (so the app opens in Expo Go).
set -e

echo "Installing Expo..."
npm install expo@latest

echo "Installing app packages at versions that match this Expo SDK..."
npx expo install react react-native expo-status-bar react-native-safe-area-context react-native-svg @react-native-async-storage/async-storage

echo "Installing TypeScript tools..."
npx expo install typescript @types/react -- --save-dev

echo ""
echo "Done! Start the app with:  npx expo start"
