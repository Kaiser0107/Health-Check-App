# Health Check App — Android APK Build Guide

This guide walks you through turning your **Health Check App** (Expo SDK 54 / React Native 0.81) into an installable **`.apk`** file that can be installed on any physical Android smartphone or tablet without needing Google Play Store approval.

---

## 🧭 Which Method Should You Use?

| Feature | Method 1: EAS Cloud Build ⭐ **(Recommended)** | Method 2: Local Gradle Build |
| :--- | :--- | :--- |
| **Requirements** | Free Expo account (`expo.dev`) | Android Studio, Android SDK, JDK 17 |
| **PC Resources** | Builds in Expo Cloud (zero PC lag) | Consumes 8GB+ RAM & high CPU |
| **Setup Time** | ~3 minutes | ~20–30 minutes |
| **Offline?** | Requires internet connection | Can build completely offline |
| **Output** | Direct APK download link & QR code | Local file in `android/app/build/outputs/apk/` |

---

## ⚡ Method 1: EAS Cloud Build (Recommended & Easiest)

With this method, Expo's cloud servers compile the Android binaries and produce a downloadable `.apk` file for you.

### Step 1: Install EAS CLI
Open PowerShell or Terminal in your project root and install the Expo Application Services (EAS) CLI globally (or run it via `npx`):

```powershell
npm install -g eas-cli
```
*(Or simply prefix commands with `npx eas-cli`)*

---

### Step 2: Log In to Your Expo Account
If you don't have an Expo account, sign up for free at [expo.dev/signup](https://expo.dev/signup).

```powershell
eas login
```
Enter your username/email and password to authenticate.

---

### Step 3: Verify `eas.json` Configuration
An `eas.json` file has already been prepared in your project root with the following configuration:

```json
{
  "cli": {
    "version": ">= 12.0.0"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "distribution": "internal",
      "android": {
        "buildType": "apk"
      }
    },
    "production": {
      "android": {
        "buildType": "app-bundle"
      }
    }
  }
}
```

> **Key Setting:** Under `"preview"`, `"buildType": "apk"` tells EAS to generate an `.apk` file instead of an `.aab` (Google Play store bundle).

---

### Step 4: Configure Project on EAS
Run the project initialization command:

```powershell
eas project:init
```
If prompted to link an existing project or create a new one, select **Create a new EAS project**.

---

### Step 5: (Important) Firebase Environment Variables
Because this app connects to Firebase via `EXPO_PUBLIC_FIREBASE_*` variables, make sure your `.env` is present locally, or push secrets to EAS:

You can upload your `.env` variables directly to EAS so cloud builds have access to Firebase:
```powershell
eas secret:push --scope project --env-file .env
```
*(Note: Variables prefixed with `EXPO_PUBLIC_` are automatically bundled into the client code during the build process).*

---

### Step 6: Start the APK Build
Run the build command specifying the Android platform and the `preview` profile:

```powershell
eas build --platform android --profile preview
```

**During the build prompt:**
1. **Keystore generation:** When asked *"Would you like EAS to generate a new Android Keystore for you?"*, select **Yes** (`Y`).
2. EAS will start building on the cloud. A live web dashboard link will be printed in the terminal.
3. Once completed (usually 5–10 minutes), terminal will output:
   - A **direct download URL** for the `.apk` file.
   - A **QR code** you can scan directly with your Android phone's camera to download and install the app immediately.

---

## 💻 Method 2: Local Gradle Build (No Cloud Queue)

Use this method if you already have **Android Studio** and **Java JDK 17** installed and want to build the APK completely on your computer.

### Prerequisites
1. **JDK 17:** Verify by running `java -version`.
2. **Android SDK:** Set in environment variables:
   - `ANDROID_HOME = C:\Users\<YourUser>\AppData\Local\Android\Sdk`
   - Add `%ANDROID_HOME%\platform-tools` and `%ANDROID_HOME%\cmdline-tools\latest\bin` to your `Path`.

---

### Step 1: Generate Native Android Project Files
Run the prebuild command to generate the native `android/` directory:

```powershell
npx expo prebuild --platform android
```
*(This uses your settings from `app.json` like package name `com.personal.healthcheck` and permissions).*

---

### Step 2: Build the APK using Gradle

#### Option A: Debug APK (Fastest, for quick testing)
```powershell
cd android
.\gradlew.bat assembleDebug
```
- **Output Location:** `android/app/build/outputs/apk/debug/app-debug.apk`

#### Option B: Release APK (Optimized & smaller file size)
```powershell
cd android
.\gradlew.bat assembleRelease
```
- **Output Location:** `android/app/build/outputs/apk/release/app-release.apk` (or `app-release-unsigned.apk`)

---

## 📱 How to Install the APK on Your Android Device

1. **Transfer the APK to your phone:**
   - Scan the EAS QR code directly, or
   - Download the file and transfer it via USB cable, Google Drive, WhatsApp, or Telegram.
2. **Enable Unknown Apps Installation:**
   - Tap on the `.apk` file in your Android file manager or browser.
   - If prompted with *"For your security, your phone is not allowed to install unknown apps from this source"*, tap **Settings** and toggle **Allow from this source**.
3. **Google Play Protect warning:**
   - Because this APK is self-signed and not downloaded through the Play Store, Play Protect may show a warning: *"Blocked by Play Protect"*.
   - Tap **More details** ➔ **Install anyway**.
4. **App Launch & Permissions:**
   - Open **Health Check**.
   - When updating patient profiles with photos, grant camera/storage permissions as prompted.

---

## 🛠️ Common Troubleshooting

| Issue | Solution |
| :--- | :--- |
| **"EAS login failed"** | Run `npx eas-cli login` and ensure your credentials match expo.dev. |
| **Firebase connection error in APK** | Ensure your `.env` contains valid `EXPO_PUBLIC_FIREBASE_*` values and run `eas secret:push --scope project --env-file .env` before building. |
| **"Gradle daemon disappeared unexpectedly"** (Local Build) | Your computer ran out of RAM. Close unnecessary apps or allocate more memory in `android/gradle.properties` (`org.gradle.jvmargs=-Xmx4096m`). |
| **"App not installed" on device** | Uninstall any existing version of the app on your phone before installing a new APK (especially if switching between Debug and Release builds due to keystore differences). |
| **Camera/Gallery crash** | Make sure permissions in `app.json` (`expo-image-picker`) remain intact. |

