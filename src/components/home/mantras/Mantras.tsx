import { Dimensions, FlatList, NativeScrollEvent, NativeSyntheticEvent, Pressable, View } from "react-native";
import React, { useEffect, useCallback, useMemo, useState } from "react";
import { useNavigation } from "@react-navigation/native";
import { useAppDispatch, useAppSelector } from "../../../redux/StateType";
import SkeletonList from "../../loaders/CardLoader";
import FastImage from "react-native-fast-image";
import ThemeText from "../../shared/theme-text";
import { hp, isTablet, wp } from "../../../helper/Responsive";
import { Ionicons } from "@expo/vector-icons";
import ProgressBar from "../../loaders/ProgressBar";
import Animated, { useSharedValue, withTiming } from "react-native-reanimated";
import TitleHome from "../title";
import { StackNavigationProp } from "@react-navigation/stack";
import { RootStackParamList } from "@/src/navigation/NavigationType";
import { colors } from "@/src/utils/colors";
import { homeCardStyles } from "@/src/styles/card-home.styles";
import { useGetMantra } from "@/src/api/query/MantrasService";
import { mantraActions } from "@/src/redux/slice/MantraSlice";
import {
  trackScreenView,
  trackMusicAccess,
} from "@/src/utils/analytics";
import AnimatedPressble from "../../AnimatedPressble";
import { FlashList } from "@shopify/flash-list";

const { width } = Dimensions.get("window");

const Mantras = () => {
  const cardWidth = useMemo(() => width * 0.47, [width]);
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const { userData } = useAppSelector((state) => state.auth);
  const { mantra } = useAppSelector((state) => state.mantra);
  const progress = useSharedValue(0);
  const getMantra = useGetMantra();
  const dispatch = useAppDispatch();
  const [visibleWidth, setVisibleWidth] = useState(0);
  const isBreathwork = useAppSelector((state) => state.auth.isBreathwork);

  useEffect(() => {
    if (!isBreathwork) {
      handleGetMantra();
    }
  }, [userData?.user?.email, isBreathwork]);

  useEffect(() => {
    if (mantra?.videoList) {
      trackScreenView("Mantras", "MantrasScreen", {
        total_mantras: mantra.videoList.length,
        has_access: mantra.hasAccess,
      });
    }
  }, [mantra?.videoList?.length, mantra?.hasAccess]);

  const handleGetMantra = async () => {
    try {
      const res = await getMantra.mutateAsync({
        email: userData?.user?.email,
        limit: 10,
        page: 1,
      });
      dispatch(mantraActions.setMantra(res));
    } catch (error) {
      console.log("handleGetMantra===>", error);
    }
  };

  const handleVideo = useCallback(
    (url: string, title: string, canInteract: boolean) => {
      if (!userData?.token && !canInteract) {
        navigation.navigate("Login");
      } else {
        if (canInteract) {
          trackMusicAccess("ACCESS_MANTRA", {
            trackName: title,
            hasAccess: canInteract,
          });
          navigation.navigate("VideoPlayer", {
            videoUrl: url,
            title,
            sectionId: "",
            courseId: "",
            lessonsId: "",
            completed: false,
          });
        } else {
          navigation.navigate("Subscription");
        }
      }
    },
    [userData?.token, navigation]
  );

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
    navigation.navigate("MantrasScreen");
  };

  const renderItem = useCallback(
    ({ item, index }: any) => {
      const canInteract = index > 1 ? mantra?.hasAccess : true;
      return (
        <AnimatedPressble
          key={`mantra_${item._id}`}
          onPress={() => handleVideo(item?.videoUrl, item.title, canInteract)}
        >
          <View style={[homeCardStyles.cardContainer, { width: cardWidth }]}>
            <FastImage
              source={{ uri: item?.thumbnailUrl }}
              style={homeCardStyles.image}
              resizeMode={FastImage.resizeMode.cover}
            />
            <View style={homeCardStyles.titleContainer}>
              <ThemeText
                style={homeCardStyles.titleTextCard}
                size={isTablet ? 15 : 13}
                color={colors.white}
                numberOfLines={2}
                ellipsizeMode="tail"
              >
                {item.title}
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
    },
    [cardWidth, mantra?.hasAccess]
  );

  const keyExtractor = useCallback((item: any) => item._id || item.title, []);

  if (getMantra.isPending) return <SkeletonList />;

  return (
    <View>
      <TitleHome onClickSeeAll={onSeAllView} title="Mantras" />
      <FlashList
        data={mantra?.videoList}
        onLayout={(e) => setVisibleWidth(e.nativeEvent.layout.width)}
        renderItem={renderItem}
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

export default React.memo(Mantras);
