export default {
  expo: {
    name: "Sakthi Spark",
    slug: "sakthiapp",
    version: "1.0.0",
    owner: "sakthiauto",
    icon: "./assets/icon.png",
    splash: {
      image: "./assets/splash-icon.png",
      resizeMode: "contain",
      backgroundColor: "#ffffff"
    },
    android: {
      package: "com.enpa.sakthiapp",
      usesCleartextTraffic: true,
      adaptiveIcon: {
        foregroundImage: "./assets/adaptive-icon.png",
        backgroundColor: "#ffffff"
      },
      permissions: [
        "android.permission.INTERNET",
        "android.permission.ACCESS_NETWORK_STATE"
      ]
    },
    plugins: [
      "expo-splash-screen",
      [
        "expo-build-properties",
        {
          android: {
            usesCleartextTraffic: true,
            networkSecurityConfig: {
              domainConfig: [
                {
                  domain: "118.91.235.74",
                  cleartextTrafficPermitted: true
                }
              ]
            }
          }
        }
      ]
    ],
    extra: {
      eas: {
        projectId: "4e797bad-8f7d-4856-9215-4e29d74688a1"
      }
    }
  }
}; 