# Building AricaMeet Android APK

AricaMeet is a zero-trace, peer-to-peer video conferencing app. This guide explains how to create an Android APK for internal distribution.

## Prerequisites

1. **Node.js v16+** installed
2. **Java JDK 8 or 11** installed
3. **Android SDK** (or Android Studio)

## Step 1: Deploy AricaMeet

First, publish your AricaMeet app to get a public HTTPS URL.

On Replit: Click "Publish" to get your `*.replit.app` URL.

## Step 2: Update Configuration

Edit `twa-manifest.json` and replace all instances of `YOUR_DEPLOYED_URL_HERE` with your actual deployed URL.

Example:
```json
"host": "aricameet.replit.app",
"iconUrl": "https://aricameet.replit.app/icon-512.png",
```

## Step 3: Install Bubblewrap

```bash
npm install -g @bubblewrap/cli
```

## Step 4: Initialize Project

```bash
mkdir aricameet-android
cd aricameet-android
bubblewrap init --manifest=https://YOUR_URL/manifest.json
```

Follow the prompts:
- Package ID: `com.aricameet.app`
- App name: `AricaMeet`
- Accept defaults for most options

## Step 5: Build APK

```bash
bubblewrap build
```

This generates:
- `app-release-signed.apk` - Ready to install
- `app-release-bundle.aab` - For Google Play (if needed)

## Step 6: Distribute Internally

### Option A: Direct APK Install (Enterprise)
1. Email the APK to team members
2. They enable "Install from Unknown Sources"
3. Install directly on Android devices

### Option B: Enterprise MDM
Upload to your Mobile Device Management system (Intune, Jamf, etc.)

### Option C: Private App Store
Use Firebase App Distribution or similar for internal app distribution.

## Quick Alternative: Online Converters

If you don't want to set up build tools:

1. **PWA2APK** (https://pwa2apk.com)
   - Enter your deployed URL
   - Download signed APK instantly
   - Free (with Appmaker branding) or paid for custom package

2. **Web2ApkPro** (https://web2apkpro.com)
   - Professional APK generation
   - Preserves service worker caching

## Security Notes

- The APK wraps your PWA in a Trusted Web Activity (TWA)
- All encryption and P2P features remain intact
- No data is stored on device beyond the browser session
- When the app closes, all traces are gone

## Verification

After installation, test:
1. App opens to AricaMeet dashboard
2. Can create/join meetings
3. Video/audio works
4. Chat messages work
5. Closing app leaves no trace

---

**Zero-Trace Guarantee:** The APK is just a wrapper around your web app. All the zero-persistence architecture remains - nothing is saved, logged, or stored.
