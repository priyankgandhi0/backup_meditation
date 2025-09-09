import React, { useEffect, useState } from "react";
import { FlatList, NativeScrollEvent, NativeSyntheticEvent, View } from "react-native";
import CardChakrasTrackHome from "./Card";
import SkeletonList from "../../loaders/CardLoader";
import { useNavigation } from "@react-navigation/native";
import ProgressBar from "../../loaders/ProgressBar";
import { StackNavigationProp } from "@react-navigation/stack";
import { RootStackParamList } from "../../../navigation/NavigationType";
import TitleHome from "../title";
import { useAudio } from "../../../context/AudioContext";
import { convertMusicTrackToTrack } from "../../../utils/trackConverter";
import { hp, wp } from "../../../helper/Responsive";
import Animated, { useSharedValue, withTiming } from "react-native-reanimated";
import { useAppDispatch, useAppSelector } from "../../../redux/StateType";
import { useGetChakra } from "@/src/api/query/ChakrasService";
import { chakraActions } from "@/src/redux/slice/ChakraSlice";
import { FlashList } from "@shopify/flash-list";

const ChakrasListHome = () => {
  const navigation =
    useNavigation<StackNavigationProp<RootStackParamList, "BaseHome">>();
  const { userData } = useAppSelector((state) => state.auth);
  const { chakra } = useAppSelector((state) => state.chakra);
  const { setPlaylist } = useAudio();
  const progress = useSharedValue(0);
  const getChakra = useGetChakra();
  const dispatch = useAppDispatch();
  const [visibleWidth, setVisibleWidth] = useState(0);
  const isBreathwork = useAppSelector((state) => state.auth.isBreathwork);

  useEffect(() => {
    if (!isBreathwork ) {
      handleGetChakra();
    }
  }, [userData?.user?.email, isBreathwork]);

  const handleGetChakra = async () => {
    try {
      const res = await getChakra.mutateAsync({
        email: userData?.user?.email,
        limit: 10,
        page: 1,
      });
      dispatch(chakraActions.setChakra(res));
    } catch (error) {
      console.log("handleGetChakra===>", error);
    }
  };


  useEffect(() => {
    if (chakra?.musicList) {
      handleAllMusic()
    }
  }, [chakra?.musicList]);

  const handleAllMusic = () => {
    if (chakra?.musicList) {
      chakra?.isPremium
        ? setPlaylist(chakra?.musicList.map(convertMusicTrackToTrack))
        : setPlaylist(
            chakra?.musicList
              .filter((music: { isPremium: any }) => !music.isPremium)
              .map(convertMusicTrackToTrack)
          );
    }
  };

  if (getChakra.isPending) return <SkeletonList />;


  const onSeAllView = () => {
    navigation.navigate("ChakrasTrack");
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


  return (
    <View>
      <TitleHome onClickSeeAll={onSeAllView} title="Chakras" />
      {chakra?.musicList.length > 0 && (
         <FlashList
         data={[{}, ...chakra?.musicList]}
         onLayout={(e) => setVisibleWidth(e.nativeEvent.layout.width)}
         renderItem={({ item, index }: any) => {
          return (
            <CardChakrasTrackHome
              item={item}
              index={index}
              isAuthenticated={userData.token != ""}
              isPremium={getChakra?.data?.isPremium}
              onPress={() => handleAllMusic()}
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
      )}
      <View style={{ alignSelf: "center" }}>
        <ProgressBar progress={progress} />
      </View>
    </View>
  );
};

export default ChakrasListHome;
