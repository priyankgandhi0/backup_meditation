import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  TouchableWithoutFeedback,
  Vibration,
  Platform,
  StatusBar,
  AppState,
  AppStateStatus,
} from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  interpolate,
  runOnJS,
  Easing,
  useDerivedValue,
  withSequence,
  withSpring,
} from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { StackNavigationProp } from "@react-navigation/stack";
import { RootStackParamList } from "@/src/navigation/NavigationType";
import { useNavigation, useIsFocused } from "@react-navigation/native";
import { hp } from "@/src/helper/Responsive";
import BreathAlternateNostrilCircle from "@/src/components/breathwork/BreathAlternateNostrilCircle";
import { useAudio, Track } from "@/src/context/AudioContext";
import { Slider } from "@miblanchard/react-native-slider";
import { Asset } from "expo-asset";
import { colors as appColors, colors } from "@/src/utils/colors";
import { activateKeepAwakeAsync, deactivateKeepAwake } from "expo-keep-awake"; // Import keep-awake
import {
  GestureHandlerRootView,
  GestureDetector,
  Gesture,
  Directions,
} from "react-native-gesture-handler";
import * as Haptics from "expo-haptics";
import { useAppDispatch } from "@/src/redux/StateType";
import { authActions } from "@/src/redux/slice/AuthSlice";
import { trackScreenView } from "@/src/utils/analytics";

const { width, height } = Dimensions.get("window");
const isiPAD = Platform.OS === "ios" && (width >= 768 || height >= 1024);
const isVerySmallScreen = height < 670;

// Durations (6+2+8+6+2+8 = 32s)
const INHALE_LEFT_DURATION = 6;
const HOLD_1_DURATION = 2;
const EXHALE_RIGHT_DURATION = 8;
const INHALE_RIGHT_DURATION = 6;
const HOLD_3_DURATION = 2; // Ball should revolve a half circle during Inhale Right((6 s, clockwise) + Hold(2 s, clockwise)= 8 sec
const EXHALE_LEFT_DURATION = 8;

const inhaleInstructionTrack: Track = {
  id: "instruction_inhale_local_v1",
  url: Asset.fromModule(require("../../assets/sounds/Inhale.mp3")).uri,
  title: "Instruction: Inhale",
  image: "",
};
const holdInstructionTrack: Track = {
  id: "instruction_hold_local_v1",
  url: Asset.fromModule(require("../../assets/sounds/Hold.mp3")).uri,
  title: "Instruction: Hold",
  image: "",
};
const exhaleInstructionTrack: Track = {
  id: "instruction_exhale_local_v1",
  url: Asset.fromModule(require("../../assets/sounds/Exhale.mp3")).uri,
  title: "Instruction: Exhale",
  image: "",
};

const TOTAL_CYCLE_DURATION =
  INHALE_LEFT_DURATION +
  HOLD_1_DURATION +
  EXHALE_RIGHT_DURATION +
  INHALE_RIGHT_DURATION +
  HOLD_3_DURATION +
  EXHALE_LEFT_DURATION; // 32s

type Phase =
  | "Ready"
  | "Inhale Left"
  | "Hold 1"
  | "Exhale Right"
  | "Inhale Right"
  | "Hold 2"
  | "Exhale Left"
  | "Complete";

const BREATH_SCREENS = [
  "BreathRelaxScreen",
  "BreathBellyScreen",
  "BreathBoxScreen",
  "BreathAlternateNostrilScreen",
];
const CURRENT_SCREEN_INDEX = 3; // BreathAlternateNostrilScreen

const BreathAlternateNostrilScreen = () => {
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const heartbeatIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const heartbeatTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isFocused = useIsFocused();

  const [cycles, setCycles] = useState(6);
  const [currentCycle, setCurrentCycle] = useState(0);
  const [phase, setPhase] = useState<Phase>("Ready");
  const [count, setCount] = useState(INHALE_LEFT_DURATION);
  const [isRunning, setIsRunning] = useState(false);
  const hideControlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [showInstructionVolumeSlider, setShowInstructionVolumeSlider] =
    useState(false);
  const lastInstructionVolumeRef = useRef(0.7);

  // Keep awake active state ref
  const keepAwakeActiveRef = useRef(false);

  const cycleAnimationProgress = useSharedValue(0);
  const controlsOpacity = useSharedValue(1);
  const buttonScale = useSharedValue(1);

  const inhaleVibrationIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const inhaleVibrationTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const {
    loadTrack,
    stop,
    setLoopMode,
    currentTrack,
    isPlaying,
    volume,
    setVolume,
    playInstructionSound,
    instructionVolume = 0.7,
    setInstructionVolume = (vol: number) =>
      console.warn("no audioContext", vol),
  } = useAudio();

  const fadeOutIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const appState = useRef(AppState.currentState);
  const wasRunningBeforeBackground = useRef(false);

  useEffect(() => {
    trackScreenView("BreathAlternateNostril", "BreathAlternateNostrilScreen");
  }, [])

  useEffect(() => {
    // Pause any playing audio when this screen is focused
    if (isFocused && isPlaying) {
      stop();
    }
  }, [isFocused, isPlaying, stop]);

  // Tapping anywhere hides slider immediately and shows title
  const handleScreenTap = () => {
    controlsOpacity.value = withSpring(1, { damping: 15, stiffness: 300 });
    if (hideControlsTimeoutRef.current) {
      clearTimeout(hideControlsTimeoutRef.current);
      hideControlsTimeoutRef.current = null;
    }
    // Immediately hide the slider if visible
    if (showInstructionVolumeSlider) {
      setShowInstructionVolumeSlider(false);
    }
    // Then schedule fade‐out of other controls if running
    if (isRunning && phase !== "Complete") {
      hideControlsTimeoutRef.current = setTimeout(() => {
        controlsOpacity.value = withTiming(0, { duration: 500 });
        setShowInstructionVolumeSlider(false);
        hideControlsTimeoutRef.current = null;
      }, 3000);
    }
  };

  // Toggle mute/unmute and force‐show slider on icon press
  const handleInstructionVolumeIconPress = () => {
    const newState = !showInstructionVolumeSlider;
    setShowInstructionVolumeSlider(newState);
    if (newState) handleScreenTap();
  };

  const updateStateOnJS = (
    currentPhase: Phase,
    countdown: number,
    completedCycles: number
  ) => {
    setPhase(currentPhase);
    setCount(countdown);
    setCurrentCycle(completedCycles);
  };

  useDerivedValue(() => {
    "worklet";
    if (!isRunning) return null;
    const totalElapsedTime =
      cycleAnimationProgress.value * TOTAL_CYCLE_DURATION;
    const completed = Math.floor(totalElapsedTime / TOTAL_CYCLE_DURATION);

    if (cycles > 0 && completed >= cycles) {
      runOnJS(setIsRunning)(false);
      runOnJS(setPhase)("Complete");
      runOnJS(setCount)(0);
      runOnJS(setCurrentCycle)(cycles > 0 ? cycles - 1 : 0);
      return null;
    }

    const t = totalElapsedTime % TOTAL_CYCLE_DURATION;
    let newPhase: Phase = "Ready";
    let newCount = 0;

    if (t < INHALE_LEFT_DURATION) {
      newPhase = "Inhale Left";
      newCount = INHALE_LEFT_DURATION - t;
    } else if (t < INHALE_LEFT_DURATION + HOLD_1_DURATION) {
      newPhase = "Hold 1";
      newCount = INHALE_LEFT_DURATION + HOLD_1_DURATION - t;
    } else if (
      t <
      INHALE_LEFT_DURATION + HOLD_1_DURATION + EXHALE_RIGHT_DURATION
    ) {
      newPhase = "Exhale Right";
      newCount =
        INHALE_LEFT_DURATION + HOLD_1_DURATION + EXHALE_RIGHT_DURATION - t;
    } else if (
      t <
      INHALE_LEFT_DURATION +
        HOLD_1_DURATION +
        EXHALE_RIGHT_DURATION +
        INHALE_RIGHT_DURATION
    ) {
      newPhase = "Inhale Right";
      newCount =
        INHALE_LEFT_DURATION +
        HOLD_1_DURATION +
        EXHALE_RIGHT_DURATION +
        INHALE_RIGHT_DURATION -
        t;
    } else if (
      t <
      INHALE_LEFT_DURATION +
        HOLD_1_DURATION +
        EXHALE_RIGHT_DURATION +
        INHALE_RIGHT_DURATION +
        HOLD_3_DURATION
    ) {
      newPhase = "Hold 2";
      newCount =
        INHALE_LEFT_DURATION +
        HOLD_1_DURATION +
        EXHALE_RIGHT_DURATION +
        INHALE_RIGHT_DURATION +
        HOLD_3_DURATION -
        t;
    } else if (
      t <
      INHALE_LEFT_DURATION +
        HOLD_1_DURATION +
        EXHALE_RIGHT_DURATION +
        INHALE_RIGHT_DURATION +
        HOLD_3_DURATION +
        EXHALE_LEFT_DURATION
    ) {
      newPhase = "Exhale Left";
      newCount =
        INHALE_LEFT_DURATION +
        HOLD_1_DURATION +
        EXHALE_RIGHT_DURATION +
        INHALE_RIGHT_DURATION +
        HOLD_3_DURATION +
        EXHALE_LEFT_DURATION -
        t;
    }

    newCount = Math.max(0, newCount);
    runOnJS(updateStateOnJS)(newPhase, Math.ceil(newCount), completed);
    return null;
  }, [isRunning, cycles]);

  useEffect(() => {
    if (isRunning) {
      activateKeepAwakeAsync().then(() => {
        keepAwakeActiveRef.current = true;
        console.log("AlternateNostrilScreen: Keep awake activated");
      });
      const target = cycles === 0 ? 10000 : cycles;
      const progressed = cycleAnimationProgress.value;
      const remaining = target - progressed;
      const duration = Math.max(0, remaining * TOTAL_CYCLE_DURATION * 1000);

      if (duration > 0) {
        cycleAnimationProgress.value = withTiming(target, {
          duration,
          easing: Easing.linear,
        });
      } else if (remaining <= 0 && cycles > 0) {
        setIsRunning(false);
        setPhase("Complete");
        setCount(0);
        setCurrentCycle(cycles - 1);
      }

      if (hideControlsTimeoutRef.current)
        clearTimeout(hideControlsTimeoutRef.current);
      hideControlsTimeoutRef.current = setTimeout(() => {
        controlsOpacity.value = withTiming(0, { duration: 500 });
        setShowInstructionVolumeSlider(false);
        hideControlsTimeoutRef.current = null;
      }, 3000);
    } else {
      controlsOpacity.value = withSpring(1, { damping: 15, stiffness: 300 });
      cycleAnimationProgress.value = cycleAnimationProgress.value;
      if (phase === "Complete" || phase === "Ready") {
        setShowInstructionVolumeSlider(false);
      }
      if (hideControlsTimeoutRef.current) {
        clearTimeout(hideControlsTimeoutRef.current);
        hideControlsTimeoutRef.current = null;
      }
    }
    return () => {
      if (hideControlsTimeoutRef.current)
        clearTimeout(hideControlsTimeoutRef.current);
    };
  }, [isRunning, cycles]);

  useEffect(() => {
    if (!isRunning && phase !== "Complete") {
      if (phase === "Ready") {
        setCurrentCycle(0);
        setCount(INHALE_LEFT_DURATION);
        cycleAnimationProgress.value = 0;
      }
    }
  }, [cycles, isRunning, phase]);

  useEffect(() => {
    return () => {
      if (fadeOutIntervalRef.current) clearInterval(fadeOutIntervalRef.current);
      if (hideControlsTimeoutRef.current)
        clearTimeout(hideControlsTimeoutRef.current);
      stopHeartbeatVibration();
      stopInhaleVibration();
      // Ensure keep awake is deactivated on unmount
      if (keepAwakeActiveRef.current) {
        deactivateKeepAwake().then(() => {
          keepAwakeActiveRef.current = false;
          console.log(
            "AlternateNostrilScreen: Keep awake deactivated on unmount"
          );
        });
      }
    };
  }, [currentTrack, stop]); // Adjusted dependencies to match original logic

  const startInhaleVibration = useCallback(() => {
    if (inhaleVibrationIntervalRef.current) {
      console.log("Inhale vibration already running.");
      return;
    }
    let durationMs = 0;
    if (phase === "Inhale Left") {
      durationMs = INHALE_LEFT_DURATION * 1000;
    } else if (phase === "Inhale Right") {
      durationMs = INHALE_RIGHT_DURATION * 1000;
    } else {
      durationMs = 3000; // fallback
    }
    if (Platform.OS === "ios") {
      console.log(
        `iOS Haptic simulation started for ${
          durationMs / 1000
        } seconds (${phase} phase).`
      );
      inhaleVibrationIntervalRef.current = setInterval(() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch((error) =>
          console.warn("Haptics error on iOS (inhale):", error)
        );
      }, 100);
      inhaleVibrationTimeoutRef.current = setTimeout(() => {
        if (inhaleVibrationIntervalRef.current) {
          clearInterval(inhaleVibrationIntervalRef.current);
          inhaleVibrationIntervalRef.current = null;
        }
        if (inhaleVibrationTimeoutRef.current) {
          clearTimeout(inhaleVibrationTimeoutRef.current);
          inhaleVibrationTimeoutRef.current = null;
        }
        console.log(
          `iOS Haptic simulation stopped after ${
            durationMs / 1000
          } seconds (${phase} phase).`
        );
      }, durationMs);
    } else {
      Vibration.vibrate(durationMs);
      console.log(
        `Android Vibration started for ${
          durationMs / 1000
        } seconds (${phase} phase).`
      );
    }
  }, [phase]);

  const stopInhaleVibration = useCallback(() => {
    if (Platform.OS === "ios") {
      if (inhaleVibrationIntervalRef.current) {
        clearInterval(inhaleVibrationIntervalRef.current);
        inhaleVibrationIntervalRef.current = null;
      }
      if (inhaleVibrationTimeoutRef.current) {
        clearTimeout(inhaleVibrationTimeoutRef.current);
        inhaleVibrationTimeoutRef.current = null;
      }
      console.log("iOS Haptic simulation explicitly stopped (inhale phase).");
    } else {
      Vibration.cancel();
      console.log("Android Vibration explicitly cancelled (inhale phase).");
    }
  }, []);

  const startHeartbeatVibration = () => {
    if (heartbeatIntervalRef.current || heartbeatTimeoutRef.current) return;
    if (Platform.OS === "android") {
      heartbeatIntervalRef.current = setInterval(() => {
        Vibration.vibrate([0, 80, 100, 80]);
      }, 1000);
    } else {
      // iOS: Use haptics for a double-tap heartbeat
      const doHeartbeat = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        heartbeatTimeoutRef.current = setTimeout(() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          heartbeatTimeoutRef.current = null;
        }, 200);
      };
      heartbeatIntervalRef.current = setInterval(doHeartbeat, 1000);
      doHeartbeat(); // Immediate first heartbeat
    }
  };

  const stopHeartbeatVibration = () => {
    if (heartbeatIntervalRef.current) {
      clearInterval(heartbeatIntervalRef.current);
      heartbeatIntervalRef.current = null;
    }
    if (heartbeatTimeoutRef.current) {
      clearTimeout(heartbeatTimeoutRef.current);
      heartbeatTimeoutRef.current = null;
    }
    Vibration.cancel();
  };

  useEffect(() => {
    if (isRunning && phase !== "Ready" && phase !== "Complete") {
      switch (phase) {
        case "Inhale Left":
        case "Inhale Right":
          stopHeartbeatVibration();
          startInhaleVibration();
          playInstructionSound(inhaleInstructionTrack.url);
          break;
        case "Hold 1":
        case "Hold 2":
          console.log("Hold phase: Heartbeat vibration started.");
          stopInhaleVibration();
          stopHeartbeatVibration();
          startHeartbeatVibration();
          playInstructionSound(holdInstructionTrack.url);
          break;
        case "Exhale Right":
        case "Exhale Left":
          stopInhaleVibration();
          console.log(
            "Hold phase: Heartbeat vibration stopped (entering Exhale phase)."
          );
          stopHeartbeatVibration();
          playInstructionSound(exhaleInstructionTrack.url);
          break;
        default:
          stopInhaleVibration();
          console.log(
            "Hold phase: Heartbeat vibration stopped (leaving Hold phase)."
          );
          stopHeartbeatVibration();
          break;
      }
    } else {
      stopInhaleVibration();
      console.log(
        "Hold phase: Heartbeat vibration stopped (session stopped or not running)."
      );
      stopHeartbeatVibration();
    }
  }, [
    phase,
    isRunning,
    playInstructionSound,
    startInhaleVibration,
    stopInhaleVibration,
  ]);

  const dispatch = useAppDispatch();

      const totalPracticeTimeText =
    cycles === 0 ? "Infinite" : `${TOTAL_CYCLE_DURATION * cycles} seconds`;

  const handleButtonPress = () => {
    buttonScale.value = withSequence(
      withSpring(0.95, { damping: 10, stiffness: 400 }),
      withSpring(1, { damping: 10, stiffness: 400 })
    );
    // Always reset to initial state before starting
    setCurrentCycle(0);
    setPhase("Ready");
    setCount(INHALE_LEFT_DURATION);
    cycleAnimationProgress.value = 0;
    setIsRunning((prev) => (!prev ? true : false));
  };

  const handleIncrementCycles = () => {
    if (isRunning) return;
    if (cycles === 0) setCycles(1);
    else setCycles((prev) => prev + 1);
  };

  const handleDecrementCycles = () => {
    if (isRunning) return;
    if (cycles > 1) setCycles((prev) => prev - 1);
    else if (cycles === 1) setCycles(0);
  };

  const controlsAnimatedStyle = useAnimatedStyle(() => ({
    opacity: controlsOpacity.value,
    transform: [
      {
        translateY: interpolate(controlsOpacity.value, [0, 1], [20, 0]),
      },
    ],
  }));

  const buttonAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: buttonScale.value }],
  }));

  const onSwipeLeft = () => {
    navigation.navigate("BreathBoxScreen"); // Previous screen
  };

  const panGesture = Gesture.Pan()
    .minDistance(15)
    .activeOffsetX([-5, 5])
    .onEnd((event) => {
      if (!isRunning && event.velocityX > 200) {
        // Swipe left (drag right) goes to previous screen
        runOnJS(onSwipeLeft)();
      }
    });

  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (
        appState.current.match(/active/) &&
        nextAppState.match(/inactive|background/)
      ) {
        // App going to background
        if (isRunning) {
          wasRunningBeforeBackground.current = true;
          setIsRunning(false);
        } else {
          wasRunningBeforeBackground.current = false;
        }
      } else if (
        appState.current.match(/inactive|background/) &&
        nextAppState === "active"
      ) {
        // App coming to foreground
        if (wasRunningBeforeBackground.current) {
          setIsRunning(true);
        }
      }
      appState.current = nextAppState;
    };
    const subscription = AppState.addEventListener(
      "change",
      handleAppStateChange
    );
    return () => {
      subscription.remove();
    };
  }, [isRunning]);



    const handleBackButtonPress = () => {
    setIsRunning(false);
    stopInhaleVibration();
    stopHeartbeatVibration();
    stop();
    dispatch(authActions.setIsBreathwork(true));
    navigation.navigate("BaseHome");
  };

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <GestureDetector gesture={panGesture}>
        <TouchableWithoutFeedback onPress={handleScreenTap}>
          <View style={styles.container}>
            <LinearGradient
              colors={["#fff7cc", appColors.light_sky || "#b6d7d8"]} // Changed appColors.light_blue to appColors.light_sky
              locations={[0.3, 0.9]}
              start={{ x: 0.1, y: 1 }}
              end={{ x: 0.9, y: 1 }}
              style={StyleSheet.absoluteFill}
              pointerEvents="none"
            />
            <StatusBar
              barStyle="light-content"
              backgroundColor="transparent"
              translucent
            />

            <Animated.View style={[styles.headerRow, controlsAnimatedStyle]}>
              <TouchableOpacity
                onPress={handleBackButtonPress}
                style={styles.headerIconButton}
                activeOpacity={0.7}
              >
                <View style={styles.iconButtonContainer}>
                  <Ionicons
                    name="arrow-back"
                    size={isiPAD ? 32 : 24}
                    color={appColors.primary}
                  />
                </View>
              </TouchableOpacity>
              <View style={styles.headerMiddleSection}>
                <View style={styles.titleContainer}>
                  {/* Title only shows when slider is hidden */}
                  {!showInstructionVolumeSlider && (
                    <Text style={[styles.title, isiPAD && styles.titleIPad]}>
                      Alternate Nostril
                    </Text>
                  )}
                  <TouchableOpacity
                    onPress={() =>
                      navigation.navigate("AlternateNostrilTechniqueInfoScreen")
                    }
                    style={styles.titleInfoIconContainer}
                    activeOpacity={0.7}
                  >
                    <Ionicons
                      name="information-circle-outline"
                      size={isiPAD ? 32 : 24}
                      color={appColors.primary}
                    />
                  </TouchableOpacity>
                </View>
                {showInstructionVolumeSlider && (
                  <View style={styles.headerSliderContainer}>
                    <Slider
                      containerStyle={styles.headerSlider}
                      minimumValue={0}
                      maximumValue={1}
                      step={0.05}
                      value={instructionVolume}
                      onValueChange={(value) => {
                        const newVol = Array.isArray(value) ? value[0] : value;
                        setInstructionVolume(newVol);
                        if (newVol > 0)
                          lastInstructionVolumeRef.current = newVol;
                      }}
                      minimumTrackTintColor={appColors.white}
                      maximumTrackTintColor={appColors.light_pink || "#dccfeb"}
                      thumbTintColor={appColors.white}
                      trackStyle={styles.headerSliderTrackHeight}
                      thumbStyle={styles.headerSliderThumb}
                    />
                  </View>
                )}
              </View>
              <TouchableOpacity
                onPress={handleInstructionVolumeIconPress}
                style={[styles.headerIconButton, { marginRight: 0 }]}
                activeOpacity={0.7}
              >
                <View style={styles.iconButtonContainer}>
                  <Ionicons
                    name={
                      instructionVolume === 0
                        ? "volume-mute-outline"
                        : "volume-medium-outline"
                    }
                    size={isiPAD ? 30 : 22}
                    color={appColors.primary}
                  />
                </View>
              </TouchableOpacity>
            </Animated.View>

            {/* Status Bar Section */}
            <Animated.View style={[styles.statusBar, controlsAnimatedStyle]}>
              <View style={styles.statusItem}>
                <Text
                  style={[
                    styles.statusLabel,
                    isiPAD && styles.statusLabelLarge,
                  ]}
                >
                  Cycle
                </Text>
                <Text
                  style={[
                    styles.statusValue,
                    isiPAD && styles.statusValueLarge,
                  ]}
                >
                  {currentCycle + 1}
                  {cycles > 0 ? `/${cycles}` : "/∞"}
                </Text>
              </View>
              <View style={styles.phaseIndicator}>
                <Text style={styles.phaseText}>
                  {isRunning ? "6-2-8 ALTERNATING" : phase.toUpperCase()}
                </Text>
              </View>
              <View style={styles.statusItem}>
                <Text
                  style={[
                    styles.statusLabel,
                    isiPAD && styles.statusLabelLarge,
                  ]}
                >
                  Count
                </Text>
                <Text
                  style={[
                    styles.statusValue,
                    isiPAD && styles.statusValueLarge,
                  ]}
                >
                  {Math.ceil(count)}
                </Text>
              </View>
            </Animated.View>

            <View style={styles.circleArea}>
              <View style={styles.circleContainer}>
                <BreathAlternateNostrilCircle
                  phase={phase}
                  count={Math.ceil(count)}
                  isRunning={isRunning}
                  animationProgress={cycleAnimationProgress}
                  inhaleLeftDuration={INHALE_LEFT_DURATION}
                  hold1Duration={HOLD_1_DURATION}
                  exhaleRightDuration={EXHALE_RIGHT_DURATION}
                  inhaleRightDuration={INHALE_RIGHT_DURATION}
                  hold2Duration={HOLD_3_DURATION}
                  exhaleLeftDuration={EXHALE_LEFT_DURATION}
                />
              </View>
              {/* Left Arrow for Swipe Indication */}
              {!isRunning && (
                <TouchableOpacity
                  style={[styles.arrowButton, styles.arrowLeft]}
                  onPress={onSwipeLeft}
                  activeOpacity={0.7}
                >
                  <Ionicons
                    name="chevron-back-outline"
                    size={isiPAD ? 30 : 20}
                    color={appColors.primary}
                  />
                </TouchableOpacity>
              )}
              {/* Indicator-vs-phase-text swap: Only one is visible at a time, in the same spot below the circle */}
              <View style={styles.phaseTextOrIndicatorWrapper}>
                {!isRunning && phase !== "Complete" && (
                  <View style={styles.screenIndicatorContainer}>
                    {BREATH_SCREENS.map((_, idx) => (
                      <View
                        key={idx}
                        style={[
                          styles.screenIndicatorDot,
                          idx === CURRENT_SCREEN_INDEX
                            ? styles.screenIndicatorDotActive
                            : styles.screenIndicatorDotInactive,
                        ]}
                      />
                    ))}
                  </View>
                )}
                {/* The actual phase text is already rendered elsewhere in this wrapper by the original code. Do not add another. */}
              </View>
            </View>

            <View style={styles.controlsWrapper}>
              <Animated.View
                style={[styles.controlsContainer, controlsAnimatedStyle]}
              >
                <View
                  style={[
                    styles.inputCard,
                    Platform.OS === "ios" &&
                      isVerySmallScreen &&
                      styles.inputCardSmallScreen,
                    isiPAD && styles.inputCardIPad,
                  ]}
                >
                  <View
                    style={[
                      styles.inputRow,
                      Platform.OS === "ios" &&
                        isVerySmallScreen &&
                        styles.inputRowSmallScreen,
                      isiPAD && styles.inputRowIPad,
                    ]}
                  >
                    <Text
                      style={[
                        styles.inputLabel,
                        Platform.OS === "ios" &&
                          isVerySmallScreen &&
                          styles.inputLabelSmallScreen,
                        isiPAD && styles.inputLabelIPad,
                      ]}
                    >
                      Cycles
                    </Text>
                    <View style={styles.cycleIncrementerContainer}>
                      <TouchableOpacity
                        style={[
                          styles.cycleControlButton,
                          isRunning && styles.cycleControlButtoDisabled,
                          Platform.OS === "ios" &&
                            isVerySmallScreen &&
                            styles.cycleControlButtonSmallScreen,
                          isiPAD && styles.cycleControlButtonIPad,
                        ]}
                        onPress={handleDecrementCycles}
                        disabled={isRunning}
                      >
                        <Ionicons
                          name="remove-outline"
                          size={
                            isiPAD
                              ? 30
                              : Platform.OS === "ios" && isVerySmallScreen
                              ? 16
                              : 20
                          }
                          color={
                            isRunning
                              ? appColors.gray_3
                              : appColors.dark_mauve_3 || "#695786"
                          }
                        />
                      </TouchableOpacity>
                      <Text
                        style={[
                          styles.cycleCountText,
                          Platform.OS === "ios" &&
                            isVerySmallScreen &&
                            styles.cycleCountTextSmallScreen,
                          isiPAD && styles.cycleCountTextIPad,
                        ]}
                      >
                        {cycles === 0 ? "∞" : cycles.toString()}
                      </Text>
                      <TouchableOpacity
                        style={[
                          styles.cycleControlButton,
                          isRunning && styles.cycleControlButtoDisabled,
                          Platform.OS === "ios" &&
                            isVerySmallScreen &&
                            styles.cycleControlButtonSmallScreen,
                          isiPAD && styles.cycleControlButtonIPad,
                        ]}
                        onPress={handleIncrementCycles}
                        disabled={isRunning}
                      >
                        <Ionicons
                          name="add-outline"
                          size={
                            isiPAD
                              ? 30
                              : Platform.OS === "ios" && isVerySmallScreen
                              ? 16
                              : 20
                          }
                          color={
                            isRunning
                              ? appColors.gray_3
                              : appColors.dark_mauve_3 || "#695786"
                          }
                        />
                      </TouchableOpacity>
                    </View>
                  </View>
                  <View
                    style={[
                      styles.separator,
                      Platform.OS === "ios" &&
                        isVerySmallScreen &&
                        styles.separatorSmallScreen,
                      isiPAD && styles.separatorIPad,
                    ]}
                  />
                  <View
                    style={[
                      styles.inputRow,
                      Platform.OS === "ios" &&
                        isVerySmallScreen &&
                        styles.inputRowSmallScreen,
                      isiPAD && styles.inputRowIPad,
                    ]}
                  >
                    <Text
                      style={[
                        styles.inputLabel,
                        Platform.OS === "ios" &&
                          isVerySmallScreen &&
                          styles.inputLabelSmallScreen,
                        isiPAD && styles.inputLabelIPad,
                      ]}
                    >
                      Duration
                    </Text>
                    <Text
                      style={[
                        styles.timeText,
                        Platform.OS === "ios" &&
                          isVerySmallScreen &&
                          styles.timeTextSmallScreen,
                        isiPAD && styles.timeTextIPad,
                      ]}
                    >
                      {totalPracticeTimeText}
                    </Text>
                  </View>
                </View>
                <Animated.View
                  style={[styles.buttonContainer, buttonAnimatedStyle]}
                >
                  <TouchableOpacity
                    style={styles.buttonWrapper}
                    onPress={handleButtonPress}
                    activeOpacity={0.9}
                  >
                    <LinearGradient
                      colors={
                        isRunning
                          ? [
                              appColors.light_yellow || "#695786",
                              appColors.light_yellow || "#695786",
                            ]
                          : [
                              appColors.blue || "#6c757d",
                              appColors.blue || "#b0b0b0",
                            ]
                      }
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.button}
                    >
                      <Ionicons
                        name={
                          isRunning
                            ? "stop-circle-outline"
                            : phase === "Complete"
                            ? "refresh"
                            : "play"
                        }
                        size={isiPAD ? 30 : 24}
                        color={appColors.white}
                        style={styles.buttonIcon}
                      />
                      <Text style={styles.buttonText}>
                        {isRunning
                          ? "Stop"
                          : phase === "Complete"
                          ? "Start Again"
                          : "Start"}
                      </Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </Animated.View>
              </Animated.View>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </GestureDetector>
    </GestureHandlerRootView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
    paddingHorizontal: 20,
    paddingTop: isiPAD
      ? 80
      : Platform.OS === "android"
      ? (StatusBar.currentHeight || 0) + hp(2)
      : 60,
    paddingBottom: 20,
    zIndex: 10,
  },
  headerIconButton: {},
  iconButtonContainer: {
    width: isiPAD ? 48 : 40,
    height: isiPAD ? 48 : 40,
    borderRadius: isiPAD ? 24 : 20,
    backgroundColor: appColors.white_2 || "rgba(255,255,255,0.3)",
    justifyContent: "center",
    alignItems: "center",
  },
  headerMiddleSection: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: 8,
  },
  titleContainer: { flexDirection: "row", alignItems: "center" },
  titleInfoIconContainer: { marginLeft: 8, padding: 4 },
  title: {
    fontSize: isiPAD ? 32 : 24,
    fontWeight: "800",
    color: appColors.primary,
    fontFamily: "Quattrocento",
    textAlign: "center",
  },
  titleIPad: { fontSize: 36 },
  headerSliderContainer: {
    width: isiPAD ? 120 : 90,
    marginLeft: isiPAD ? 12 : 8,
    justifyContent: "center",
    alignItems: "center",
  },
  headerSlider: { width: "100%" },
  headerSliderTrackHeight: { height: isiPAD ? 4 : 3, borderRadius: 2 },
  headerSliderThumb: {
    width: isiPAD ? 16 : 12,
    height: isiPAD ? 16 : 12,
    borderRadius: isiPAD ? 8 : 6,
    backgroundColor: appColors.white,
  },
  statusBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginHorizontal: 20,
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: appColors.white || appColors.white,
    borderRadius: 16,
    marginBottom: 16,
  },
  statusItem: { alignItems: "center" },
  statusLabel: {
    fontSize: isiPAD ? 14 : 12,
    color: appColors.black,
    fontFamily: "Quattrocento",
    marginBottom: 4,
  },
  statusLabelLarge: {
    fontSize: 18,
  },
  statusValue: {
    fontSize: isiPAD ? 24 : 18,
    fontWeight: "600",
    color: appColors.black,
    fontFamily: "Quattrocento",
    minWidth: isiPAD ? 40 : 30,
    textAlign: "center",
  },
  statusValueLarge: {
    fontSize: 24,
  },
  phaseIndicator: {
    paddingHorizontal: isiPAD ? 24 : 20,
    paddingVertical: isiPAD ? 12 : 8,
    borderRadius: 20,
    minWidth: 120,
    alignItems: "center",
    backgroundColor: colors.blue,
  },
  phaseText: {
    fontSize: isiPAD ? 16 : 13,
    fontWeight: "600",
    color: colors.white,
    fontFamily: "Quattrocento",
    textTransform: "uppercase",
  },
  statusBarPhaseTextIPad: { fontSize: 18 },
  circleArea: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
    marginBottom: isiPAD ? -10 : -10,
    position: "relative",
  },
  circleContainer: {
    justifyContent: "center",
    alignItems: "center",
    height: 340, // Match BoxScreen exactly
  },
  controlsWrapper: { paddingBottom: isiPAD ? 40 : 30 },
  controlsContainer: { paddingHorizontal: 20 },
  inputCard: {
    backgroundColor: appColors.white,
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
  },
  inputCardSmallScreen: {
    paddingTop: 10,
    paddingBottom: 10,
    paddingHorizontal: 15,
    marginBottom: 15,
  },
  inputCardIPad: {
    padding: isiPAD ? 25 : 20,
    marginBottom: isiPAD ? 25 : 20,
  },
  phaseTextOrIndicatorWrapper: {
    marginTop: hp(isiPAD ? 2 : -6),
    minHeight: isiPAD ? 40 : 28,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonContainer: {
    alignItems: "center",
    marginBottom: 5, // Match BoxScreen
  },
  buttonWrapper: {
    width: "100%",
    borderRadius: 16,
    overflow: "hidden",
  },
  button: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
    paddingVertical: 14,
    minHeight: 52,
    borderRadius: 14,
  },
  arrowButton: {
    position: "absolute",
    top: isiPAD ? "46%" : "55%",
    left: undefined,
    right: undefined,
    transform: [{ translateY: -50 }],
    zIndex: 10,
  },
  arrowLeft: {
    left: isiPAD ? 45 : 16,
  },
  screenIndicatorContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  screenIndicatorDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginHorizontal: 4,
  },
  screenIndicatorDotActive: {
    backgroundColor: appColors.primary,
  },
  screenIndicatorDotInactive: {
    backgroundColor: appColors.gray_3,
    opacity: 0.5,
  },
  inputRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
  },
  inputRowSmallScreen: { paddingVertical: 6 },
  inputRowIPad: { paddingVertical: isiPAD ? 10 : 8 },
  inputLabel: {
    fontSize: isiPAD ? 18 : 16,
    fontWeight: "600",
    color: appColors.black,
    fontFamily: "Quattrocento",
  },
  inputLabelSmallScreen: { fontSize: 14 },
  inputLabelIPad: { fontSize: isiPAD ? 22 : 16 },
  cycleIncrementerContainer: { flexDirection: "row", alignItems: "center" },
  cycleControlButton: {
    padding: isiPAD ? 10 : 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.gray_2,
    backgroundColor: colors.white_1,
    marginHorizontal: 8,
  },
  cycleControlButtonSmallScreen: { padding: 6, marginHorizontal: 6 },
  cycleControlButtonIPad: {
    padding: isiPAD ? 12 : 8,
    marginHorizontal: isiPAD ? 10 : 8,
  },
  cycleControlButtoDisabled: {
    backgroundColor: appColors.gray_2,
    borderColor: appColors.gray_3,
  },
  cycleCountText: {
    fontSize: isiPAD ? 20 : 18,
    fontWeight: "600",
    color: appColors.black,
    fontFamily: "Quattrocento",
    minWidth: isiPAD ? 60 : 40,
    textAlign: "center",
  },
  cycleCountTextSmallScreen: { fontSize: 16, minWidth: 35 },
  cycleCountTextIPad: {
    fontSize: isiPAD ? 24 : 18,
    minWidth: isiPAD ? 60 : 40,
  },
  separator: {
    height: 1,
    backgroundColor: appColors.gray_2,
    marginVertical: 12,
  },
  separatorSmallScreen: { marginVertical: 8 },
  separatorIPad: { marginVertical: isiPAD ? 15 : 12 },
  timeText: {
    fontSize: isiPAD ? 18 : 16,
    fontWeight: "600",
    color: appColors.primary,
    fontFamily: "Quattrocento",
  },
  timeTextSmallScreen: { fontSize: 14 },
  timeTextIPad: { fontSize: isiPAD ? 22 : 16 },
  buttonIcon: { marginRight: 10 },
  buttonText: {
    color: appColors.white,
    fontSize: isiPAD ? 27 : 14,
    fontWeight: "bold",
    fontFamily: "Quattrocento",
  },
});

export default BreathAlternateNostrilScreen;
