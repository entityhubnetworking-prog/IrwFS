# IrwFS Mobile App

React Native mobile application for IrwFS Face Swap.

## Setup

```bash
npm install
```

### Android

1. Ensure you have Android SDK installed
2. Run the app:
```bash
npm run android
```

### Build APK

```bash
cd android
./gradlew assembleRelease
```

The APK will be in `android/app/build/outputs/apk/release/`

## Features

- User authentication (login/register)
- Image face swap with camera/gallery
- Video face swap
- History management
- Settings and account info

## Permissions Required

- Camera (for taking photos)
- Storage (for saving results)
- Internet (for API communication)
