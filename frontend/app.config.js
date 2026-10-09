const isStaging = process.env.APP_VARIANT === "staging";

// app.config.js can't import src/constants/theme.ts, so these are copies of
// brand values from there. Keep them in sync if the palette changes.
const SAND_DUNE = "#E7DCC5"; // brand.sandDune, Colors.light.background

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
      adaptiveIcon: {
        backgroundColor: SAND_DUNE,
        foregroundImage: "./assets/images/android-icon-foreground.png",
        monochromeImage: "./assets/images/android-icon-monochrome.png",
      },
      predictiveBackGestureEnabled: false,
    },
    web: {
      output: "static",
      favicon: "./assets/images/favicon.png",
    },
    plugins: [
      "expo-router",
      "expo-secure-store",
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
