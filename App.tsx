import "expo-dev-client";
import React, { useCallback, useEffect, useState } from "react";
import { StyleSheet, Platform, View } from "react-native";
import * as Font from "expo-font";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AudioProvider } from "./src/context/AudioContext";
import { AudioEffectsProvider } from "./src/context/AudioEffectsContext";
import Routes from "./src/navigation/Routes";
import store, { persistor } from "./src/redux/Store";
import { PersistGate } from "redux-persist/integration/react";
import { Provider } from "react-redux";
import Purchases, { LOG_LEVEL, STOREKIT_VERSION } from "react-native-purchases";
import { NetworkProvider } from "./src/context/Network";
import { requestTrackingPermissionsAsync } from "expo-tracking-transparency";
import * as SplashScreen from "expo-splash-screen";
import { SafeAreaProvider } from "react-native-safe-area-context";

const queryClient = new QueryClient();

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

// Set the animation options. This is optional.
SplashScreen.setOptions({
  duration: 500,
  fade: true,
});

export default function App() {
  const [appIsReady, setAppIsReady] = useState(false);
  const [fontsLoaded, setFontsLoaded] = useState(false);

  useEffect(() => {
    async function askForPermission() {
      // Only on iOS as ATT applies only on this platform
      if (Platform.OS === "ios") {
        const { status } = await requestTrackingPermissionsAsync();
        if (status === "granted") {
          // Tracking is authorized; proceed with tracking functionality
          console.log("User granted tracking permission.");
          // Insert any tracking initialization code here
        } else {
          // Tracking is denied or restricted
          console.log("Tracking permission denied.");
        }
      }
    }
    askForPermission();
  }, []);

  useEffect(() => {
    Purchases.setLogLevel(LOG_LEVEL.VERBOSE);
    Purchases.configure({
      apiKey:
        Platform.OS == "android"
          ? "goog_wNTSZMkCWJQRPLPpxjtSoaNegNE"
          : "appl_gsThKQfpGrSRCrkYDPSgDQKTtKv",
      storeKitVersion: STOREKIT_VERSION.DEFAULT,
    });
  }, []);

  useEffect(() => {
    async function prepare() {
      try {
        // Pre-load fonts, make any API calls you need to do here
        await Font.loadAsync({
          "Poppins-light": require("./src/assets/fonts/Poppins/Poppins-Light.ttf"),
          "Poppins-medium": require("./src/assets/fonts/Poppins/Poppins-Medium.ttf"),
          "Open-sans": require("./src/assets/fonts/Open_Sans/OpenSans.ttf"),
          "Quattrocento-Regular": require("./src/assets/fonts/Quattrocento/Quattrocento-Regular.ttf"),
          "Quattrocento-Bold": require("./src/assets/fonts/Quattrocento/Quattrocento-Bold.ttf"),
        });
        // Artificially delay for two seconds to simulate a slow loading
        // experience. Remove this if you copy and paste the code!
        await new Promise((resolve) => setTimeout(resolve, 2000));
      } catch (e) {
        console.warn(e);
      } finally {
        // Tell the application to render
        setFontsLoaded(true);
        setAppIsReady(true);
      }
    }

    prepare();
  }, []);

  const onLayoutRootView = useCallback(() => {
    if (appIsReady) {
      // This tells the splash screen to hide immediately! If we call this after
      // `setAppIsReady`, then we may see a blank screen while the app is
      // loading its initial state and rendering its first pixels. So instead,
      // we hide the splash screen once we know the root view has already
      // performed layout.
      SplashScreen.hide();
    }
  }, [appIsReady]);

  if (!appIsReady) {
    return null;
  }

  return (
    <View style={{ flex: 1 }} onLayout={onLayoutRootView}>
      <NetworkProvider>
        <SafeAreaProvider>
          <Provider store={store}>
            <PersistGate persistor={persistor}>
              <QueryClientProvider client={queryClient}>
                <AudioProvider>
                  <AudioEffectsProvider>
                    <Routes />
                  </AudioEffectsProvider>
                </AudioProvider>
              </QueryClientProvider>
            </PersistGate>
          </Provider>
        </SafeAreaProvider>
      </NetworkProvider>
    </View>
  );
}

// Styles
const styles = StyleSheet.create({
  floatingButtonContainer: {
    position: "absolute",
    bottom: 40,
    alignSelf: "center",
    alignItems: "center",
  },
  floatingButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#72616d",
    justifyContent: "center",
    alignItems: "center",
    elevation: 8,
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowOffset: { width: 2, height: 2 },
    shadowRadius: 2,
  },
  buttonImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  floatingOption: {
    position: "absolute",
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#72616d",
    justifyContent: "center",
    alignItems: "center",
  },
});
