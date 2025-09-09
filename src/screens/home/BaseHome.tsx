import React, { useEffect, useState } from "react";
import BreathworkToolsSection from "@/src/components/home/BreathworkToolsSection";
import {
  ScrollView,
  RefreshControl,
  Linking,
  TouchableOpacity,
  StyleSheet,
  View,
  Text,
  Image,
} from "react-native";
import { useQueryClient } from "@tanstack/react-query";
import { useIsFocused, useRoute } from "@react-navigation/native";
import Animated, { FadeIn } from "react-native-reanimated";
import VersionCheck from "react-native-version-check-expo";
import { FocusAwareStatusBar } from "@/src/components/FocusAwareStatusBar";
import { ImagePath } from "@/src/utils/ImagePath";
import { hp, isiPAD, wp } from "@/src/helper/Responsive";
import CourseListHome from "@/src/components/home/courses/CourseHome";
import GuidedMeditationView from "@/src/components/home/guidedMeditation/GuidedMeditationView";
import ChakrasListHome from "@/src/components/home/chakras/Chakras";
import Mantras from "@/src/components/home/mantras/Mantras";
import AppUpdateModal from "@/src/components/modals/AppUpdateModal";
import MusicHome from "@/src/components/home/music/MusicHome";
import { colors } from "@/src/utils/colors";
import { THOUGHTS } from "@/src/utils/JsonData";
import { FontPath } from "@/src/utils/FontPath";
import { useAppDispatch, useAppSelector } from "@/src/redux/StateType";
import BubbleDisplay from "@/src/components/home/BubbleDisplay";
import { useAudio } from "@/src/context/AudioContext";
import { bubbleActions } from "@/src/redux/slice/BubbleSlice";
import { trackScreenView } from "@/src/utils/analytics";

export const BaseHome = () => {
  const { userData, membershipStatus } = useAppSelector((state) => state.auth);
  const { isFirstTimeShowBubble } = useAppSelector((state) => state.bubble);
  const queryClient = useQueryClient();
  const isFocused = useIsFocused();

  const [isUpdateModal, setIsUpdateModal] = useState(false);
  const [storeUrl, setStoreUrl] = useState("");
  const [randomSutraIndex, setRandomSutraIndex] = useState<any>(null);
  const [isEnglish, setIsEnglish] = useState(true);
  const [showGreeting, setShowGreeting] = useState(true);
  const dispatch = useAppDispatch();
  const [showBubble, setShowBubble] = useState(false);

  // Video advertisement states
  // const videoRef = useRef<Video>(null);
  // const [videoAdViewCount, setVideoAdViewCount] = useState(0);
  // const [videoAdInstantVisibility, setVideoAdInstantVisibility] = useState(false);
  // const videoAdShownAlreadyInSessionRef = useRef(false);
  // const [isFullScreenVideo, setIsFullScreenVideo] = useState(false);

  // Get state from AudioContext
  const { isPlaying: isMusicPlaying } = useAudio();

  const isPremium =
    userData?.token && membershipStatus === "Premium Membership";

  // useEffect(() => {
  //   const loadAndSetAdState = async () => {
  //     // ... video ad logic ...
  //   };
  //   loadAndSetAdState();
  // }, [membershipStatus]);

  // useEffect(() => {
  //   if (!isFocused) {
  //     if (videoRef.current) {
  //       videoRef.current?.pauseAsync();
  //     }
  //   } else {
  //     if (videoAdInstantVisibility && videoRef.current) {
  //       videoRef.current?.playAsync();
  //     }
  //   }
  // }, [isFocused, videoAdInstantVisibility]);

  // useEffect(() => {
  //   const subscription = AppState.addEventListener("change", (nextAppState) => {
  //     if (nextAppState.match(/inactive|background/)) {
  //       if (videoRef.current) {
  //         videoRef.current?.pauseAsync();
  //       }
  //     } else if (nextAppState === "active") {
  //       if (
  //         isFocused &&
  //         videoAdInstantVisibility &&
  //         !isFullScreenVideo &&
  //         !isMusicPlaying &&
  //         videoRef.current
  //       ) {
  //         videoRef.current?.playAsync();
  //       }
  //     }
  //   });
  //   return () => subscription.remove();
  // }, [videoAdInstantVisibility, isFocused, isFullScreenVideo, isMusicPlaying]);

  // useEffect(() => {
  //   if (
  //     isMusicPlaying &&
  //     videoAdInstantVisibility &&
  //     !isFullScreenVideo &&
  //     videoRef.current
  //   ) {
  //     videoRef.current.pauseAsync();
  //   }
  // }, [isMusicPlaying, videoAdInstantVisibility, isFullScreenVideo]);

  useEffect(() => {
    trackScreenView("BaseHome", "HomeScreen");
    if (isFocused) {
      handleIsUpdate();
      setTimeout(() => {
        setShowBubble(isFirstTimeShowBubble);
      }, 300);
    }
  }, [isFocused]);

  const handleBubblePress = () => {
    const halfLength = THOUGHTS.length / 2;
    const randomEvenIndex = 2 * Math.floor(Math.random() * halfLength);
    setRandomSutraIndex(randomEvenIndex);
    setIsEnglish(true);
    dispatch(bubbleActions.setFirstTimeShowBubble(false));
    setShowBubble(false);
    setShowGreeting(false);
  };

  const refetchHome = () => {
    queryClient.refetchQueries({ queryKey: ["chakras-home", false] });
    queryClient.refetchQueries({ queryKey: ["courses-home", false] });
    queryClient.refetchQueries({ queryKey: ["musics"] });
  };

  const handleIsUpdate = async () => {
    const updatedNeeded = await VersionCheck.needUpdate({
      currentVersion: VersionCheck.getCurrentVersion(),
    });
    if (updatedNeeded && updatedNeeded.isNeeded) {
      setIsUpdateModal(true);
      setStoreUrl(updatedNeeded.storeUrl);
    }
  };

  // Greeting based on current hour + user's first name
  const getGreeting = () => {
    const hour = new Date().getHours();
    const firstName = userData.user?.fullName
      ? userData.user?.fullName.split(" ")[0]
      : "";
    let greeting = firstName ? `Hi ${firstName}! ` : "Hi! ";
    if (hour < 12) greeting += "Good Morning";
    else if (hour < 17) greeting += "Good Afternoon";
    else greeting += "Good Evening";
    return greeting;
  };

  return (
    <View style={{ flex: 1 }}>
      <ScrollView
        style={styles.background}
        removeClippedSubviews={true}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={false} onRefresh={refetchHome} />
        }
        scrollEnabled={true}
      >
        <FocusAwareStatusBar
          barStyle="light-content"
          translucent
          backgroundColor="transparent"
        />
        <View style={styles.container}>
          {/* Banner */}
          <Image source={ImagePath.homeScreen} style={styles.bannerImage} />

          {/* Greeting / Thought Sutra */}
          <View style={styles.greetingContainer}>
            {showGreeting ? (
              <Animated.View entering={FadeIn.duration(800)}>
                <Text style={styles.greetingText}>{getGreeting()}</Text>
              </Animated.View>
            ) : (
              randomSutraIndex !== null && (
                <View>
                  <TouchableOpacity onPress={() => setIsEnglish(!isEnglish)}>
                    <Text style={styles.thoughtBurstText}>
                      {isEnglish
                        ? THOUGHTS[randomSutraIndex]
                        : THOUGHTS[randomSutraIndex + 1]}
                    </Text>
                    <Text style={styles.hintText}>
                      Tap to view{" "}
                      {isEnglish
                        ? "Challenge of the Day"
                        : "Insight of the Day"}{" "}
                    </Text>
                  </TouchableOpacity>
                </View>
              )
            )}
          </View>

          {/* Breathwork Tools Section */}
          <BreathworkToolsSection />

          {/* Main Content: Courses, Music, Guided Meditation, Chakras, Mantras */}
          <View style={{ width: wp(100) }}>
            <CourseListHome />
            <MusicHome />
            <GuidedMeditationView />
            <ChakrasListHome />
            <Mantras />
          </View>
        </View>

        <AppUpdateModal
          isVisible={isUpdateModal}
          onPress={() => Linking.openURL(storeUrl)}
        />

        {/* The actual Bubble (Hint logic moved inside BubbleDisplay) */}
        {showBubble && (
          <BubbleDisplay
            showHint={showBubble}
            handleBubblePress={handleBubblePress}
          />
        )}
      </ScrollView>

      {/* Normal Video Ad - Wrapped */}
      {/* {!isPremium &&
        videoAdInstantVisibility &&
        !isFullScreenVideo &&
        ((() => {
          return null;
        })() || (
          <View style={styles.videoWrapper}>
            <BlurView style={styles.blurOverlay} tint="light" intensity={20} />
            <View style={styles.videoAdContainer}>
              <Video
                ref={videoRef}
                source={{
                  uri: "https://storage.googleapis.com/schoolbreathvideos/Holistic%20Awakening%20Adv/HolAwakeVerticle.mp4",
                }}
                rate={1.0}
                volume={1.0}
                isMuted={false}
                resizeMode={ResizeMode.COVER}
                shouldPlay
                style={styles.videoAd}
              />
              <TouchableOpacity
                style={styles.fullScreenButton}
                onPress={() => setIsFullScreenVideo(true)}
              >
                <Text style={styles.fullScreenButtonText}>❏</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.closeButtonAd}
                onPress={() => setVideoAdInstantVisibility(false)}
              >
              </TouchableOpacity>
            </View>
          </View>
        ))} */}

      {/* Full-Screen Video Mode */}
      {/* {isFullScreenVideo && (
        <View style={styles.fullScreenContainer}>
          <Video
            ref={videoRef}
            source={{
              uri: "https://storage.googleapis.com/schoolbreathvideos/Holistic%20Awakening%20Adv/HolAwakeVerticle.mp4",
            }}
            rate={1.0}
            volume={1.0}
            isMuted={false}
            resizeMode={ResizeMode.CONTAIN}
            shouldPlay
            style={styles.fullScreenVideo}
            useNativeControls={true}
          />
          <TouchableOpacity
            style={styles.fullScreenCloseButton}
            onPress={() => setIsFullScreenVideo(false)}
          >
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>
        </View>
      )} */}
    </View>
  );
};

const styles = StyleSheet.create({
  background: {
    flex: 1,
  },
  container: {
    alignItems: "center",
    backgroundColor: "white",
  },
  bannerImage: {
    width: wp(100),
    height: hp(isiPAD ? 50 : 42),
  },
  greetingContainer: {
    marginTop: hp(0.5),
    marginBottom: hp(2),
    alignItems: "center",
  },
  greetingText: {
    fontFamily: FontPath.QuattrocentoRegular,
    fontSize: isiPAD ? 26 : 20,
    color: colors.black,
    textAlign: "center",
    marginTop: hp(3),
    marginBottom: hp(0.8),
  },
  thoughtBurstText: {
    color: colors.black,
    fontSize: isiPAD ? 26 : 20,
    textAlign: "center",
    fontFamily: FontPath.QuattrocentoRegular,
    marginBottom: hp(0.8),
    marginTop: hp(2.5),
    marginHorizontal: wp(5),
    lineHeight: isiPAD ? 33 : 27,
  },
  hintText: {
    fontSize: isiPAD ? 18 : 15,
    color: "#888",
    textAlign: "center",
    marginTop: hp(0.5),
    marginBottom: hp(0.5),
    fontFamily: FontPath.QuattrocentoRegular,
    textDecorationLine: "underline",
  },
  blurOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  videoAdContainer: {
    position: "absolute",
    bottom: hp(1),
    right: wp(3),
    width: wp(35),
    height: hp(25),
    backgroundColor: "#000",
    borderColor: "color.primary",
    borderWidth: 1,
    borderRadius: 10,
    overflow: "hidden",
  },
  videoAd: {
    width: "100%",
    height: "100%",
  },
  closeButtonAd: {
    position: "absolute",
    width: wp(isiPAD ? 6 : 7),
    height: hp(isiPAD ? 3 : 3.5),
    top: hp(1),
    right: wp(1.5),
    backgroundColor: "rgba(255, 255, 255, 0.8)",
    borderRadius: wp(4),
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
  },
  closeButtonText: {
    color: "black",
    fontSize: wp(isiPAD ? 3 : 4),
    fontWeight: "bold",
    textAlign: "center",
  },
  videoWrapper: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 998,
  },
  fullScreenButton: {
    position: "absolute",
    bottom: hp(1),
    right: wp(1.5),
    backgroundColor: "rgba(255, 255, 255, 0.8)",
    paddingHorizontal: wp(2),
    paddingVertical: hp(0.5),
    borderRadius: wp(3),
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
  },
  fullScreenButtonText: {
    color: "black",
    fontSize: wp(isiPAD ? 3 : 4),
    fontWeight: "bold",
  },
  fullScreenContainer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "black",
    zIndex: 1001,
  },
  fullScreenVideo: {
    flex: 1,
    width: "100%",
  },
  fullScreenCloseButton: {
    position: "absolute",
    top: hp(5),
    right: wp(3),
    backgroundColor: "rgba(255, 255, 255, 0.7)",
    borderRadius: wp(5),
    padding: wp(2),
    zIndex: 1002,
  },
});

export default BaseHome;
