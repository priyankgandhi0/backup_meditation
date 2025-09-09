const { withAndroidManifest } = require("@expo/config-plugins");

module.exports = function withCustomAndroidManifest(config) {
  return withAndroidManifest(config, async (config) => {
    const androidManifest = config.modResults;

    // Add permissions
    if (!androidManifest.manifest["uses-permission"]) {
      androidManifest.manifest["uses-permission"] = [];
    }

    const permissions = [
      "android.permission.FOREGROUND_SERVICE",
      "android.permission.FOREGROUND_SERVICE_MEDIA_PLAYBACK",
      "android.permission.WAKE_LOCK",
      "android.permission.RECORD_AUDIO",
      "android.permission.POST_NOTIFICATIONS",
    ];

    permissions.forEach((permission) => {
      const exists = androidManifest.manifest["uses-permission"].find(
        (item) => item.$["android:name"] === permission
      );

      if (!exists) {
        androidManifest.manifest["uses-permission"].push({
          $: { "android:name": permission },
        });
      }
    });

    // Add service to application
    if (!androidManifest.manifest.application[0].service) {
      androidManifest.manifest.application[0].service = [];
    }

    // Check if service already exists
    const serviceExists = androidManifest.manifest.application[0].service.find(
      (service) =>
        service.$["android:name"] ===
        "com.doublesymmetry.trackplayer.service.MusicService"
    );

    if (!serviceExists) {
      androidManifest.manifest.application[0].service.push({
        $: {
          "android:name": "com.doublesymmetry.trackplayer.service.MusicService",
          "android:enabled": "true",
          "android:exported": "true",
          "android:foregroundServiceType": "mediaPlayback",
          "android:stopWithTask": "true",
        },
      });
    }

    // Add application attributes for better background handling
    if (!androidManifest.manifest.application[0].$) {
      androidManifest.manifest.application[0].$ = {};
    }

    // Ensure proper background handling and prevent foreground service crashes
    androidManifest.manifest.application[0].$["android:allowBackup"] = "true";
    androidManifest.manifest.application[0].$["android:largeHeap"] = "true";
    androidManifest.manifest.application[0].$["android:hardwareAccelerated"] =
      "true";

    return config;
  });
};
