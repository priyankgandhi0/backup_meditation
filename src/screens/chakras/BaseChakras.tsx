import { useNavigation } from "@react-navigation/native";
import React, { useEffect } from "react";
import {
  FlatList,
  Image,
  ImageBackground,
  Pressable,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { StackNavigationProp } from "@react-navigation/stack";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";
import FastImage from "react-native-fast-image";
import { useDispatch } from "react-redux";
import { RootStackParamList } from "@/src/navigation/NavigationType";
import { useAudio } from "@/src/context/AudioContext";
import { useAppSelector } from "@/src/redux/StateType";
import ThemeTextTitle from "@/src/components/shared/theme-title";
import { FocusAwareStatusBar } from "@/src/components/FocusAwareStatusBar";
import { convertMusicTrackToTrack } from "@/src/utils/trackConverter";
import { playerActions } from "@/src/redux/slice/PlayerSlice";
import { ImagePath } from "@/src/utils/ImagePath";
import { hp, isiPAD, RFValue, wp } from "@/src/helper/Responsive";
import { colors } from "@/src/utils/colors";
import { MusicTrack } from "@/src/interface/Types";
import { FlashList } from "@shopify/flash-list";
import BackButton from "@/src/components/BackButton";
import { trackScreenView } from "@/src/utils/analytics";

const BaseChakras = () => {
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const { loadTrack, setPlaylist } = useAudio();
  const { userData } = useAppSelector((state) => state.auth);
  const { chakra } = useAppSelector((state) => state.chakra);

  const dispatch = useDispatch();

  useEffect(() => {
    trackScreenView("ChakrasTrack", "BaseChakras");
  } , []);

  const handleTrackPress = (
    track: MusicTrack,
    canInteract: boolean,
    index: number
  ) => {
    if (Object.keys(track).length === 0) {
      navigation.navigate("AboutChakraScreen");
    } else {
      if (!userData?.user?.email && !canInteract && index != 1) {
        navigation.navigate("Login");
      } else {
        if (
          canInteract ||
          (userData?.user?.email && canInteract === false && index == 1) ||
          (!userData?.user?.email && canInteract === false && index == 1)
        ) {
          if (chakra?.musicList) {
            chakra?.isPremium
              ? setPlaylist(chakra?.musicList.map(convertMusicTrackToTrack))
              : setPlaylist(
                  chakra?.musicList
                    .filter((music: { isPremium: any }) => !music.isPremium)
                    .map(convertMusicTrackToTrack)
                );
          }
          const convertedTrack = convertMusicTrackToTrack(track);
          loadTrack(convertedTrack, "Chakras");
          dispatch(playerActions.setIsPlayerContinue(true));
          dispatch(
            playerActions.setMusic({
              isBack: true,
              isFrequency: false,
              screen: "Home",
              root: "Chakras",
              track: convertedTrack,
            })
          );
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
    <ImageBackground source={ImagePath.musicBaseBack} style={{ flex: 1 }}>
      <FocusAwareStatusBar
        barStyle={"light-content"}
        translucent
        backgroundColor={"transparent"}
      />
      <BackButton />
      <ScrollView
        bounces={false}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: hp(2) }}
      >
        <Image
          source={ImagePath.ChakrasListScreenImage}
          style={styles.topImageBackground}
        />
        <FlashList
          scrollEnabled={false}
          data={chakra?.musicList ? [{}, ...chakra?.musicList] : []}
          renderItem={({ item, index }: any) => {
            const isPremiumUser = chakra?.isPremium;
            return (
              <Animated.View
                key={item._id}
                entering={FadeIn.delay(index * 100)}
                exiting={FadeOut}
              >
                <View
                  style={[
                    styles.trackContainer,
                    item.isPremium &&
                      !isPremiumUser &&
                      styles.premiumTrackContainer,
                  ]}
                >
                  {Object.keys(item).length === 0 ? null : (
                    <View style={styles.playView}>
                      <Ionicons
                        name="play"
                        size={26}
                        color={colors.light_mauve}
                      />
                    </View>
                  )}

                  <View style={styles.trackItem}>
                    {Object.keys(item).length === 0 || index === 1 ? null : (
                      <>
                        {!isPremiumUser && (
                          <Pressable
                            style={styles.lockOverlay}
                            onPress={() => {
                              navigation.navigate("BottomTabNavigator", {
                                screen: "Home",
                                params: {
                                  screen: userData?.user?.email
                                    ? "Subscription"
                                    : "Login",
                                },
                              });
                            }}
                            accessibilityLabel="Unlock Premium Features"
                          >
                            <Ionicons
                              name="lock-closed"
                              size={20}
                              color={colors.light_mauve}
                              style={styles.lockIcons}
                            />
                          </Pressable>
                        )}
                      </>
                    )}
                    <TouchableOpacity
                      onPress={() =>
                        handleTrackPress(item, isPremiumUser, index)
                      }
                      style={styles.trackPressContainer}
                      accessibilityLabel={`Track: ${item.name}`}
                    >
                      <FastImage
                        source={
                          Object.keys(item).length === 0
                            ? ImagePath.AboutChakra
                            : {
                                uri: item?.imageFilename,
                                priority: FastImage.priority.normal,
                              }
                        }
                        style={styles.trackImage}
                      />
                      <ThemeTextTitle style={styles.trackTitle}>
                        {Object.keys(item).length === 0
                          ? "About Chakra"
                          : item.name}
                      </ThemeTextTitle>
                    </TouchableOpacity>
                  </View>
                </View>
              </Animated.View>
            );
          }}
          estimatedItemSize={200}
          scrollEventThrottle={16}
          contentContainerStyle={styles.trackList}
        />
      </ScrollView>
    </ImageBackground>
  );
};

export default BaseChakras;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  topImageBackground: {
    width: wp(100),
    height: hp(isiPAD ? 50 : 35),
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  trackContainer: {
    marginBottom: hp(0.5),
    marginHorizontal: wp(3),
    borderRadius: 10,
    shadowColor: colors.light_pink,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 9,
    backgroundColor: colors.white,
  },
  premiumTrackContainer: {
    borderRadius: 15,
    borderWidth: 2,
    borderColor: colors.gray_1,
  },
  trackItem: {
    borderRadius: 51,
    padding: isiPAD ? wp(2) : wp(3),
  },
  trackImage: {
    width: isiPAD ? wp(10) : wp(18),
    height: isiPAD ? wp(10) : wp(18),
    borderRadius: 100,
  },
  trackPressContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  trackTitle: {
    fontSize: RFValue(12),
    color: colors.black,
    maxWidth: wp(50),
    marginLeft: wp(2),
  },
  lockOverlay: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: colors.balck_800,
    justifyContent: "flex-start",
    alignItems: "flex-end",
    borderRadius: 10,
    zIndex: 10,
  },
  trackList: {
    paddingHorizontal: 0,
    paddingTop: hp(2),
  },
  playView: {
    position: "absolute",
    right: wp(5),
    bottom: hp(2),
  },
  lockIcons: {
    marginRight: wp(6),
    marginTop: hp(1),
  },
});
