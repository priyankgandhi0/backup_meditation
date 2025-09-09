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
import BreathBellyCircle from "@/src/components/breathwork/BreathBellyCircle";
import { useAudio, Track } from "@/src/context/AudioContext";
import { Slider } from "@miblanchard/react-native-slider";
import { Asset } from "expo-asset";
import { activateKeepAwakeAsync, deactivateKeepAwake } from "expo-keep-awake";
import {
  GestureDetector,
  Gesture,
  GestureHandlerRootView,
  Directions,
} from "react-native-gesture-handler";
import { hp } from "@/src/helper/Responsive";
import * as Haptics from "expo-haptics";
import { useAppDispatch } from "@/src/redux/StateType";
import { authActions } from "@/src/redux/slice/AuthSlice";
import { trackScreenView } from "@/src/utils/analytics";

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

const { width, height } = Dimensions.get("window");
const isiPAD = Platform.OS === "ios" && (width >= 768 || height >= 1024);
const isVerySmallScreen = height < 670;

const colors = {
  primary: "#59859C",
  secondary: "#53b9e5",
  accent: "#7C9CBF",
  gray_1: "#f8f9fa",
  gray_2: "#e9ecef",
  gray_3: "#b0b0b0",
  gray_4: "#6c757d",
  black: "#212529",
  white: "#ffffff",
  success: "#28a745",
  warning: "#ffc107",
  backdrop: "rgba(0, 0, 0, 0.1)",
};

const BREATH_SCREENS = [
  "BreathRelaxScreen",
  "BreathBellyScreen",
  "BreathBoxScreen",
  "BreathAlternateNostrilScreen",
];
const CURRENT_SCREEN_INDEX = 1; // BreathBellyScreen

// ─────────────────────────────────────────────────────────────────────────────
// 1) Helper to convert phase → instruction text
function getInstructionText(phase: string) {
  switch (phase) {
    case "Inhale Belly":
      return "breathe in belly";
    case "Inhale Chest":
      return "breathe in chest";
    case "Hold":
      return "hold";
    case "Exhale":
      return "breathe out";
    default:
      return "";
  }
}

const BreathBellyScreen = () => {
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const heartbeatIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const heartbeatTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isFocused = useIsFocused();

  // Phase durations
  const inhaleBellyDuration = 3;
  const inhaleChestDuration = 3;
  const holdPhaseDuration = 2;
  const exhalePhaseDuration = 8;
  const totalCycleDuration =
    inhaleBellyDuration +
    inhaleChestDuration +
    holdPhaseDuration +
    exhalePhaseDuration;

  const [cycles, setCycles] = useState(6);
  const [currentCycle, setCurrentCycle] = useState(0);
  const [phase, setPhase] = useState("Ready");
  const [count, setCount] = useState(inhaleBellyDuration);
  const [isRunning, setIsRunning] = useState(false);
  const hideControlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [showInstructionVolumeSlider, setShowInstructionVolumeSlider] =
    useState(false);
  const lastInstructionVolumeRef = useRef(0.7);
  const dispatch = useAppDispatch();

  // Keep awake ref
  const keepAwakeActiveRef = useRef(false);

  const cycleAnimationProgress = useSharedValue(0);
  const controlsOpacity = useSharedValue(1);
  const buttonScale = useSharedValue(1);

  const inhaleVibrationIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const inhaleVibrationTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const appState = useRef(AppState.currentState);
  const wasRunningBeforeBackground = useRef(false);
  const [showResume, setShowResume] = useState(false);

  const onSwipeLeft = () => {
    navigation.navigate("BreathRelaxScreen"); // Previous screen on drag right
  };

  const onSwipeRight = () => {
    navigation.navigate("BreathBoxScreen"); // Next screen on drag left
  };

  const panGesture = Gesture.Pan()
    .minDistance(15)
    .activeOffsetX([-5, 5])
    .onEnd((event) => {
      if (!isRunning) {
        if (event.velocityX < -200) {
          // Swipe right (drag left) goes to next screen
          runOnJS(onSwipeRight)();
        } else if (event.velocityX > 200) {
          // Swipe left (drag right) goes to previous screen
          runOnJS(onSwipeLeft)();
        }
      }
    });

  const startInhaleVibration = useCallback(() => {
    if (inhaleVibrationIntervalRef.current) {
      console.log("Inhale vibration already running.");
      return;
    }
    let durationMs = 0;
    if (phase === "Inhale Belly") {
      durationMs = inhaleBellyDuration * 1000;
    } else if (phase === "Inhale Chest") {
      durationMs = inhaleChestDuration * 1000;
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
  }, [phase, inhaleBellyDuration, inhaleChestDuration]);

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
      console.warn("setInstructionVolume not implemented in AudioContext", vol),
  } = useAudio();

  const fadeOutIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    trackScreenView("BreathBelly", "BreathBellyScreen");
    // Pause any playing audio when this screen is focused
    if (isFocused && isPlaying) {
      stop();
    }
  }, [isFocused, isPlaying, stop]);

  // Hide slider on tap, keep controls visible
  const handleScreenTap = () => {
    controlsOpacity.value = withSpring(1, { damping: 15, stiffness: 300 });
    if (hideControlsTimeoutRef.current) {
      clearTimeout(hideControlsTimeoutRef.current);
      hideControlsTimeoutRef.current = null;
    }
    if (showInstructionVolumeSlider) {
      setShowInstructionVolumeSlider(false);
    }
    if (isRunning && phase !== "Complete") {
      hideControlsTimeoutRef.current = setTimeout(() => {
        controlsOpacity.value = withTiming(0, { duration: 500 });
        setShowInstructionVolumeSlider(false);
        hideControlsTimeoutRef.current = null;
      }, 3000);
    }
  };

  // Toggle mute/unmute, always show slider
  const handleInstructionVolumeIconPress = () => {
    if (instructionVolume > 0) {
      lastInstructionVolumeRef.current = instructionVolume;
      setInstructionVolume(0);
    } else {
      setInstructionVolume(lastInstructionVolumeRef.current);
    }
    setShowInstructionVolumeSlider(true);
    handleScreenTap();
  };

  // Update current cycle/phase/count from Reanimated
  const updateState = (
    completedCycles: number,
    currentPhase: string,
    countdown: number
  ) => {
    setCurrentCycle(completedCycles);
    setPhase(currentPhase);
    setCount(countdown);
  };

  useDerivedValue(() => {
    "worklet";
    if (!isRunning) return null;

    const totalTimeInSeconds =
      cycleAnimationProgress.value * totalCycleDuration;
    const completedCycles = Math.floor(totalTimeInSeconds / totalCycleDuration);

    if (cycles > 0 && completedCycles >= cycles) {
      runOnJS(setIsRunning)(false);
      runOnJS(setPhase)("Complete");
      runOnJS(setCount)(0);
      runOnJS(setCurrentCycle)(cycles - 1);
    } else {
      const secondsInCycle =
        Math.floor(totalTimeInSeconds) % totalCycleDuration;
      let currentPhaseName = "Ready";
      let countdownValue = inhaleBellyDuration;

      if (secondsInCycle < inhaleBellyDuration) {
        currentPhaseName = "Inhale Belly";
        countdownValue = inhaleBellyDuration - secondsInCycle;
      } else if (secondsInCycle < inhaleBellyDuration + inhaleChestDuration) {
        currentPhaseName = "Inhale Chest";
        countdownValue =
          inhaleChestDuration - (secondsInCycle - inhaleBellyDuration);
      } else if (
        secondsInCycle <
        inhaleBellyDuration + inhaleChestDuration + holdPhaseDuration
      ) {
        currentPhaseName = "Hold";
        countdownValue =
          holdPhaseDuration -
          (secondsInCycle - inhaleBellyDuration - inhaleChestDuration);
      } else if (secondsInCycle < totalCycleDuration) {
        currentPhaseName = "Exhale";
        countdownValue =
          exhalePhaseDuration -
          (secondsInCycle -
            inhaleBellyDuration -
            inhaleChestDuration -
            holdPhaseDuration);
      } else {
        currentPhaseName = "Inhale Belly";
        countdownValue = inhaleBellyDuration;
      }

      countdownValue = Math.max(0, countdownValue);
      runOnJS(updateState)(completedCycles, currentPhaseName, countdownValue);
    }
    return null;
  }, [
    isRunning,
    cycles,
    totalCycleDuration,
    inhaleBellyDuration,
    inhaleChestDuration,
    holdPhaseDuration,
    exhalePhaseDuration,
  ]);

  // Animate the progress value
  useEffect(() => {
    if (isRunning) {
      activateKeepAwakeAsync().then(() => {
        keepAwakeActiveRef.current = true;
      });

      const animationTarget = cycles === 0 ? 1000 : cycles;
      const remainingCycles = animationTarget - cycleAnimationProgress.value;
      const animationDuration = Math.max(
        0,
        remainingCycles * totalCycleDuration * 1000
      );

      cycleAnimationProgress.value = withTiming(animationTarget, {
        duration: animationDuration,
        easing: Easing.linear,
      });

      if (hideControlsTimeoutRef.current) {
        clearTimeout(hideControlsTimeoutRef.current);
      }
      hideControlsTimeoutRef.current = setTimeout(() => {
        controlsOpacity.value = withTiming(0, { duration: 500 });
        setShowInstructionVolumeSlider(false);
        hideControlsTimeoutRef.current = null;
      }, 3000);
    } else {
      if (keepAwakeActiveRef.current) {
        deactivateKeepAwake().then(() => {
          keepAwakeActiveRef.current = false;
        });
      }
      controlsOpacity.value = withSpring(1, { damping: 15, stiffness: 300 });
      if (phase === "Complete" || phase === "Ready") {
        setShowInstructionVolumeSlider(false);
      }
      if (hideControlsTimeoutRef.current) {
        clearTimeout(hideControlsTimeoutRef.current);
        hideControlsTimeoutRef.current = null;
      }
    }
    return () => {
      if (hideControlsTimeoutRef.current) {
        clearTimeout(hideControlsTimeoutRef.current);
        hideControlsTimeoutRef.current = null;
      }
    };
  }, [isRunning, cycles]);

  // Reset logic
  useEffect(() => {
    if (!isRunning && phase !== "Complete") {
      setCurrentCycle(0);
      setPhase("Ready");
      setCount(inhaleBellyDuration);
      cycleAnimationProgress.value = 0;
    }
  }, [cycles, isRunning, phase, inhaleBellyDuration]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (fadeOutIntervalRef.current) {
        clearInterval(fadeOutIntervalRef.current);
        fadeOutIntervalRef.current = null;
      }
      if (hideControlsTimeoutRef.current) {
        clearTimeout(hideControlsTimeoutRef.current);
        hideControlsTimeoutRef.current = null;
      }
      stopHeartbeatVibration();
      stopInhaleVibration();
      if (heartbeatTimeoutRef.current) {
        clearTimeout(heartbeatTimeoutRef.current);
        heartbeatTimeoutRef.current = null;
      }
      if (inhaleVibrationIntervalRef.current) {
        clearInterval(inhaleVibrationIntervalRef.current);
        inhaleVibrationIntervalRef.current = null;
      }
      if (inhaleVibrationTimeoutRef.current) {
        clearTimeout(inhaleVibrationTimeoutRef.current);
        inhaleVibrationTimeoutRef.current = null;
      }
      if (keepAwakeActiveRef.current) {
        deactivateKeepAwake().then(() => {
          keepAwakeActiveRef.current = false;
        });
      }
    };
  }, [currentTrack, stop, stopInhaleVibration]);

  // Play instruction sounds & haptic
  useEffect(() => {
    if (
      isRunning &&
      phase !== "Ready" &&
      phase !== "Complete" &&
      phase !== "FadingOut"
    ) {
      switch (phase) {
        case "Inhale Belly":
        case "Inhale Chest":
          stopHeartbeatVibration();
          stopInhaleVibration();
          startInhaleVibration();
          playInstructionSound(inhaleInstructionTrack.url);
          break;
        case "Hold":
          console.log("Hold phase: Heartbeat vibration started.");
          stopInhaleVibration();
          stopHeartbeatVibration();
          startHeartbeatVibration();
          playInstructionSound(holdInstructionTrack.url);
          break;
        case "Exhale":
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

  const totalPracticeTimeText =
    cycles === 0 ? "Infinite" : `${totalCycleDuration * cycles} seconds`;

  const handleButtonPress = () => {
    buttonScale.value = withSequence(
      withSpring(0.95, { damping: 10, stiffness: 400 }),
      withSpring(1, { damping: 10, stiffness: 400 })
    );
    setShowResume(false);
    if (isRunning) {
      setIsRunning(false);
    } else if (phase === "Complete") {
      setCurrentCycle(0);
      setPhase("Ready");
      setCount(inhaleBellyDuration);
      cycleAnimationProgress.value = 0;
      setIsRunning(true);
    } else {
      cycleAnimationProgress.value = 0;
      setIsRunning(true);
    }
  };

  const handleIncrementCycles = () => {
    if (isRunning || phase === "Complete") return;
    if (cycles === 0) setCycles(1);
    else setCycles((prevCycles) => prevCycles + 1);
  };

  const handleDecrementCycles = () => {
    if (isRunning || phase === "Complete") return;
    if (cycles > 1) setCycles((prevCycles) => prevCycles - 1);
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

  // Phase‐progress for the circle
  useDerivedValue(() => {
    "worklet";
    if (!isRunning) return 0;
    const progressInCycle = cycleAnimationProgress.value % 1;
    const timeInCycle = progressInCycle * totalCycleDuration;

    if (phase === "Inhale Belly") {
      return Math.min(1, Math.max(0, timeInCycle / inhaleBellyDuration));
    } else if (phase === "Inhale Chest") {
      return Math.min(
        1,
        Math.max(0, (timeInCycle - inhaleBellyDuration) / inhaleChestDuration)
      );
    } else if (phase === "Hold") {
      return Math.min(
        1,
        Math.max(
          0,
          (timeInCycle - inhaleBellyDuration - inhaleChestDuration) /
            holdPhaseDuration
        )
      );
    } else if (phase === "Exhale") {
      return Math.min(
        1,
        Math.max(
          0,
          (timeInCycle -
            inhaleBellyDuration -
            inhaleChestDuration -
            holdPhaseDuration) /
            exhalePhaseDuration
        )
      );
    }
    return 0;
  }, [
    isRunning,
    cycleAnimationProgress,
    totalCycleDuration,
    inhaleBellyDuration,
    inhaleChestDuration,
    holdPhaseDuration,
    exhalePhaseDuration,
    phase,
  ]);

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
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (
        appState.current.match(/active/) &&
        nextAppState.match(/inactive|background/)
      ) {
        // App going to background
        if (isRunning) {
          wasRunningBeforeBackground.current = true;
          setIsRunning(false);
          stopInhaleVibration();
          stopHeartbeatVibration();
          stop();
        } else {
          wasRunningBeforeBackground.current = false;
        }
      } else if (
        appState.current.match(/inactive|background/) &&
        nextAppState === "active"
      ) {
        // App coming to foreground
        if (wasRunningBeforeBackground.current) {
          setShowResume(true);
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
  }, [isRunning, stopInhaleVibration, stopHeartbeatVibration, stop]);

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
            {/* Gold gradient background */}
            <LinearGradient
              colors={["#FFF8E1", "#FFECB3", "#FFE082", "#FFD54F"]}
              locations={[0, 0.3, 0.6, 0.9]}
              start={{ x: 0.1, y: 0 }}
              end={{ x: 0.9, y: 1 }}
              style={StyleSheet.absoluteFill}
              pointerEvents="none"
            />

            <StatusBar
              barStyle="dark-content"
              backgroundColor="transparent"
              translucent
            />

            {/* ─── HEADER ────────────────────────────────────────────── */}
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
                    color={colors.primary}
                  />
                </View>
              </TouchableOpacity>

              <View style={styles.headerMiddleSection}>
                <View style={styles.titleContainer}>
                  {!showInstructionVolumeSlider && (
                    <Text style={[styles.title, isiPAD && styles.titleIPad]}>
                      Belly Breathing
                    </Text>
                  )}
                  <TouchableOpacity
                    onPress={() =>
                      navigation.navigate("BellyTechniqueInfoScreen")
                    }
                    style={styles.titleInfoIconContainer}
                    activeOpacity={0.7}
                  >
                    <Ionicons
                      name="information-circle-outline"
                      size={isiPAD ? 32 : 24}
                      color={colors.primary}
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
                        const newVolume = Array.isArray(value)
                          ? value[0]
                          : value;
                        setInstructionVolume(newVolume);
                        if (newVolume > 0)
                          lastInstructionVolumeRef.current = newVolume;
                      }}
                      minimumTrackTintColor={colors.primary}
                      maximumTrackTintColor={colors.gray_3}
                      thumbTintColor={colors.primary}
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
                    color={colors.primary}
                  />
                </View>
              </TouchableOpacity>
            </Animated.View>

            {/* ─── STATUS BAR ─────────────────────────────────────────── */}
            <Animated.View style={[styles.statusBar, controlsAnimatedStyle]}>
              <View style={styles.statusItem}>
                <Text
                  style={[styles.statusLabel, isiPAD && styles.statusLabelIPad]}
                >
                  Cycle
                </Text>
                <Text
                  style={[styles.statusValue, isiPAD && styles.statusValueIPad]}
                >
                  {currentCycle + 1}
                  {cycles > 0 ? `/${cycles}` : ""}
                </Text>
              </View>

              <View
                style={[styles.phaseIndicator, { backgroundColor: "#ccb368" }]}
              >
                <Text
                  style={[
                    styles.phaseText,
                    isiPAD && styles.statusBarPhaseTextIPad,
                  ]}
                >
                  {isRunning
                    ? "6-2-8 BREATHING"
                    : typeof phase === "string"
                    ? phase.toUpperCase()
                    : ""}
                </Text>
              </View>

              <View style={styles.statusItem}>
                <Text
                  style={[styles.statusLabel, isiPAD && styles.statusLabelIPad]}
                >
                  Count
                </Text>
                <Text
                  style={[styles.statusValue, isiPAD && styles.statusValueIPad]}
                >
                  {Math.ceil(count)}
                </Text>
              </View>
            </Animated.View>

            {/* ─── CIRCLE + SWIPE + INDICATOR/INSTRUCTION ────────────────── */}
            <View style={styles.circleArea}>
              <View style={styles.circleContainer}>
                <BreathBellyCircle
                  phase={phase}
                  count={count}
                  isRunning={isRunning}
                  animationProgress={cycleAnimationProgress}
                  inhaleBellyDuration={inhaleBellyDuration}
                  inhaleChestDuration={inhaleChestDuration}
                  holdDuration={holdPhaseDuration}
                  exhaleDuration={exhalePhaseDuration}
                />
              </View>

              {/* Arrows for navigation */}
              {!isRunning && (
                <TouchableOpacity
                  style={[styles.arrowButton, styles.arrowLeft]}
                  onPress={onSwipeLeft}
                  activeOpacity={0.7}
                >
                  <Ionicons
                    name="chevron-back-outline"
                    size={isiPAD ? 30 : 20}
                    color={colors.primary}
                  />
                </TouchableOpacity>
              )}
              {!isRunning && (
                <TouchableOpacity
                  style={[styles.arrowButton, styles.arrowRight]}
                  onPress={onSwipeRight}
                  activeOpacity={0.7}
                >
                  <Ionicons
                    name="chevron-forward-outline"
                    size={isiPAD ? 30 : 20}
                    color={colors.primary}
                  />
                </TouchableOpacity>
              )}

              {/* Screen indicator dots */}
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
              </View>
            </View>

            {/* ─── CONTROLS (Cycles / Duration / Start) ──────────────── */}
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
                          (isRunning || phase === "Complete" || cycles === 0) &&
                            styles.cycleControlButtoDisabled,
                          Platform.OS === "ios" &&
                            isVerySmallScreen &&
                            styles.cycleControlButtonSmallScreen,
                          isiPAD && styles.cycleControlButtonIPad,
                        ]}
                        onPress={handleDecrementCycles}
                        disabled={
                          isRunning || phase === "Complete" || cycles === 0
                        }
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
                            isRunning || phase === "Complete" || cycles === 0
                              ? colors.gray_3
                              : colors.primary
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
                          (isRunning || phase === "Complete") &&
                            styles.cycleControlButtoDisabled,
                          Platform.OS === "ios" &&
                            isVerySmallScreen &&
                            styles.cycleControlButtonSmallScreen,
                          isiPAD && styles.cycleControlButtonIPad,
                        ]}
                        onPress={handleIncrementCycles}
                        disabled={isRunning || phase === "Complete"}
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
                            isRunning || phase === "Complete"
                              ? colors.gray_3
                              : colors.primary
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
                          ? [colors.gray_4, colors.gray_3]
                          : ["#c29d27", "#c29d27"]
                      }
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.button}
                    >
                      <Ionicons
                        name={
                          isRunning
                            ? "stop"
                            : phase === "Complete"
                            ? "refresh"
                            : showResume
                            ? "play"
                            : "play"
                        }
                        size={24}
                        color={colors.white}
                        style={styles.buttonIcon}
                      />
                      <Text style={styles.buttonText}>
                        {isRunning
                          ? "Stop"
                          : phase === "Complete"
                          ? "Start Again"
                          : showResume
                          ? "Resume"
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
  container: { flex: 1, backgroundColor: colors.white },

  // ─── HEADER ──────────────────────────────────────────────────────
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
    paddingHorizontal: 20,
    paddingTop: isiPAD ? 80 : 60,
    paddingBottom: 20,
    zIndex: 10,
  },
  headerIconButton: {},
  iconButtonContainer: {
    width: isiPAD ? 48 : 40,
    height: isiPAD ? 48 : 40,
    borderRadius: isiPAD ? 24 : 20,
    backgroundColor: colors.gray_1,
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
  titleInfoIconContainer: { marginRight: 8, padding: 4 },
  title: {
    fontSize: isiPAD ? 36 : 28,
    fontWeight: "bold",
    color: colors.primary,
    fontFamily: "Quattrocento",
    marginBottom: 4,
    textAlign: "center",
  },
  titleIPad: { fontSize: 40 },
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
    backgroundColor: colors.primary,
  },

  // ─── STATUS BAR ────────────────────────────────────────────────────
  statusBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginHorizontal: 20,
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: colors.white,
    borderRadius: 16,
    marginBottom: 16,
  },
  statusItem: { alignItems: "center" },
  statusLabel: {
    fontSize: isiPAD ? 14 : 12,
    color: colors.black,
    fontFamily: "Quattrocento",
    marginBottom: 4,
  },
  statusLabelIPad: { fontSize: 18 },
  statusValue: {
    fontSize: isiPAD ? 20 : 16,
    fontWeight: "bold",
    color: colors.black,
    fontFamily: "Quattrocento",
  },
  statusValueIPad: { fontSize: 24 },
  phaseIndicator: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    minWidth: 80,
    alignItems: "center",
  },
  phaseText: {
    fontSize: isiPAD ? 14 : 12,
    fontWeight: "bold",
    color: colors.white,
    fontFamily: "Quattrocento",
  },
  statusBarPhaseTextIPad: { fontSize: 18 },

  // ─── CIRCLE + ARROWS + INDICATOR/TEXT ─────────────────────────────
  circleArea: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
    marginBottom: isiPAD ? -10 : -10, // Match BoxScreen
    position: "relative",
    // marginTop: 32, // Ensure this is consistent with BoxScreen or handled by overall screen padding
  },
  circleContainer: {
    justifyContent: "center",
    alignItems: "center",
    height: 340, // Match BoxScreen
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
  arrowRight: {
    right: isiPAD ? 45 : 16,
  },

  phaseTextOrIndicatorWrapper: {
    marginTop: hp(isiPAD ? 2 : -6),
    minHeight: isiPAD ? 40 : 28,
    alignItems: "center",
    justifyContent: "center",
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
    backgroundColor: colors.primary,
  },
  screenIndicatorDotInactive: {
    backgroundColor: colors.gray_3,
    opacity: 0.5,
  },

  // ─── CONTROLS (Cycles / Duration / Start) ────────────────────────────
  controlsWrapper: { paddingBottom: isiPAD ? 40 : 30 },
  controlsContainer: { paddingHorizontal: 20 },
  inputCard: {
    backgroundColor: colors.white,
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
    color: colors.black,
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
    backgroundColor: colors.gray_1,
    marginHorizontal: 8,
  },
  cycleControlButtonSmallScreen: { padding: 6, marginHorizontal: 6 },
  cycleControlButtonIPad: {
    padding: isiPAD ? 12 : 8,
    marginHorizontal: isiPAD ? 10 : 8,
  },
  cycleControlButtoDisabled: {
    backgroundColor: colors.gray_2,
    borderColor: colors.gray_3,
  },
  cycleCountText: {
    fontSize: isiPAD ? 20 : 18,
    fontWeight: "600",
    color: colors.black,
    fontFamily: "Quattrocento",
    minWidth: isiPAD ? 60 : 40,
    textAlign: "center",
  },
  cycleCountTextSmallScreen: { fontSize: 16, minWidth: 35 },
  cycleCountTextIPad: {
    fontSize: isiPAD ? 24 : 18,
    minWidth: isiPAD ? 60 : 40,
  },
  separator: { height: 1, backgroundColor: colors.gray_2, marginVertical: 12 },
  separatorSmallScreen: { marginVertical: 8 },
  separatorIPad: { marginVertical: isiPAD ? 15 : 12 },
  timeText: {
    fontSize: isiPAD ? 18 : 16,
    fontWeight: "600",
    color: colors.primary,
    fontFamily: "Quattrocento",
  },
  timeTextSmallScreen: { fontSize: 14 },
  timeTextIPad: { fontSize: isiPAD ? 22 : 16 },
  buttonContainer: { alignItems: "center", marginBottom: 5 },
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
  buttonIcon: { marginRight: 10 },
  buttonText: {
    color: colors.white,
    fontSize: isiPAD ? 27 : 14,
    fontWeight: "bold",
    fontFamily: "Quattrocento",
  },
});

export default BreathBellyScreen;
