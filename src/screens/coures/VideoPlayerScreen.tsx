import React, { useState, useEffect } from "react";
import { View, StyleSheet, ActivityIndicator, Dimensions } from "react-native";
import { RouteProp, useNavigation } from "@react-navigation/native";
import { WebView } from "react-native-webview";
import * as ScreenOrientation from "expo-screen-orientation";
import { VideoPlayerV } from "../../components/BufferPlayerVideo";
import { usePreventScreenCapture } from "expo-screen-capture";
import BackButton from "../../components/BackButton";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { FocusAwareStatusBar } from "../../components/FocusAwareStatusBar";
import { useAudio } from "../../context/AudioContext";
import { colors } from "@/src/utils/colors";
import { RootStackParamList } from "@/src/navigation/NavigationType";
import { useCoursesComplete, useUpdateCoursesProgress } from "@/src/api/query/CouresService";
import { useAppSelector } from "@/src/redux/StateType";
import { trackScreenView } from "@/src/utils/analytics";

type VideoPlayerScreenRouteProp = RouteProp<RootStackParamList, "VideoPlayer">;

interface VideoPlayerScreenProps {
  route: VideoPlayerScreenRouteProp;
}

const getEmbeddableYoutubeUrl = (videoUrl: string) => {
  let videoId;

  if (videoUrl.includes("youtube.com/watch?v=")) {
    videoId = videoUrl.split("v=")[1];
  } else if (videoUrl.includes("youtu.be/")) {
    videoId = videoUrl.split("youtu.be/")[1];
  } else if (videoUrl.includes("youtube.com/embed/")) {
    return videoUrl;
  }

  if (videoId && videoId.includes("&")) {
    videoId = videoId.split("&")[0];
  }
  return videoId;
};

const VideoPlayerScreen: React.FC<VideoPlayerScreenProps> = ({ route }) => {
  usePreventScreenCapture();
  const { userData } = useAppSelector((state) => state.auth);
  const { videoUrl, fromYoutube, title, courseId, lessonsId, sectionId } =
    route.params;
  const { top } = useSafeAreaInsets();
  const { stop } = useAudio();
  const [currentTime, setCurrentTime] = useState(0);
  const updateCoursesProgress = useUpdateCoursesProgress();
  const navgation = useNavigation();
  const coursesComplete = useCoursesComplete();

  useEffect(() => {
    trackScreenView("VideoPlayer", "VideoPlayerScreen");
    stop();
  }, []);

  useEffect(() => {
    const lockToPortrait = async () => {
      await ScreenOrientation.lockAsync(
        ScreenOrientation.OrientationLock.PORTRAIT_UP
      );
    };
    lockToPortrait();

    return () => {
      ScreenOrientation.unlockAsync();
    };
  }, []);

  const screenWidth = Dimensions.get("window").width;
  const screenHeight = Dimensions.get("window").height;

  const html = `
  <html>
    <head>
      <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=0">
      <style>
        body, html {
          margin: 0;
          padding: 0;
          background-color: black;
          height: 100%;
          width: 100%;
          display: flex;
          justify-content: center;
          align-items: center;
        }
        #player {
          width: 100vw;
          height: 56.25vw;
          max-height: 100vh;
          max-width: 100%;
        }
      </style>
    </head>
    <body>
      <div id="player"></div>
      <script>
        var tag = document.createElement('script');
        tag.src = "https://www.youtube.com/iframe_api";
        var firstScriptTag = document.getElementsByTagName('script')[0];
        firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
  
        var player;
        function onYouTubeIframeAPIReady() {
          player = new YT.Player('player', {
            videoId: '${getEmbeddableYoutubeUrl(videoUrl)}',
            events: {
              'onReady': onPlayerReady,
              'onStateChange': onPlayerStateChange
            },
            playerVars: {
              'autoplay': 1,
              'controls': 1,
              'rel': 0,
              'modestbranding': 1
            }
          });
        }
  
        function onPlayerReady(event) {
          event.target.playVideo();
        }
  
        function onPlayerStateChange(event) {
          if (event.data == YT.PlayerState.PLAYING) {
    setInterval(function() {
      var currentTime = player.getCurrentTime();
      window.ReactNativeWebView.postMessage(JSON.stringify({ currentTime: currentTime }));
    }, 1000);
  } else if (event.data == YT.PlayerState.ENDED) {
    window.ReactNativeWebView.postMessage(JSON.stringify({ videoEnded: true }));
  }
        }
      </script>
    </body>
  </html>
  `;

  const onMessage = (event: { nativeEvent: { data: string } }) => {
    const data = JSON.parse(event.nativeEvent.data);
    setCurrentTime(Math.round(data.currentTime));
    if (data.videoEnded) {
      handleCoursesComplete()
    }
  };

  const handleBack = async () => {
    try {
      await updateCoursesProgress.mutateAsync({
        coursesId: courseId,
        lessonsId: lessonsId,
        sectionsId: sectionId,
        token: userData?.token,
        watchTimeInSeconds: currentTime * 100,
      });
      navgation.goBack();
    } catch (error) {
      console.log("handleUpdateProgresss===>", error);
    }
  };

  const handleCoursesComplete = async() => {
    try {
       await coursesComplete.mutateAsync({
       coursesId: courseId,
        lessonsId: lessonsId,
        sectionsId: sectionId,
        token: userData?.token,
      })
    } catch (error) {
        console.log('handleUpdateProgresss===>', error)
    }
  }

  return (
    <View style={[styles.container, { paddingTop: top }]}>
      <FocusAwareStatusBar
        barStyle={"light-content"}
        translucent
        backgroundColor={"transparent"}
      />
      {fromYoutube && (
        <BackButton buttonStyle={{ marginTop: top }} onClick={handleBack} />
      )}
      {fromYoutube ? (
        <>
          <WebView
            source={{ html }}
            style={{
              width: screenWidth,
              height: screenHeight,
            }}
            startInLoadingState={true}
            javaScriptEnabled={true}
            onMessage={onMessage}
            mediaPlaybackRequiresUserAction={true}
            allowsFullscreenVideo={true}
            renderLoading={() => (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={colors.white} />
              </View>
            )}
          />
        </>
      ) : (
        <VideoPlayerV videoUrl={videoUrl} title={title} />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.black,
    justifyContent: "center",
  },
  loadingContainer: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "black",
  },
});

export default VideoPlayerScreen;
