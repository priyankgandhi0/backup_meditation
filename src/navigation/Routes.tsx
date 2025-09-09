import {
  Animated,
  AppState,
  Dimensions,
  Platform,
  StyleSheet,
  View,
  TouchableOpacity,
  Image,
  Text,
  AppStateStatus,
} from "react-native";
import React, { useEffect, useRef, useState } from "react";
import {
  NavigationContainer,
  NavigationProp,
  useNavigation,
} from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createDrawerNavigator } from "@react-navigation/drawer";
import { Ionicons } from "@expo/vector-icons";

import { RootStackParamList } from "./NavigationType";
import CourseListHomeScreen from "../screens/coures/CourseListHomeScreen";
import CourseDetailScreen from "../screens/coures/CourseDetailScreen";
import VideoPlayerScreen from "../screens/coures/VideoPlayerScreen";
import ForgotPassword from "../screens/auth/ForgotPasswordScreen";
import RegisterEmailScreen from "../screens/auth/RegisterEmailScreen";
import PrivacyPolicy from "../screens/home/PrivacyPolicy";
import VideoAskScreen from "../screens/coures/VideoAskScreen";
import BookACallScreen from "../screens/coures/BookACallScreen";
import CustomDrawerContent from "../components/CustomDrawerContent";
import { useAppDispatch, useAppSelector } from "../redux/StateType";
import { useAudio } from "../context/AudioContext";
import { playerActions } from "../redux/slice/PlayerSlice";
import SubscriptionTCScreen from "../screens/subscription/SubscriptionT&CScreen";
import SubscriptionAgreementScreen from "../screens/subscription/SubscriptionAgreementScreen";
import { wp } from "../helper/Responsive";
import AboutChakraScreen from "../screens/chakras/AboutChakraScreen";
import { useAudioEffects } from "../context/AudioEffectsContext";
import BottomMusicPlayer from "../components/home/music/BottomMusicPlayer";
import Loader from "../components/Loader";
import { MusicTracksScreen } from "../screens/sleepMusic/MusicTracksBaseScreen";
import LoginScreen from "../screens/auth/LoginScreen";
import BaseHome from "../screens/home/BaseHome";
import BaseChakras from "../screens/chakras/BaseChakras";
import PlayerScreen from "../screens/sleepMusic/PlayerScreen";
import SubscriptionScreen from "../screens/subscription/Subscription";
import AboutUsScreen from "../screens/home/AboutUsScreen";
import MantrasScreen from "../screens/home/MantrasScreen";
import GuidedMeditationScreen from "../screens/home/GuidedMeditationScreen";
import { FontPath } from "../utils/FontPath";
import { colors } from "../utils/colors";
import ProgressTrackingScreen from "../screens/progress/ProgressTrackingScreen";
import ChatbotWindow from "../components/ChatbotWindow";
import BreathRelaxScreen from "../screens/breathwork/BreathRelaxScreen";
import CustomBreathScreen from "../screens/breathwork/CustomBreathScreen";
import RelaxTechniqueInfoScreen from "../screens/breathwork/RelaxTechniqueInfoScreen";
import BreathBellyScreen from "../screens/breathwork/BreathBellyScreen";
import BellyTechniqueInfoScreen from "../screens/breathwork/BellyTechniqueInfoScreen";
import BreathBoxScreen from "../screens/breathwork/BreathBoxScreen"; // Updated path
import BoxTechniqueInfoScreen from "../screens/breathwork/BoxTechniqueInfoScreen"; // Updated path
import AlternateNostrilTechniqueInfoScreen from "../screens/breathwork/AlternateNostrilTechniqueInfoScreen";
import BreathAlternateNostrilScreen from "../screens/breathwork/BreathAlternateNostrilScreen";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRevenueCatTagSync } from "../hooks/useRevenueCatTagSync";
import Purchases from "react-native-purchases";

const Stack = createStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator();
const Drawer = createDrawerNavigator();
const { width } = Dimensions.get("window");
const isTablet = width >= 768;

const Routes = () => {
  const { userData } = useAppSelector((state) => state.auth);

  useEffect(() => {
    async function init() {
      try {
        if (userData?.token) {
          console.log("userData", userData);
          Purchases.setEmail(userData?.user?.email);
          const userAppId = await Purchases.getAppUserID();
          console.log("Purchases->userAppId", userAppId);

          if (userAppId) {
            // Later log in provided user Id
            await Purchases.logIn(userAppId);
          }
        }
      } catch (e) {
        console.log("ERROR", e);
      } finally {
      }
    }
    init();
  }, [userData?.token]);

  return (
    <SafeAreaView edges={["bottom"]} style={{ flex: 1 }}>
      <NavigationContainer>
        <Stack.Navigator
          screenOptions={{
            headerShown: false,
            presentation: "transparentModal",
          }}
          initialRouteName="BaseHome"
        >
          {/* <Stack.Screen name="Splash" component={SplashScreen} /> */}
          <Stack.Screen name="BaseHome" component={DropDownNavigator} />
          <Stack.Screen name="VideoPlayer" component={VideoPlayerScreen} />
          <Stack.Screen name="Player" component={PlayerScreen} />
          <Stack.Screen
            name="BreathRelaxScreen"
            component={BreathRelaxScreen}
          />
          <Stack.Screen
            name="CustomBreathScreen"
            component={CustomBreathScreen}
          />
          <Stack.Screen
            name="RelaxTechniqueInfoScreen"
            component={RelaxTechniqueInfoScreen}
          />
          <Stack.Screen
            name="BreathBellyScreen" // Changed from BellyBreathScreen
            component={BreathBellyScreen}
          />
          {/* Add the new screen to the stack navigator */}
          <Stack.Screen
            name="BellyTechniqueInfoScreen"
            component={BellyTechniqueInfoScreen}
          />
          {/* Added for Breath to Focus */}
          <Stack.Screen name="BreathBoxScreen" component={BreathBoxScreen} />
          <Stack.Screen
            name="BoxTechniqueInfoScreen"
            component={BoxTechniqueInfoScreen}
          />
          {/* Added for Breathe to Balance */}
          <Stack.Screen
            name="BreathAlternateNostrilScreen"
            component={BreathAlternateNostrilScreen}
          />
          <Stack.Screen
            name="AlternateNostrilTechniqueInfoScreen"
            component={AlternateNostrilTechniqueInfoScreen}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaView>
  );
};

export default Routes;

function DropDownNavigator() {
  return (
    <Drawer.Navigator
      drawerContent={(props) => <CustomDrawerContent {...props} />}
      screenOptions={{
        headerTitle: "THE SCHOOL OF BREATH",
        headerTitleStyle: {
          fontFamily: FontPath.Quattrocento,
          fontSize: isTablet ? 24 : 18,
          color: "white",
        },
        headerTitleAlign: "center",
        drawerStyle: {
          width: wp(70),
        },
        drawerActiveBackgroundColor: colors.dark_mauve,
        drawerActiveTintColor: colors.white,
        drawerInactiveTintColor: colors.white,
        drawerLabelStyle: {
          fontSize: isTablet ? 18 : 14,
          fontFamily: FontPath.Quattrocento,
        },
      }}
    >
      <Drawer.Screen
        name="BottomTabNavigator"
        component={BottomTabNavigator}
        options={{
          headerStyle: {
            backgroundColor: colors.primary,
          },
          headerTintColor: colors.white,
        }}
      />
    </Drawer.Navigator>
  );
}

function BottomTabNavigator() {
  const isTab = width >= 768;

  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const { isPlayerContinue, music } = useAppSelector((state) => state.player);
  const { membershipStatus, contactId } = useAppSelector((state) => state.auth);
  const dispatch = useAppDispatch();
  const { stopSound, startEffect } = useAudioEffects();
  const { currentTrack, isPlaying, musicTitle, loading } = useAudio();
  // Floating button animation
  const scale = useRef(new Animated.Value(0)).current;
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isChatbotVisible, setIsChatbotVisible] = useState(false);
  const [showChatHint, setShowChatHint] = useState(true);

  // This will NOT cause infinite loops
  const { manualSync } = useRevenueCatTagSync({
    contactId: contactId,
    membershipStatus: membershipStatus,
  });

  useEffect(() => {
    if (currentTrack === null) {
      dispatch(playerActions.setIsPlayerContinue(false));
    }
  }, [currentTrack]);

  useEffect(() => {
    if (musicTitle === "SleepMusic") {
      if (isPlaying === false) {
        stopSound();
      } else {
        startEffect();
      }
    }
  }, [isPlaying]);

  const handleFloatingButtonPress = () => {
    setShowChatHint(false);
    setIsChatbotVisible(true);
  };

  return (
    <>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          headerShown: false,
          tabBarIcon: ({ focused, color, size }) => {
            let iconName: any;

            if (route.name === "Home") {
              iconName = focused ? "home" : "home-outline";
            } else if (route.name === "Courses") {
              iconName = focused ? "book" : "book-outline";
            } else if (route.name === "SleepMusic") {
              iconName = focused ? "musical-notes" : "musical-notes-outline";
            } else if (route.name === "Chakras") {
              iconName = focused ? "musical-note" : "musical-note-outline";
            } else if (route.name === "MyProgress") {
              iconName = focused ? "stats-chart" : "stats-chart-outline";
            }

            const iconSize = isTab ? size + 6 : size;
            return <Ionicons name={iconName} size={iconSize} color={color} />;
          },
          tabBarActiveTintColor: colors.primary,
          tabBarInactiveTintColor: colors.gray_3,
          tabBarStyle: {
            height: Platform.OS === "android" ? 65 : 80,
            paddingBottom: Platform.OS === "android" ? 24 : 28,
            paddingTop: Platform.OS === "android" ? 5 : 10,
          },
        })}
      >
        <Tab.Screen
          name="Home"
          component={Home}
          options={{
            tabBarLabelStyle: {
              fontFamily: FontPath.Quattrocento,
              fontSize: isTab ? 18 : 14,
            },
          }}
        />
        <Tab.Screen
          name="Courses"
          component={Course}
          options={{
            tabBarLabelStyle: {
              fontFamily: FontPath.Quattrocento,
              fontSize: isTab ? 18 : 14,
            },
            tabBarItemStyle: {
              marginLeft: -wp(1),
            },
          }}
        />
        <Tab.Screen
          name="SleepMusic"
          component={SleepMusic}
          options={{
            tabBarLabelStyle: {
              fontFamily: FontPath.Quattrocento,
              fontSize: isTab ? 18 : 14,
            },
            tabBarItemStyle: {
              marginLeft: wp(9),
            },
          }}
        />
        <Tab.Screen
          name="MyProgress"
          component={ProgressTrackingScreen}
          options={{
            tabBarLabel: "Progress",
            tabBarLabelStyle: {
              fontFamily: FontPath.Quattrocento,
              fontSize: isTab ? 18 : 14,
            },
          }}
        />
      </Tab.Navigator>

      {/* Floating image button container */}
      {
        false && (
          // !isPlayerContinue && (
          <View style={styles.ButtonContainer}>
            {showChatHint && (
              <View style={styles.hintContainer}>
                <Text style={styles.chatHintText}>Tap here to chat!</Text>
                <View style={styles.hintArrow} />
              </View>
            )}
            <TouchableOpacity
              style={styles.mainFloatingButton}
              onPress={handleFloatingButtonPress}
              activeOpacity={0.8}
            >
              <Image
                source={require("../assets/appmainimage.png")}
                style={styles.mainFloatingImage}
                resizeMode="contain"
              />
            </TouchableOpacity>
          </View>
        )
        // )
      }

      {isPlayerContinue && currentTrack?.title && (
        <BottomMusicPlayer
          onPress={() => {
            navigation.navigate("Player", {
              isBack: music?.isBack,
              isFrequency: music?.isFrequency, // Corrected from music?.frequency
              root: music?.root,
              screen: music?.screen,
            });
          }}
        />
      )}

      {/* CHATBOT WINDOW */}
      <ChatbotWindow
        visible={isChatbotVisible}
        onClose={() => setIsChatbotVisible(false)}
      />

      {loading && <Loader />}
    </>
  );
}

const styles = StyleSheet.create({
  floatingButtonContainer: {
    position: "absolute",
    bottom: 32,
    alignSelf: "center",
    alignItems: "center",
    zIndex: 99,
  },
  mainFloatingButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    elevation: 6,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
  },
  mainFloatingImage: {
    width: 70,
    height: 70,
    borderRadius: 35,
  },
  hintContainer: {
    position: "absolute",
    bottom: 80,
    alignItems: "center",
  },
  chatHintText: {
    backgroundColor: "rgba(0,0,0,0.5)",
    color: "white",
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 6,
    fontSize: 13,
    fontFamily: FontPath.Quattrocento,
    overflow: "hidden",
  },
  hintArrow: {
    width: 0,
    height: 0,
    backgroundColor: "transparent",
    borderStyle: "solid",
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderTopWidth: 6,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
    borderTopColor: "rgba(0,0,0,0.5)",
    marginTop: -1,
  },
});

const Home = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="BaseHome" component={BaseHome} />
    <Stack.Screen name="Login" component={LoginScreen} />
    <Stack.Screen name="RegisterEmailScreen" component={RegisterEmailScreen} />
    <Stack.Screen name="ForgotPassword" component={ForgotPassword} />
    <Stack.Screen
      name="CourseListHomeScreen"
      component={CourseListHomeScreen}
    />
    <Stack.Screen name="BookACallScreen" component={BookACallScreen} />
    <Stack.Screen name="VideoAskScreen" component={VideoAskScreen} />
    <Stack.Screen name="CourseDetail" component={CourseDetailScreen} />
    <Stack.Screen name="PrivacyPolicy" component={PrivacyPolicy} />
    <Stack.Screen name="Subscription" component={SubscriptionScreen} />
    <Stack.Screen
      name="SubscriptionTCScreen"
      component={SubscriptionTCScreen}
    />
    <Stack.Screen
      name="SubscriptionAgreementScreen"
      component={SubscriptionAgreementScreen}
    />
    <Stack.Screen name="AboutUsScreen" component={AboutUsScreen} />
    <Stack.Screen name="AboutChakraScreen" component={AboutChakraScreen} />
    <Stack.Screen name="MantrasScreen" component={MantrasScreen} />
    <Stack.Screen
      name="GuidedMeditationScreen"
      component={GuidedMeditationScreen}
    />
    <Stack.Screen name="ChakrasTrack" component={BaseChakras} />
  </Stack.Navigator>
);

const Course = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen
      name="CourseListHomeScreen"
      component={CourseListHomeScreen}
    />
    <Stack.Screen name="CourseDetail" component={CourseDetailScreen} />
  </Stack.Navigator>
);

const SleepMusic = () => (
  <Stack.Navigator
    screenOptions={{ headerShown: false }}
    initialRouteName="MusicTrack"
  >
    <Stack.Screen name="MusicTrack" component={MusicTracksScreen} />
  </Stack.Navigator>
);
