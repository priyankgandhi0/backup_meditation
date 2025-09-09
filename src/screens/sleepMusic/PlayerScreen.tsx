import React, { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  ImageBackground,
  Pressable,
  StyleSheet,
  Animated,
  Dimensions,
  Platform,
} from "react-native";
import { Ionicons, MaterialCommunityIcons, Feather } from "@expo/vector-icons";
import {
  RouteProp,
  useIsFocused,
  useNavigation,
  useRoute,
} from "@react-navigation/native";
import { useAudio } from "../../context/AudioContext";
import { useAudioEffects } from "../../context/AudioEffectsContext";
import { EffectsModal } from "../../components/modals/EffectsModal";
import { FrequenciesModal } from "../../components/modals/FrequencyModal";
import {
  DARK_COLOR,
  playerStyles as styles,
} from "../../styles/playerScreen.styles";
import { useAppDispatch } from "../../redux/StateType";
import { playerActions } from "../../redux/slice/PlayerSlice";
import { ImagePath } from "../../utils/ImagePath";
import { hp, isTablet, RFValue, wp } from "../../helper/Responsive";
import { FocusAwareStatusBar } from "../../components/FocusAwareStatusBar";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import Loader from "../../components/Loader";
import { Slider } from "@miblanchard/react-native-slider";
import { RootStackParamList } from "@/src/navigation/NavigationType";
import { colors } from "@/src/utils/colors";
import { FontPath } from "@/src/utils/FontPath";
import TrackPlayer, { RepeatMode, useProgress } from "react-native-track-player";
import { trackScreenView } from "@/src/utils/analytics";

const { width: screenWidth } = Dimensions.get('window');

const PlayerScreen = () => {
  const routes = useRoute<RouteProp<RootStackParamList, "PlayerScreen">>();
  const isFocused = useIsFocused();
  const dispatch = useAppDispatch();
  const navigation = useNavigation();
  const { top } = useSafeAreaInsets();

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;

  const { width: screenWidth, height: screenHeight } = Dimensions.get("window");
// Use the smaller dimension to size album art and other elements
const screenMinDim = Math.min(screenWidth, screenHeight);
// Treat any device with ≥768px width or height as a “tablet”
const isTablet =
  Platform.OS === "ios"
    ? screenWidth >= 768 || screenHeight >= 768
    : screenWidth >= 800 || screenHeight >= 800;

  const {
    currentTrack,
    isPlaying,
    playPause,
    nextTrack,
    previousTrack,
    loading,
    setLoopMode
  } = useAudio();

  const { stopSound, startEffect } = useAudioEffects();

  const [effectsModalVisible, setEffectsModalVisible] = useState(false);
  const [frequenciesModalVisible, setFrequenciesModalVisible] = useState(false);
  const { position, duration } = useProgress(1000);

  // Animation effects
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 700,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  // Rotating animation for album art
  useEffect(() => {
    if (isPlaying) {
      Animated.loop(
        Animated.timing(rotateAnim, {
          toValue: 0,
          duration: 0,
          useNativeDriver: true,
        })
      ).start();
    } else {
      rotateAnim.stopAnimation();
    }
  }, [isPlaying]);

  useEffect(() => {
    trackScreenView("PlayerScreen", "PlayerScreen");
    if (isFocused === false) {
      if (isPlaying) {
        dispatch(playerActions.setIsPlayerContinue(true));
      }
    }
  }, [isFocused]);

  useEffect(() => {
    if (
      routes?.params?.screen === "ChakrasTrack" ||
      routes?.params?.root === "Chakras" ||
      routes?.params?.root == "GuidedMeditation"
    ) {
      stopSound();
    } else {
      if (isPlaying === false) {
        stopSound();
      } else {
        startEffect();
      }
    }
  }, [isPlaying]);

  useEffect(() => {
    if (routes.params?.root === "SleepMusic") {
      handleLoopCurrentTrack()
    } else {
      handleLoopCurrentTrackStop()
    }
  }, [routes.params?.root]);

  const handleLoopCurrentTrack = async () => {
    await setLoopMode(RepeatMode.Track);
  };

  const handleLoopCurrentTrackStop = async () => {
    await setLoopMode(RepeatMode.Off);
  };

  const handleGoBack = () => {
    navigation.goBack();
  };

  function formatTime(secondsInput: number) {
    const totalSeconds = Math.floor(secondsInput);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    const paddedMinutes = minutes.toString().padStart(2, "0");
    const paddedSeconds = seconds.toString().padStart(2, "0");
    return `${paddedMinutes}:${paddedSeconds}`;
  }

  const onSliderValueChange = async (value: any) => {
    await TrackPlayer.seekTo(Number(value[0]));
  };

  const isChakras =
    routes.params?.root === "Chakras" ||
    routes.params?.root === "GuidedMeditation";
  const enabledFrequency = routes.params?.isFrequency;

  const rotateInterpolate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <View style={modernStyles.container}>
      <FocusAwareStatusBar
        barStyle={"light-content"}
        translucent
        backgroundColor={"transparent"}
      />
      
      {/* Background with blur effect */}
      <ImageBackground
        source={ImagePath.playerbg}
        style={modernStyles.backgroundImage}
        blurRadius={20}
      >
        <LinearGradient
          colors={['rgba(0,0,0,0.3)', 'rgba(0,0,0,0.7)', 'rgba(0,0,0,0.95)']}
          style={modernStyles.gradientOverlay}
        />
      </ImageBackground>

      {/* Header */}
      <Animated.View 
        style={[
          modernStyles.header,
          { 
            top: top + 10,
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }]
          }
        ]}
      >
        <TouchableOpacity 
          style={modernStyles.backButton}
          onPress={handleGoBack}
          activeOpacity={0.7}
        >
          <View style={modernStyles.backButtonInner}>
            <Ionicons name="chevron-back" size={24} color="white" />
          </View>
        </TouchableOpacity>
        
        <View style={modernStyles.headerCenter}>
          <Text style={modernStyles.headerTitle}>Now Playing</Text>
          <Text style={modernStyles.headerSubtitle}>
            {routes.params?.root === "GuidedMeditation"
              ? "Guided Meditation"
              : routes.params?.root}
          </Text>
        </View>

      </Animated.View>

      {/* Main Content */}
      <Animated.View 
        style={[
          modernStyles.mainContent,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }]
          }
        ]}
      >
        {/* Album Art Container */}
        <View style={modernStyles.albumContainer}>
          <View style={modernStyles.albumArtWrapper}>
            <Animated.View
              style={[
                modernStyles.albumArt,
                {
                  transform: [{ rotate: isPlaying ? rotateInterpolate : '0deg' }]
                }
              ]}
            >
              <Image
                source={{ uri: currentTrack?.image }}
                style={modernStyles.albumImage}
              />
              <LinearGradient
                colors={['transparent', 'rgba(0,0,0,0.8)']}
                style={modernStyles.albumGradient}
              />
            </Animated.View>
          </View>
          
          {/* Floating music info */}
          <View style={modernStyles.musicInfoCard}>
            <Text style={modernStyles.trackTitle} numberOfLines={2}>
              {currentTrack?.title}
            </Text>
            <Text style={modernStyles.trackArtist} numberOfLines={1}>
              {routes.params?.root === "GuidedMeditation"
                ? "Guided Meditation"
                : routes.params?.root}
            </Text>
          </View>
        </View>

        {/* Progress Section */}
        {routes.params?.root !== "SleepMusic" && (
          <View style={modernStyles.progressSection}>
            <View style={modernStyles.progressContainer}>
              <Slider
                value={position}
                minimumValue={0}
                maximumValue={duration}
                trackStyle={modernStyles.progressTrack}
                thumbStyle={modernStyles.progressThumb}
                maximumTrackTintColor="rgba(255,255,255,0.3)"
                minimumTrackTintColor="#ff6b6b"
                thumbTintColor="#ff6b6b"
                onSlidingComplete={onSliderValueChange}
              />
            </View>
            
            <View style={modernStyles.timeContainer}>
              <Text style={modernStyles.timeText}>{formatTime(position)}</Text>
              <Text style={modernStyles.timeText}>{formatTime(duration)}</Text>
            </View>
          </View>
        )}

        {/* Controls */}
        <View style={modernStyles.controlsContainer}>
          <TouchableOpacity 
            style={modernStyles.controlButton}
            onPress={previousTrack}
            activeOpacity={0.7}
          >
            <Ionicons name="play-skip-back" size={32} color="rgba(255,255,255,0.8)" />
          </TouchableOpacity>

          <TouchableOpacity 
            style={modernStyles.playButton}
            onPress={playPause}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={['#688aa3', '#8aa4b7']}
              style={modernStyles.playButtonGradient}
            >
              <Ionicons
                name={isPlaying ? "pause" : "play"}
                size={30}
                color="white"
                style={{ marginLeft: isPlaying ? 0 : 2 }}
              />
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity 
            style={modernStyles.controlButton}
            onPress={nextTrack}
            activeOpacity={0.7}
          >
            <Ionicons name="play-skip-forward" size={32} color="rgba(255,255,255,0.8)" />
          </TouchableOpacity>
        </View>

        {/* Additional Options */}
        {enabledFrequency && (
          <View style={modernStyles.optionsContainer}>
            <TouchableOpacity
              style={modernStyles.optionButton}
              onPress={() => setEffectsModalVisible(true)}
              activeOpacity={0.7}
            >
              <View style={modernStyles.optionButtonInner}>
                <Ionicons name="musical-notes" size={20} color="white" />
                <Text style={modernStyles.optionText}>Effects</Text>
              </View>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={modernStyles.optionButton}
              onPress={() => setFrequenciesModalVisible(true)}
              activeOpacity={0.7}
            >
              <View style={modernStyles.optionButtonInner}>
                <Ionicons name="options" size={20} color="white" />
                <Text style={modernStyles.optionText}>Frequencies</Text>
              </View>
            </TouchableOpacity>
          </View>
        )}
      </Animated.View>

      {loading && <Loader isBottom />}
      
      <EffectsModal
        visible={effectsModalVisible}
        onClose={() => setEffectsModalVisible(false)}
      />
      <FrequenciesModal
        visible={frequenciesModalVisible}
        onClose={() => setFrequenciesModalVisible(false)}
      />
    </View>
  );
};

const modernStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  backgroundImage: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  gradientOverlay: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  header: {
    position: 'absolute',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    width: '100%',
    zIndex: 10,
  },
  backButton: {
    width: 44,
    height: 44,
  },
  backButtonInner: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.15)',
    backdropFilter: 'blur(20px)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: hp(isTablet ? 3 : 3),
    fontWeight: '600',
    color: 'white',
    fontFamily: FontPath.QuattrocentoRegular,
  },
  headerSubtitle: {
    fontSize: hp(isTablet ? 2 : 2),
    color: 'rgba(255,255,255,0.7)',
    marginTop: 2,
    fontFamily: FontPath.QuattrocentoRegular,
  },
  mainContent: {
    flex: 1,
    paddingHorizontal: 20,
    justifyContent: 'flex-start',
    paddingTop: hp(isTablet ? 10 : 15),
  },
  albumContainer: {
    alignItems: 'center',
    marginBottom: 15,
  },
  albumArtWrapper: {
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.3,
    shadowRadius: 30,
    elevation: 20,
  },
  albumArt: {
    width: screenWidth * 0.55,
    height: screenWidth * 0.55,
    borderRadius: screenWidth * 0.325,
    overflow: 'hidden',
    borderWidth: 0,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  albumImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  albumGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '40%',
  },
  musicInfoCard: {
    marginTop: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 16,
    padding: 16,
    backdropFilter: 'blur(20px)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    width: '100%',
    alignItems: 'center',
  },
  trackTitle: {
    fontSize: hp(isTablet ? 2.3 : 2),
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
    marginBottom: 6,
    fontFamily: FontPath.QuattrocentoRegular,
  },
  trackArtist: {
    fontSize: hp(isTablet ? 2 : 2),
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'center',
    fontFamily: FontPath.QuattrocentoRegular,
  },
  progressSection: {
    marginVertical: 25,
  },
  progressContainer: {
    paddingHorizontal: 10,
  },
  progressTrack: {
    height: 4,
    borderRadius: 2,
  },
  progressThumb: {
    width: 20,
    height: 20,
    borderRadius: 10,
    shadowColor: '#ff6b6b',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
    elevation: 5,
  },
  timeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 15,
    paddingHorizontal: 10,
  },
  timeText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.6)',
    fontFamily: FontPath.QuattrocentoRegular,
  },
  controlsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 25,
  },
  controlButton: {
    width: 60,
    height: 60,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 15,
  },
  playButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    shadowColor: '#ff6b6b',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 12,
  },
  playButtonGradient: {
    width: 70,
    height: 70,
    borderRadius: 35,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 20,
    marginTop: 20,
    marginBottom: 30,
  },
  optionButton: {
    flex: 1,
    marginHorizontal: 8,
    maxWidth: 120,
  },
  optionButtonInner: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
    backdropFilter: 'blur(20px)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    minHeight: 60,
    justifyContent: 'center',
  },
  optionText: {
    color: 'white',
    fontSize: 11,
    marginTop: 6,
    fontWeight: '500',
    fontFamily: FontPath.QuattrocentoRegular,
    textAlign: 'center',
  },
});

export default PlayerScreen;