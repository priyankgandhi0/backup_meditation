import {
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Animated,
  Easing,
} from "react-native";
import React, { useEffect, useRef } from "react";
import { AntDesign, Ionicons } from "@expo/vector-icons";
import { hp, wp, isiPAD } from "../../../helper/Responsive";
import { useAudio } from "../../../context/AudioContext";
import { playerActions } from "../../../redux/slice/PlayerSlice";
import { useAppDispatch, useAppSelector } from "../../../redux/StateType";
import FastImage from "react-native-fast-image";
import { colors } from "@/src/utils/colors";
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';

const BottomMusicPlayer = ({ onPress }: { onPress: () => void }) => {
  const dispatch = useAppDispatch();
  const { music } = useAppSelector((state) => state.player);

  const { currentTrack, isPlaying, playPause, position, stop } = useAudio();

  // Animation references
  const slideAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const shimmerAnim = useRef(new Animated.Value(0)).current;
  // Removed pulseAnim

  // Initialize entrance animation
  useEffect(() => {
    Animated.spring(slideAnim, {
      toValue: 1,
      useNativeDriver: true,
      tension: 50,
      friction: 8,
    }).start();

    // Shimmer effect animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerAnim, {
          toValue: 1,
          duration: 2000,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
        Animated.timing(shimmerAnim, {
          toValue: 0,
          duration: 2000,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  // Rotation animation for playing state
  useEffect(() => {
    if (isPlaying) {
      Animated.loop(
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: 10000,
          easing: Easing.linear,
          useNativeDriver: true,
        })
      ).start();
    } else {
      rotateAnim.stopAnimation();
    }
  }, [isPlaying]);

  const handleClosePlayer = () => {
    Animated.spring(slideAnim, {
      toValue: 0,
      useNativeDriver: true,
      tension: 80,
      friction: 10,
    }).start(() => {
      stop();
      dispatch(playerActions.setIsPlayerContinue(false));
    });
  };

  const handlePress = () => {
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
    onPress();
  };

  const handlePlayPause = () => {
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.9,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
    playPause();
  };

  const isChakras = music?.root === "Chakras";

  function formatTime(secondsInput: number) {
    const totalSeconds = Math.floor(secondsInput);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    const paddedMinutes = minutes.toString().padStart(2, '0');
    const paddedSeconds = seconds.toString().padStart(2, '0');
    return `${paddedMinutes}:${paddedSeconds}`;
  }

  const rotation = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const shimmerTranslate = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-100, 100],
  });

  return (
    <Animated.View 
      style={[
        styles.bottomPlayerView,
        {
          transform: [
            { 
              translateY: slideAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [100, 0],
              })
            },
            { scale: scaleAnim }
          ],
        }
      ]}
    >
      {/* Glassmorphism Background */}
      <BlurView intensity={80} tint="dark" style={StyleSheet.absoluteFillObject} />
      
      {/* Gradient Overlay */}
      <LinearGradient
        colors={['rgba(255,255,255,0.1)', 'rgba(255,255,255,0.05)', 'rgba(0,0,0,0.1)']}
        style={StyleSheet.absoluteFillObject}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />

      {/* Shimmer Effect */}
      <Animated.View
        style={[
          styles.shimmerEffect,
          {
            transform: [{ translateX: shimmerTranslate }],
          },
        ]}
      />

      {/* Main Content */}
      <Pressable style={styles.playerRowView} onPress={handlePress}>
        <View style={styles.imageContainer}>
          <Animated.View
            style={[
              styles.imageWrapper,
              {
                transform: [{ rotate: isChakras && isPlaying ? rotation : '0deg' }],
              },
            ]}
          >
            <FastImage
              source={{ uri: currentTrack?.image }}
              style={[
                styles.albumImage,
                {
                  width: wp(isChakras ? 10 : 8),
                  height: wp(isChakras ? 10 : 8),
                  borderRadius: isChakras ? 15 : 8,
                }
              ]}
              resizeMode={isChakras ? "cover" : "contain"}
            />
          </Animated.View>
          
          {/* Glow effect for playing state */}
          {isPlaying && (
            <View 
              style={[
                styles.glowEffect,
                {
                  width: wp(isChakras ? 12 : 10),
                  height: wp(isChakras ? 12 : 10),
                  borderRadius: isChakras ? 18 : 10,
                }
              ]} 
            />
          )}
        </View>

        <View style={styles.textView}>
          <Text style={styles.title} numberOfLines={2}>
            {currentTrack?.title}
          </Text>
          <View style={styles.timeContainer}>
            <View style={styles.progressDot} />
            <Text style={styles.time}>{formatTime(position)}</Text>
          </View>
        </View>
      </Pressable>

      <View style={styles.rightButton}>
        <TouchableOpacity 
          onPress={handlePlayPause} 
          style={[styles.playButton, isPlaying && styles.playingButton]}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={isPlaying ? ['#4c7f9c', '#A0CFFF'] : ['#A0CFFF', '#A0CFFF']}
            style={styles.playButtonGradient}
          >
            <Ionicons
              name={isPlaying ? "pause" : "play"}
              size={isiPAD ? 32 : 24}
              color={colors.white}
              style={{ marginLeft: isPlaying ? 0 : 2 }}
            />
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity 
          onPress={handleClosePlayer}
          style={styles.closeButton}
          activeOpacity={0.7}
        >
          <View style={styles.closeButtonBackground}>
            <AntDesign name="close" size={20} color={colors.white} />
          </View>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
};

export default BottomMusicPlayer;

const styles = StyleSheet.create({
  bottomPlayerView: {
    height: hp(8),
    paddingHorizontal: wp(4),
    paddingVertical: wp(2),
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    position: "absolute",
    bottom: Platform.OS === "android" ? 70 : 80,
    zIndex: 2,
    width: wp(97),
    marginHorizontal: wp(1),
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 12,
    overflow: 'hidden',
  },
  shimmerEffect: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255,255,255,0.1)',
    width: 100,
  },
  rightButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: wp(3),
  },
  playButton: {
    width: isiPAD ? wp(10) : wp(12),
    height: isiPAD ? wp(10) : wp(12),
    borderRadius: isiPAD ? wp(5) : wp(6),
    overflow: 'hidden',
    shadowColor: "#FF6B6B",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  playingButton: {
    shadowColor: "#FF6B6B",
    shadowOpacity: 0.6,
  },
  playButtonGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: isiPAD ? wp(5) : wp(6),
  },
  closeButton: {
    width: wp(10),
    height: wp(10),
    borderRadius: wp(5),
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonBackground: {
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: wp(5),
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  playerRowView: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  imageContainer: {
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageWrapper: {
    borderRadius: 15,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 2,
  },
  albumImage: {
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  glowEffect: {
    position: 'absolute',
    backgroundColor: 'rgba(255,107,107,0.3)',
    zIndex: 1,
    opacity: 0.6,
  },
  textView: {
    marginLeft: wp(4),
    flex: 1,
  },
  title: {
    color: colors.white,
    fontWeight: "700",
    fontSize: wp(4),
    letterSpacing: 0.5,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: wp(1),
  },
  progressDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FF6B6B',
    marginRight: wp(2),
    shadowColor: "#FF6B6B",
    shadowOffset: {
      width: 0,
      height: 0,
    },
    shadowOpacity: 0.8,
    shadowRadius: 4,
    elevation: 4,
  },
  time: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: wp(3.2),
    fontWeight: '500',
    letterSpacing: 0.5,
  },
});