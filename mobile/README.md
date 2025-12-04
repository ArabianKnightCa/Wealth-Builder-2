# Wealth Builder Mobile App

React Native mobile application for the Wealth Builder financial education platform with Adaptive Engine personalization.

## Features

- ✅ User Registration & Login
- ✅ Multi-Profile Management (Family Accounts)
- ✅ PPI (Personality Profile Index) Assessment
- ✅ Personalized Dashboard
- ✅ Dynamic Lesson Content (powered by Adaptive Engine)
- ✅ Interactive Quizzes
- ✅ Feedback System
- ✅ Profile Switching
- ✅ Progress Tracking

## Tech Stack

- **React Native 0.73**
- **React Navigation 6** (Stack & Bottom Tabs)
- **AsyncStorage** (Local Data Persistence)
- **Axios** (API Communication)
- **React Native Vector Icons**

## Prerequisites

- Node.js >= 18
- npm or yarn
- For iOS: Xcode (macOS only)
- For Android: Android Studio with Android SDK

## Installation

```bash
cd /app/mobile
yarn install
```

## Configuration

Update the backend URL in `.env`:

```bash
BACKEND_URL=http://localhost:8001
API_URL=http://localhost:8001/api
```

**For Android Emulator:** Use `http://10.0.2.2:8001` instead of `localhost`
**For iOS Simulator:** Use `http://localhost:8001`
**For Physical Device:** Use your computer's IP address (e.g., `http://192.168.1.100:8001`)

## Running the App

### iOS (macOS only)

```bash
# Install CocoaPods dependencies
cd ios && pod install && cd ..

# Run on iOS simulator
yarn ios

# Or specify a device
yarn ios --simulator="iPhone 15"
```

### Android

```bash
# Start Metro bundler
yarn start

# In another terminal, run Android
yarn android

# Or for specific device
adb devices  # List devices
yarn android --deviceId=<device-id>
```

### Development Mode

```bash
# Start Metro bundler separately
yarn start

# Then run the app
yarn ios    # or
yarn android
```

## Project Structure

```
/app/mobile/
├── src/
│   ├── screens/          # All screen components
│   │   ├── LoginScreen.js
│   │   ├── RegisterScreen.js
│   │   ├── ProfileSelectorScreen.js
│   │   ├── AddProfileScreen.js
│   │   ├── PPIScreen.js
│   │   ├── DashboardScreen.js
│   │   ├── ChapterScreen.js
│   │   ├── LessonScreen.js
│   │   ├── QuizScreen.js
│   │   ├── ProfileManagementScreen.js
│   │   └── FeedbackScreen.js
│   ├── navigation/       # Navigation setup
│   │   └── AppNavigator.js
│   ├── services/         # API & Storage services
│   │   ├── api.js
│   │   └── storage.js
│   └── App.js           # Root component
├── index.js             # Entry point
├── package.json
└── README.md
```

## API Integration

The mobile app connects to the same FastAPI backend as the web app:

- **Base URL:** `http://localhost:8001/api`
- **Authentication:** JWT Bearer Token
- **Storage:** AsyncStorage for token persistence

### Key API Endpoints Used

- `POST /api/register` - User registration
- `POST /api/login` - User login
- `GET /api/profiles` - Get user profiles
- `POST /api/profiles` - Create profile
- `POST /api/profiles/{id}/activate` - Set active profile
- `GET /api/ppi-questions` - Get PPI questions
- `POST /api/ppi-submit` - Submit PPI answers
- `GET /api/chapters` - Get all chapters
- `GET /api/chapters/{id}` - Get chapter details
- `GET /api/chapters/{id}/lessons/{lessonId}` - Get lesson content
- `GET /api/chapters/{id}/quiz` - Get chapter quiz
- `POST /api/quiz-submit` - Submit quiz answers
- `POST /api/feedback` - Submit user feedback
- `POST /api/telemetry/lesson-engagement` - Track lesson engagement

## Features Overview

### Authentication Flow
1. **Login/Register** → 2. **Profile Selector** → 3. **PPI Assessment** (if needed) → 4. **Dashboard**

### Multi-Profile System
- Create multiple profiles per account (for families)
- Switch between profiles
- Each profile has separate PPI and progress
- Delete profiles when needed

### Adaptive Engine Integration
- Lessons are personalized based on:
  - Age (from profile)
  - Financial Experience Level
  - PPI Results (Personality DNA)
  - Financial Goals
- Content dynamically transformed by backend

### Navigation Structure
- **Stack Navigator** for main screens
- **Bottom Tab Navigator** for main app sections:
  - Dashboard
  - Profiles
  - Feedback

## Development Tips

### Debugging

```bash
# Enable debug mode
# iOS: Cmd+D in simulator
# Android: Cmd+M (Mac) or Ctrl+M (Windows/Linux)

# View logs
yarn start --reset-cache

# For detailed logs
npx react-native log-ios    # iOS logs
npx react-native log-android # Android logs
```

### Common Issues

**Metro Bundler Port Conflict:**
```bash
# Kill process on port 8081
lsof -ti:8081 | xargs kill -9
```

**Android Build Fails:**
```bash
cd android && ./gradlew clean && cd ..
yarn android
```

**iOS Build Fails:**
```bash
cd ios && pod deintegrate && pod install && cd ..
yarn ios
```

**Cannot Connect to Backend:**
- Check backend is running on port 8001
- Update API_URL in .env to match your network
- For Android emulator, use `10.0.2.2` instead of `localhost`
- For physical device, use computer's IP address

## Testing

The app connects to the same backend as the web version, so you can:
1. Create an account on either platform
2. The data syncs (same database)
3. Test cross-platform consistency

## Building for Production

### iOS

```bash
# 1. Open Xcode
open ios/WealthBuilderMobile.xcworkspace

# 2. Set bundle identifier and signing
# 3. Archive and upload to App Store
```

### Android

```bash
# 1. Generate release keystore
keytool -genkeypair -v -storetype PKCS12 -keystore my-release-key.keystore -alias my-key-alias -keyalg RSA -keysize 2048 -validity 10000

# 2. Build release APK
cd android
./gradlew assembleRelease

# Output: android/app/build/outputs/apk/release/app-release.apk
```

## Next Steps

- [ ] Add offline support
- [ ] Implement push notifications
- [ ] Add biometric authentication
- [ ] Optimize performance
- [ ] Add unit tests
- [ ] Add E2E tests
- [ ] Implement analytics tracking
- [ ] Add error boundary
- [ ] Improve accessibility

## Notes

- This is a POC (Proof of Concept) version
- The web app remains the primary platform for now
- Mobile app uses the same backend APIs (no backend changes needed)
- All features from the web app are available on mobile
- Ready for testing on simulators/emulators and physical devices
