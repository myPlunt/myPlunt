const isStaging = process.env.APP_VARIANT === "staging";

// A copy of brand.sandDune in tokens.ts, which this file can't import; keep them in sync.
const SAND_DUNE = "#E7DCC5";

export default {
  expo: {
    name: isStaging ? "myPlunt (Staging)" : "myPlunt",
    slug: "myplunt",
    owner: "my-plunt",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/images/icon.png",
    scheme: "frontend",
    userInterfaceStyle: "automatic",
    ios: {
      bundleIdentifier: isStaging ? "com.myplunt.app.staging" : "com.myplunt.app",
      infoPlist: {
        ITSAppUsesNonExemptEncryption: false,
      },
    },
    android: {
      // Same as the iOS bundleIdentifier. Never change it after the first install: Android treats a new one as another app.
      package: isStaging ? "com.myplunt.app.staging" : "com.myplunt.app",
      // Firebase config for push notifications (FCM).
      googleServicesFile: "./google-services.json",
      adaptiveIcon: {
        backgroundColor: SAND_DUNE,
        foregroundImage: "./assets/images/android-icon-foreground.png",
        monochromeImage: "./assets/images/android-icon-monochrome.png",
      },
      predictiveBackGestureEnabled: false,
      // The tour only needs the city, so the app never asks for a precise location.
      blockedPermissions: ["android.permission.ACCESS_FINE_LOCATION"],
    },
    web: {
      output: "static",
      favicon: "./assets/images/favicon.png",
    },
    plugins: [
      "expo-router",
      "expo-secure-store",
      [
        "expo-image-picker",
        {
          photosPermission: "myPlunt uses your photos so you can add pictures of your plants.",
          cameraPermission: "myPlunt uses your camera so you can take pictures of your plants.",
          microphonePermission: false,
        },
      ],
      [
        // Sets the same NSPhotoLibraryUsageDescription as expo-image-picker, so keep the two texts equal.
        "expo-media-library",
        {
          photosPermission: "myPlunt uses your photos so you can add pictures of your plants.",
          savePhotosPermission: false,
          granularPermissions: ["photo"],
        },
      ],
      [
        "expo-location",
        {
          locationWhenInUsePermission: "myPlunt uses your city to warn you about weather that affects your plants.",
        },
      ],
      "expo-notifications",
      [
        "expo-splash-screen",
        {
          backgroundColor: SAND_DUNE,
          image: "./assets/images/Logo.png",
          imageWidth: 76,
        },
      ],
    ],
    experiments: {
      typedRoutes: true,
      reactCompiler: true,
    },
    extra: {
      // APP_VARIANT has no EXPO_PUBLIC_ prefix, so this is how the app reads it at runtime.
      appVariant: process.env.APP_VARIANT ?? null,
      router: {},
      eas: {
        projectId: "9522f12d-5816-4e59-8252-30c84f0000af",
      },
    },
    runtimeVersion: {
      policy: "appVersion",
    },
    updates: {
      url: "https://u.expo.dev/9522f12d-5816-4e59-8252-30c84f0000af",
    },
  },
};
