import { Dimensions, FlatList, NativeScrollEvent, NativeSyntheticEvent, Pressable, View } from "react-native";
import React, { useEffect, useState } from "react";
import { hp, isTablet, wp } from "../../../helper/Responsive";
import FastImage from "react-native-fast-image";
import ThemeText from "../../shared/theme-text";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { convertMusicTrackToTrack } from "../../../utils/trackConverter";
import { useAudio } from "../../../context/AudioContext";
import { useAppDispatch, useAppSelector } from "../../../redux/StateType";
import { playerActions } from "../../../redux/slice/PlayerSlice";
import SkeletonList from "../../loaders/CardLoader";
import ProgressBar from "../../loaders/ProgressBar";
import Animated, { useSharedValue, withTiming } from "react-native-reanimated";
import TitleHome from "../title";
import { useAudioEffects } from "@/src/context/AudioEffectsContext";
import { StackNavigationProp } from "@react-navigation/stack";
import { RootStackParamList } from "@/src/navigation/NavigationType";
import { colors } from "@/src/utils/colors";
import { homeCardStyles } from "@/src/styles/card-home.styles";
import { useGetGuidedMeditation } from "@/src/api/query/GuidedMeditationService";
import { MusicTrack } from "@/src/interface/Types";
import { guidedMeditationActions } from "@/src/redux/slice/GuidedMeditationSlice";
import { trackScreenView, trackEvent } from "@/src/utils/analytics";
import AnimatedPressble from "../../AnimatedPressble";
import { FlashList } from "@shopify/flash-list";

const { width } = Dimensions.get("window");

const GuidedMeditationView = () => {
  const cardWidth = width * 0.47;
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const { loadTrack, setPlaylist } = useAudio();
  const dispatch = useAppDispatch();
  const { userData } = useAppSelector((state) => state.auth);
  const { guidedMeditation } = useAppSelector(
    (state) => state.guidedMeditation
  );
  const progress = useSharedValue(0);
  const { stopSound } = useAudioEffects();
  const getGuidedMeditation = useGetGuidedMeditation();
  const [visibleWidth, setVisibleWidth] = useState(0);
  const isBreathwork = useAppSelector((state) => state.auth.isBreathwork);

  useEffect(() => {
    if (!isBreathwork) {
      handleGetGuidedMeditation();
    }
  }, [userData?.user?.email, isBreathwork]);

  useEffect(() => {
    trackScreenView("GuidedMeditation", "GuidedMeditationView", {
      total_meditations: guidedMeditation?.musicList?.length,
      is_premium: guidedMeditation?.isPremium,
    });
  }, [guidedMeditation]);

  const handleGetGuidedMeditation = async () => {
    try {
      const res = await getGuidedMeditation.mutateAsync({
        email: userData?.user?.email,
        token: userData?.token,
        limit: 10,
        page: 1,
      });
      console.log('res',res)
      dispatch(guidedMeditationActions.setGuidedMeditation(res));
    } catch (error) {
      console.log("handleGetGuidedMeditation===>", error);
    }
  };

  if (getGuidedMeditation.isPending) return <SkeletonList />;

  const handleTrackPress = async (track: MusicTrack, canInteract: boolean) => {
    if (!userData?.token && !canInteract) {
      navigation.navigate("Login");
    } else {
      if (canInteract) {
        trackEvent("start_meditation", {
          meditation_id: track._id,
          meditation_name: track.name,
          is_premium: track.isPremium,
        });
        stopSound();
        if (guidedMeditation?.musicList) {
          guidedMeditation?.isPremium
            ? setPlaylist(
                guidedMeditation?.musicList.map(convertMusicTrackToTrack)
              )
            : setPlaylist(
                guidedMeditation?.musicList
                  .filter((music: { isPremium: any }) => !music.isPremium)
                  .map(convertMusicTrackToTrack)
              );
        }
        const convertedTrack = convertMusicTrackToTrack(track);
        loadTrack(convertedTrack, "SleepMusic");
        dispatch(playerActions.setIsPlayerContinue(true));
        dispatch(
          playerActions.setMusic({
            isBack: true,
            isFrequency: false,
            root: "GuidedMeditation",
            screen: "Home",
            track: convertedTrack,
          })
        );
        navigation.navigate("Player", {
          isBack: true,
          isFrequency: false,
          root: "GuidedMeditation",
          screen: "Home",
        });
      } else {
        navigation.navigate("Subscription");
      }
    }
  };

   const handleScroll = (
      event: NativeSyntheticEvent<NativeScrollEvent>,
      progress: Animated.SharedValue<number>
    ) => {
      const { contentSize, contentOffset } = event.nativeEvent;
      const contentWidth = contentSize.width;
      const offsetX = contentOffset.x;
      const maxOffset = contentWidth - visibleWidth; // dynamically computed
    
      const progressPercentage =
        maxOffset > 0 ? Math.max(0, Math.min(offsetX / maxOffset, 1)) : 0;
    
      progress.value = withTiming(progressPercentage, { duration: 100 });
    };

  const onSeAllView = () => {
    navigation.navigate("GuidedMeditationScreen");
  };

  return (
    <View>
      <TitleHome onClickSeeAll={onSeAllView} title="Guided Meditations" />
      <FlashList
        data={guidedMeditation?.musicList}
        onLayout={(e) => setVisibleWidth(e.nativeEvent.layout.width)}
        renderItem={({ item, index }: any) => {
          const canInteract = index > 1 ? guidedMeditation?.isPremium : true;
          return (
            <AnimatedPressble
              key={`guideMeditation_${index}`}
              onPress={() => handleTrackPress(item, canInteract)}
            >
              <View
                style={[homeCardStyles.cardContainer, { width: cardWidth }]}
              >
                <FastImage
                  source={{ uri: item?.imageFilename }}
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
                    {item.name}
                  </ThemeText>
                </View>
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
            </AnimatedPressble>
          );
        }}
        horizontal={true}
        showsHorizontalScrollIndicator={false}
        onScroll={(event) => handleScroll(event, progress)}
        contentContainerStyle={{
          paddingVertical: hp(2),
          paddingHorizontal: wp(2),
        }}
        estimatedItemSize={200}
        scrollEventThrottle={16}
      />
      <View style={{ alignSelf: "center" }}>
        <ProgressBar progress={progress} />
      </View>
    </View>
  );
};

export default GuidedMeditationView;
