import React, { useEffect, useState } from "react";
import {
  FlatList,
  NativeScrollEvent,
  NativeSyntheticEvent,
  View,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import CardMusicTrackHome from "./Card";
import SkeletonList from "../../loaders/CardLoader";
import { StackNavigationProp } from "@react-navigation/stack";
import { RootStackParamList } from "../../../navigation/NavigationType";
import { hp, wp } from "../../../helper/Responsive";
import ProgressBar from "../../loaders/ProgressBar";
import TitleHome from "../title";
import Animated, { useSharedValue, withTiming } from "react-native-reanimated";
import { convertMusicTrackToTrack } from "../../../utils/trackConverter";
import { useAudio } from "../../../context/AudioContext";
import { useAppDispatch, useAppSelector } from "../../../redux/StateType";
import {
  useGetSleepMusicByCategory,
  useGetSleepMusicPreview,
} from "@/src/api/query/SleepMusicService";
import { sleepMusicActions } from "@/src/redux/slice/SleepMusicSlice";
import { FlashList } from "@shopify/flash-list";

const MusicHome = () => {
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const progress = useSharedValue(0);
  const { setPlaylist } = useAudio();
  const { userData } = useAppSelector((state) => state.auth);
  const { sleepMusic } = useAppSelector((state) => state.sleepMusic);
  const getSleepMusicByCategory = useGetSleepMusicByCategory();
  const getSleepMusicPreview = useGetSleepMusicPreview();
  const dispatch = useAppDispatch();
  const [visibleWidth, setVisibleWidth] = useState(0);
  const isBreathwork = useAppSelector((state) => state.auth.isBreathwork);

  useEffect(() => {
    if (!isBreathwork ) {
      handleGetSleepMusic();
    }
  }, [userData?.user?.email, isBreathwork]);

  const handleGetSleepMusic = async () => {
    try {
      if (userData?.token) {
        const res = await getSleepMusicByCategory.mutateAsync({
          categoryId: "",
          token: userData?.token,
        });
        dispatch(sleepMusicActions.setSleepMusic(res));
      } else {
        const res = await getSleepMusicPreview.mutateAsync({
          categoryId: "",
        });
        dispatch(sleepMusicActions.setSleepMusic(res));
      }
    } catch (error) {
      console.log("handleGetSleepMusic=>", error);
    }
  };

  useEffect(() => {
    if (sleepMusic?.musicList) {
      sleepMusic?.isPremium
        ? setPlaylist(sleepMusic?.musicList.map(convertMusicTrackToTrack))
        : setPlaylist(
            sleepMusic?.musicList
              .filter((music: { isPremium: any }) => !music.isPremium)
              .map(convertMusicTrackToTrack)
          );
    }
  }, [sleepMusic?.musicList]);

  if (getSleepMusicByCategory.isPending || getSleepMusicPreview.isPending) return <SkeletonList />;

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

  const musicList = sleepMusic?.musicList?.slice(0, 6) || [];

  const onSeAllView = () => {
    navigation.navigate("SleepMusic");
  };

  // Don't render the section if there's no data
  if (!musicList || musicList.length === 0) {
    return null;
  }

  return (
    <View style={{ marginTop: hp(2) }}>
      <TitleHome onClickSeeAll={onSeAllView} title="Sleep Music" />
      <FlashList
        data={musicList}
        onLayout={(e) => setVisibleWidth(e.nativeEvent.layout.width)}
        renderItem={({ item, index }) => {
          return (
            <CardMusicTrackHome
              key={index}
              item={item}
              isAuthenticated={userData?.token != ""}
              index={index}
              isPremiumUser={sleepMusic?.isPremium!}
            />
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

export default MusicHome;
