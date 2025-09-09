import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import React from "react";
import { Dimensions, View, Pressable } from "react-native";
import { convertMusicTrackToTrack } from "../../../utils/trackConverter";
import { StackNavigationProp } from "@react-navigation/stack";
import { RootStackParamList } from "../../../navigation/NavigationType";
import ThemeText from "../../shared/theme-text";
import FastImage from "react-native-fast-image";
import { useDispatch } from "react-redux";
import { playerActions } from "../../../redux/slice/PlayerSlice";
import { useAudio } from "../../../context/AudioContext";
import { useAudioEffects } from "@/src/context/AudioEffectsContext";
import { ImagePath } from "@/src/utils/ImagePath";
import { colors } from "@/src/utils/colors";
import { homeCardStyles } from "@/src/styles/card-home.styles";
import { CardChakrasTrackHomeProps } from "@/src/interface/Types";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from "react-native-reanimated";
import { trackMusicAccess } from "../../../utils/analytics";
import AnimatedPressble from "../../AnimatedPressble";

const CardChakrasTrackHome = ({
  item,
  isAuthenticated,
  isPremium,
  index,
  onPress,
}: CardChakrasTrackHomeProps) => {
  const { width } = Dimensions.get("window");
  const isTablet = width >= 768;
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const cardWidth = width * 0.37;
  const canInteract = isPremium;
  const { loadTrack } = useAudio();
  const dispatch = useDispatch();
  const { stopSound } = useAudioEffects();

  // Create a shared value for scaling
  const scale = useSharedValue(1);
  // Create animated style
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handleTrackPress = (track: any) => {
    if (Object.keys(item).length === 0) {
      navigation.navigate("AboutChakraScreen");
    } else {
      if (!isAuthenticated && canInteract === false && index != 1) {
        navigation.navigate("Login");
      } else {
        if (
          canInteract ||
          (isAuthenticated && canInteract === false && index == 1) ||
          (!isAuthenticated && canInteract === false && index == 1)
        ) {
          trackMusicAccess("ACCESS_CHAKRA_MUSIC", {
            trackId: track._id,
            trackName: track.name,
            isPremium: track.isPremium,
            hasAccess: canInteract,
          });
          stopSound();
          const convertedTrack = convertMusicTrackToTrack(track);
          loadTrack(convertedTrack, "Chakras");
          dispatch(
            playerActions.setMusic({
              isBack: true,
              isFrequency: false,
              screen: "Home",
              root: "Chakras",
              track: convertedTrack,
            })
          );
          dispatch(playerActions.setIsPlayerContinue(true));
          navigation.navigate("Player", {
            isBack: true,
            isFrequency: false,
            screen: "Home",
            root: "Chakras",
          });
        } else {
          navigation.navigate("Subscription");
        }
      }
    }
  };

  return (
    <AnimatedPressble
      onPress={() => {
        handleTrackPress(item);
        onPress();
      }}
    >
      <FastImage
        source={
          Object.keys(item).length === 0
            ? ImagePath.AboutChakra
            : { uri: item?.imageFilename, priority: FastImage.priority.normal }
        }
        style={homeCardStyles.image}
      />

      <View style={homeCardStyles.titleContainer}>
        <ThemeText
          style={homeCardStyles.titleTextCard}
          size={isTablet ? 15 : 13}
          color={colors.white}
          numberOfLines={2}
          ellipsizeMode="tail"
        >
          {Object.keys(item).length === 0 ? "About Chakra" : item.name}
        </ThemeText>
      </View>

      {Object.keys(item).length === 0 ? null : index === 1 ? (
        <View style={homeCardStyles.upgradeButton}>
          <Ionicons
            name="play"
            size={isTablet ? 33 : 18}
            color={colors.white}
          />
        </View>
      ) : canInteract ? (
        <View style={homeCardStyles.upgradeButton}>
          <Ionicons name="play" size={18} color={colors.white} />
        </View>
      ) : (
        <View style={homeCardStyles.upgradeButton}>
          <Ionicons
            name="lock-closed"
            size={isTablet ? 33 : 18}
            color={colors.white}
          />
        </View>
      )}
    </AnimatedPressble>
  );
};

export default CardChakrasTrackHome;

// Create an animated version of TouchableOpacity
const AnimatedTouchable = Animated.createAnimatedComponent(Pressable);
