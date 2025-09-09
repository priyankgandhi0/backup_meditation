import React, { useState, useEffect, useRef } from "react";
import {
  StyleSheet,
  View,
  TouchableOpacity,
  Image,
  Text,
  Pressable,
  ActivityIndicator,
  AppState,
} from "react-native";
import { Video, ResizeMode } from "expo-av";
import * as ScreenOrientation from "expo-screen-orientation";
import {
  RouteProp,
  useIsFocused,
  useNavigation,
  useRoute,
} from "@react-navigation/native";
import { hp, RFValue, wp } from "../helper/Responsive";
import { Slider } from "@miblanchard/react-native-slider";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { activateKeepAwakeAsync, deactivateKeepAwake } from "expo-keep-awake";
import { VideoPlayerProps } from "../interface/Types";
import {
  useCoursesComplete,
  useUpdateCoursesProgress,
} from "../api/query/CouresService";
import { RootStackParamList } from "../navigation/NavigationType";
import { useAppSelector } from "../redux/StateType";
import { FocusAwareStatusBar } from "./FocusAwareStatusBar";

export const VideoPlayerV = ({ videoUrl, title }: VideoPlayerProps) => {
  const { userData } = useAppSelector((state) => state.auth);
  const [clicked, setClicked] = useState(false);
  const [puased, setPaused] = useState(false);
  const [progress, setProgress] = useState<any>({
    currentTime: 0,
    seekableDuration: 0,
    duration: 0,
  });
  const [isLandscape, setIsLandscape] = useState(false);
  const [mute, setMute] = useState(false);
  const ref = useRef<Video>(null);
  const isFoused = useIsFocused();
  const navigation = useNavigation();
  const [isSeeking, setIsSeeking] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [playbackStatus, setPlaybackStatus] = useState(false);
  const appState = useRef(AppState.currentState);
  const updateCoursesProgress = useUpdateCoursesProgress();
  const coursesComplete = useCoursesComplete();
  const routes = useRoute<RouteProp<RootStackParamList, "VideoPlayer">>();
  const [isVideoCompleted, setIsVideoCompleted] = useState(false);

  useEffect(() => {
    const subscription = AppState.addEventListener("change", (nextAppState) => {
      if (
        appState.current.match(/inactive|background/) &&
        nextAppState === "active"
      ) {
        ref.current?.playAsync();
        console.log("App has come to the foreground!");
      } else {
        ref.current?.pauseAsync();
      }

      appState.current = nextAppState;
    });

    return () => {
      subscription.remove();
    };
  }, []);

  useEffect(() => {
    const enableKeepAwake = async () => {
      await activateKeepAwakeAsync();
    };
    if (playbackStatus) {
      enableKeepAwake();
    } else {
      deactivateKeepAwake();
    }
  }, [playbackStatus]);

  const format = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
      .toString()
      .padStart(2, "0");
    const secs = Math.floor(seconds % 60)
      .toString()
      .padStart(2, "0");
    return `${mins}:${secs}`;
  };

  useEffect(() => {
    return () => {
      // Reset to portrait mode on unmount
      ScreenOrientation.lockAsync(
        ScreenOrientation.OrientationLock.PORTRAIT_UP
      );
    };
  }, [isFoused]);

  useEffect(() => {
    if (isFoused == false) {
      setPaused(true);
    }
  }, [isFoused]);

  useEffect(() => {
    if (puased) {
      if (routes?.params?.completed === false) {
        handleUpdateProgresss();
      }
    }
  }, [puased]);

  useEffect(() => {
    if (clicked) {
      setTimeout(() => {
        setClicked(false);
      }, 2000);
    }
  }, [clicked]);

  const onPlaybackStatusUpdate = (status: any) => {
    let almostMost = status.durationMillis * 0.8;

    if (status.positionMillis >= almostMost && !isVideoCompleted) {
      handleCoursesComplete();
    }

    setPlaybackStatus(status.isPlaying);
    if (
      status.didJustFinish &&
      routes?.params?.completed === false &&
      !isVideoCompleted
    ) {
      handleCoursesComplete();
    }
    if (status.isLoaded) {
      setIsLoading(false);
      setProgress({
        currentTime: status.positionMillis / 1000,
        seekableDuration: status.durationMillis / 1000,
        duration: status.durationMillis / 1000,
      });
    } else {
      setIsLoading(true);
    }
  };

  const handleSkip = (direction: number) => {
    const newTime = progress.currentTime + direction * 10; // Skip by 10 seconds
    const seekTime = Math.max(0, Math.min(newTime, progress.duration)); // Clamp value between 0 and duration
    ref.current?.setPositionAsync(seekTime * 1000); // Convert to milliseconds for seek method
  };

  const toggleVideoOrientation = async () => {
    if (!isLandscape) {
      await ScreenOrientation.lockAsync(
        ScreenOrientation.OrientationLock.LANDSCAPE
      );
      setIsLandscape(true);
    } else {
      await ScreenOrientation.lockAsync(
        ScreenOrientation.OrientationLock.PORTRAIT_UP
      );
      setIsLandscape(false);
    }
  };

  const handleSeek = async (newTime: number) => {
    if (isSeeking) {
      console.warn("Seeking is already in progress, ignoring.");
      return; // Prevent overlapping seeks
    }
    setClicked(false);
    setIsSeeking(true); // Indicate a seek is in progress
    try {
      await ref.current?.setPositionAsync(newTime * 1000); // Perform the seek
    } catch (error) {
      console.error("Seek error:", error); // Log the error
    } finally {
      setTimeout(() => {
        setIsSeeking(false);
      }, 800);
    }
  };

  const handleUpdateProgresss = async () => {
    try {
      await updateCoursesProgress.mutateAsync({
        coursesId: routes?.params?.courseId,
        lessonsId: routes?.params?.lessonsId,
        sectionsId: routes?.params?.sectionId,
        token: userData?.token,
        watchTimeInSeconds: progress?.currentTime * 100,
      });
    } catch (error) {
      console.log("handleUpdateProgresss===>", error);
    }
  };

  const handleCoursesComplete = async () => {
    try {
      setIsVideoCompleted(true);
      await coursesComplete.mutateAsync({
        coursesId: routes?.params?.courseId,
        lessonsId: routes?.params?.lessonsId,
        sectionsId: routes?.params?.sectionId,
        token: userData?.token,
      });
    } catch (error) {
      console.log("handleUpdateProgresss->>>===>", error);
      setIsVideoCompleted(false);
    }
  };

  return (
    <View style={{ flex: 1 }}>
      <FocusAwareStatusBar
        barStyle="light-content"
        translucent
        backgroundColor="transparent"
      />
      <Pressable
        style={{ flex: 1 }}
        disabled={isSeeking}
        onPress={() => {
          setClicked(!clicked);
        }}
      >
        <Video
          ref={ref}
          shouldPlay={!puased}
          source={{ uri: videoUrl }}
          onPlaybackStatusUpdate={onPlaybackStatusUpdate}
          isMuted={mute}
          style={{ flex: 1 }}
          resizeMode={ResizeMode.CONTAIN}
        />
        {isSeeking && (
          <View style={styles.mainView}>
            <ActivityIndicator size="small" color="#fff" />
          </View>
        )}
        {clicked && (
          <TouchableOpacity style={styles.mainView}>
            <View style={styles.headerView}>
              <TouchableOpacity onPress={() => handleSkip(-1)}>
                <Image
                  source={require("../assets/videoControlr/backward.png")}
                  tintColor={"#fff"}
                  style={styles.backward}
                />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => {
                  setPaused(!puased);
                }}
              >
                <Image
                  source={
                    puased
                      ? require("../assets/videoControlr/play-button.png")
                      : require("../assets/videoControlr/pause.png")
                  }
                  style={styles.play}
                />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => handleSkip(1)}>
                <Image
                  source={require("../assets/videoControlr/forward.png")}
                  style={styles.forward}
                />
              </TouchableOpacity>
            </View>
            <View style={styles.timerView}>
              <Text style={styles.currentTime}>
                {format(progress?.currentTime)}
              </Text>
              <Slider
                value={progress?.currentTime}
                containerStyle={{ width: "80%" }}
                minimumValue={0}
                maximumValue={progress?.seekableDuration || 0}
                minimumTrackTintColor="red"
                maximumTrackTintColor="#fff"
                thumbTintColor="#fff"
                onValueChange={(value) => {
                  setProgress((prev: any) => ({
                    ...prev,
                    currentTime: value[0],
                  }));
                }}
                onSlidingComplete={(value) => handleSeek(value[0])}
              />
              <Text style={styles.seekableDuration}>
                {format(progress?.seekableDuration || 0)}
              </Text>
            </View>
            <View
              style={{
                position: "absolute",
                top: 0,
              }}
            >
              <Text style={styles.title}>{title}</Text>
              <View style={styles.topHeader}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                  <MaterialCommunityIcons
                    name="keyboard-backspace"
                    size={28}
                    color="white"
                  />
                </TouchableOpacity>
                <View style={styles.headerView}>
                  <TouchableOpacity
                    onPress={toggleVideoOrientation}
                    style={styles.portraitButton}
                  >
                    <Ionicons
                      name={
                        isLandscape
                          ? "phone-portrait-outline"
                          : "phone-landscape-outline"
                      }
                      size={24}
                      color="white"
                    />
                    <Text style={styles.portraitText}>
                      {isLandscape ? "Portrait" : "Landscape"}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity onPress={() => setMute(!mute)}>
                    <Image
                      source={
                        !mute
                          ? require("../assets/videoControlr/medium-volume.png")
                          : require("../assets/videoControlr/mute.png")
                      }
                      style={styles.volume}
                    />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </TouchableOpacity>
        )}
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  video: {
    flex: 1,
  },
  bufferingContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    zIndex: 1,
  },
  errorContainer: {
    position: "absolute",
    top: "50%",
    width: "100%",
    zIndex: 2,
  },
  title: {
    color: "#fff",
    fontSize: RFValue(14),
    marginHorizontal: wp(5),
  },
  mainView: {
    width: "100%",
    height: "100%",
    position: "absolute",
    backgroundColor: "rgba(0,0,0,.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  headerView: {
    flexDirection: "row",
    alignItems: "center",
  },
  backward: {
    width: 40,
    height: 40,
    tintColor: "white",
  },
  play: {
    width: 50,
    height: 50,
    tintColor: "white",
    marginLeft: 50,
  },
  forward: {
    width: 40,
    height: 40,
    tintColor: "white",
    marginLeft: 50,
  },
  timerView: {
    width: "100%",
    flexDirection: "row",
    justifyContent: "space-between",
    position: "absolute",
    bottom: hp(2),
    paddingHorizontal: 20,
    alignItems: "center",
  },
  currentTime: {
    color: "white",
    width: "12%",
  },
  seekableDuration: {
    color: "white",
    width: "15%",
  },
  topHeader: {
    width: "100%",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: hp(2),
    paddingHorizontal: 20,
  },
  portraitButton: {
    alignItems: "center",
    marginRight: wp(5),
  },
  portraitText: {
    color: "white",
    fontSize: 10,
  },
  volume: {
    width: 24,
    height: 24,
    tintColor: "white",
  },
});
