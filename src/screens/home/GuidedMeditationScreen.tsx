import {
  ActivityIndicator,
  FlatList,
  ImageBackground,
  Pressable,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import React, { useEffect, useState } from "react";
import { ImagePath } from "../../utils/ImagePath";
import { FocusAwareStatusBar } from "../../components/FocusAwareStatusBar";
import { hp, isiPAD, RFValue, wp } from "../../helper/Responsive";
import BackButton from "../../components/BackButton";
import { useAppSelector } from "../../redux/StateType";
import { Ionicons } from "@expo/vector-icons";
import {
  CategoryModal,
} from "../../components/modals/CategoryModal";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";
import FastImage from "react-native-fast-image";
import { NavigationProp, useNavigation } from "@react-navigation/native";
import ThemeTextTitle from "../../components/shared/theme-title";
import { useAudio } from "../../context/AudioContext";
import { convertMusicTrackToTrack } from "../../utils/trackConverter";
import { useDispatch } from "react-redux";
import { playerActions } from "../../redux/slice/PlayerSlice";
import { RootStackParamList } from "@/src/navigation/NavigationType";
import { colors } from "@/src/utils/colors";
// import { useGetGuidedMeditation } from "@/src/api/query/GuidedMeditationService";
import { CategoryType, MusicTrack } from "@/src/interface/Types";
import { FlashList } from "@shopify/flash-list";
import { trackScreenView } from "@/src/utils/analytics";

const GuidedMeditationScreen = () => {
  const { userData } = useAppSelector((state) => state.auth);
  const { guidedMeditation } = useAppSelector((state) => state.guidedMeditation);
  const [selectedCategory, setSelectedCategory] = useState<CategoryType | null>(
    null
  );
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const [isCategoryModalVisible, setIsCategoryModalVisible] = useState(false);
  const { loadTrack, setPlaylist } = useAudio();
  const dispatch = useDispatch();
  //  const getGuidedMeditation = useGetGuidedMeditation()

  // useEffect(() => {
  //   handleGetGuidedMeditation();
  // }, [userData?.user?.email]);

  // const handleGetGuidedMeditation = () => {
  //   try {
  //     getGuidedMeditation.mutateAsync({email: userData?.user?.email , limit:10, page:1})
  //   } catch (error) {
  //     console.log('handleGetGuidedMeditation===>', error)
  //   }
  // }

  useEffect(() => {
    trackScreenView("GuidedMeditation", "GuidedMeditationScreen");
  } , []);

  const handleTrackPress = async (track: MusicTrack, canInteract: boolean) => {
    if (!userData?.user?.email && !canInteract) {
      navigation.navigate("Login");
    } else {
      if (canInteract) {
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
        <ImageBackground
          source={ImagePath.GuidedMeditationListScreenImage}
          style={styles.topImageBackground}
        ></ImageBackground>
        <View>
          {/* {getGuidedMeditation?.isPending ? (
            <ActivityIndicator size="large" color={colors.green} />
          ) : ( */}
          <FlashList
           data={guidedMeditation?.musicList}
           scrollEnabled={false}
           renderItem={({ item, index }:any) => {
             const isPremiumUser = index > 1 ? guidedMeditation?.isPremium : true;
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
                   <View style={styles.playerView}>
                     <Ionicons
                       name="play"
                       size={26}
                       color={colors.light_mauve}
                     />
                   </View>

                   <View style={styles.trackItem}>
                     {!isPremiumUser && (
                       <Pressable
                         style={styles.lockOverlay}
                         onPress={() => {
                           navigation.navigate("BottomTabNavigator", {
                             screen: "Home",
                             params: {
                               screen: userData?.user?.email ? "Subscription" : "Login",
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
                     <TouchableOpacity
                       onPress={() => handleTrackPress(item, isPremiumUser)}
                       style={styles.trackPressContainer}
                       accessibilityLabel={`Track: ${item.name}`}
                     >
                       <FastImage
                         source={{ uri: item.imageFilename }}
                         style={styles.trackImage}
                       />
                       <ThemeTextTitle style={styles.trackTitle}>
                         {item.name}
                       </ThemeTextTitle>
                     </TouchableOpacity>
                   </View>
                 </View>
               </Animated.View>
             );
           }}
           contentContainerStyle={styles.trackList}
            estimatedItemSize={200}
          />
          {/* )} */}
        </View>
      </ScrollView>
      <CategoryModal
        isVisible={isCategoryModalVisible}
        onClose={() => setIsCategoryModalVisible(false)}
        onSelectCategory={(category) => {
          setSelectedCategory(category);
          setIsCategoryModalVisible(false);
        }}
        selectedCategory={selectedCategory}
      />
    </ImageBackground>
  );
};

export default GuidedMeditationScreen;

const styles = StyleSheet.create({
  topImageBackground: {
    width: wp(100),
    height: hp(isiPAD ? 50 : 35),
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: colors.dark_mauve_1,
  },
  trackList: {
    paddingTop: hp(2),
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
  trackPressContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  trackImage: {
    width: isiPAD ? wp(10) : wp(18),
    height: isiPAD ? wp(10) : wp(18),
    borderRadius: 100,
  },
  trackTitle: {
    fontSize: RFValue(12),
    color: colors.black,
    maxWidth: wp(50),
    marginLeft:wp(2)
  },
  lockOverlay: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor:colors.balck_800,
    justifyContent: "flex-start",
    alignItems: "flex-end",
    borderRadius: 10,
    zIndex: 10,
  },
  playerView: {
    position: "absolute",
    right: wp(5),
    bottom: hp(2),
  },
  lockIcons: {
    marginRight: wp(6),
    marginTop: hp(1),
  },
});
