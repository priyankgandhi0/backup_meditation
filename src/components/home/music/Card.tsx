import { MusicTrack } from "../../../services/sounds.service";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { Pressable } from "react-native";
import React from "react";
import { Dimensions, View } from "react-native";
import { convertMusicTrackToTrack } from "../../../utils/trackConverter";
import { useAudio } from "../../../context/AudioContext";
import ThemeText from "../../shared/theme-text";
import FastImage from "react-native-fast-image";
import { useDispatch } from "react-redux";
import { playerActions } from "../../../redux/slice/PlayerSlice";
import { StackNavigationProp } from "@react-navigation/stack";
import { RootStackParamList } from "@/src/navigation/NavigationType";
import { sleepmusic } from "@/src/utils/ImagePath";
import { colors } from "@/src/utils/colors";
import { homeCardStyles } from "@/src/styles/card-home.styles";
import { CardMusicTrackHomeProps } from "@/src/interface/Types";
import { trackMusicAccess } from "@/src/utils/analytics";
import AnimatedPressble from "../../AnimatedPressble";

const CardMusicTrackHome = ({
  item,
  isAuthenticated,
  index,
  isPremiumUser,
}: CardMusicTrackHomeProps) => {
  const { width } = Dimensions.get("window");

  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const { loadTrack } = useAudio();
  const isTablet = width >= 768;
  const cardWidth = width * 0.47;
  const canInteract = !item.isPremium || isPremiumUser;
  const dispatch = useDispatch();

  const imageUrl = sleepmusic[index % sleepmusic.length];

  const handleTrackPress = async (track: MusicTrack) => {
    if (!isAuthenticated && !canInteract) {
      navigation.navigate("Login");
    } else {
      if (canInteract) {
        trackMusicAccess("ACCESS_SLEEP_MUSIC", {
          trackId: track._id,
          trackName: track.name,
          isPremium: track.isPremium,
          hasAccess: true,
        });
        const convertedTrack = convertMusicTrackToTrack(track);
        loadTrack(convertedTrack, "SleepMusic");
        dispatch(
          playerActions.setMusic({
            isBack: true,
            isFrequency: true,
            root: "SleepMusic",
            screen: "Home",
            track: convertedTrack,
          })
        );
        navigation.navigate("Player", {
          isBack: true,
          isFrequency: true,
          root: "SleepMusic",
          screen: "Home",
        });
        dispatch(playerActions.setIsPlayerContinue(true));
      } else {
        navigation.navigate("Subscription");
      }
    }
  };

  return (
    <AnimatedPressble onPress={() => handleTrackPress(item)}>
      <View style={[homeCardStyles.cardContainer, { width: cardWidth }]}>
        <FastImage source={imageUrl} style={homeCardStyles.image} />
        <View style={homeCardStyles.titleContainer}>
          <ThemeText
            style={{
              ...homeCardStyles.titleTextCard,
            }}
            size={isTablet ? 15 : 13}
            color={colors.white}
            numberOfLines={2}
            ellipsizeMode="tail"
          >
            {item.name}
          </ThemeText>
        </View>
        {!canInteract && (
          <View style={homeCardStyles.upgradeButton}>
            <Ionicons name="lock-closed" size={18} color={colors.white} />
          </View>
        )}
        {canInteract && (
          <View style={homeCardStyles.upgradeButton}>
            <Ionicons
              name="play"
              size={isTablet ? 33 : 18}
              color={colors.white}
              style={{ elevation: 5 }}
            />
          </View>
        )}
      </View>
    </AnimatedPressble>
  );
};

export default CardMusicTrackHome;
