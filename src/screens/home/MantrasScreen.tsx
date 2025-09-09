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
import { NavigationProp, useIsFocused, useNavigation } from "@react-navigation/native";
import ThemeTextTitle from "../../components/shared/theme-title";
import { RootStackParamList } from "@/src/navigation/NavigationType";
import { colors } from "@/src/utils/colors";
import { useGetMantra } from "@/src/api/query/MantrasService";
import { CategoryType } from "@/src/interface/Types";
import { FlashList } from "@shopify/flash-list";
import { trackScreenView } from "@/src/utils/analytics";

const MantrasScreen = () => {
  const { userData } = useAppSelector((state) => state.auth);
  const { mantra } = useAppSelector((state) => state.mantra);
  const [selectedCategory, setSelectedCategory] = useState<CategoryType | null>(
    null
  );
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const [isCategoryModalVisible, setIsCategoryModalVisible] = useState(false);
  // const getMantra = useGetMantra();
  // const isFoused = useIsFocused();

  //  useEffect(() => {
  //   if(isFoused){
  //     handleGetMantra();
  //   }
  //  }, [isFoused]);
 
  //  const handleGetMantra = () => {
  //    try {
  //      getMantra.mutateAsync({email: userData?.user?.email , limit:10, page:1})
  //    } catch (error) {
  //      console.log('handleGetMantra===>', error)
  //    }
  //  }

  useEffect(() => {
    trackScreenView("Mantras", "MantrasScreen");
  } , []);
   
  const handleVideo = (url: any, title: any, canInteract: boolean) => {
    if (!userData?.user?.email && !canInteract) {
      navigation.navigate("Login");
    } else {
      if (canInteract) {
        navigation.navigate("VideoPlayer", { videoUrl: url, title: title });
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
          source={ImagePath.MantraList}
          style={styles.topImageBackground}
        ></ImageBackground>
        <View>
          {/* {getMantra.isPending ? (
            <ActivityIndicator size="large" color={colors.green} />
          ) : ( */}
           <FlashList
              data={mantra?.videoList}
              scrollEnabled={false}
              renderItem={({ item, index }:any) => {
                const isPremiumUser = index > 1 ? mantra?.hasAccess : true;
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
                          onPress={() =>
                            handleVideo(
                              item?.videoUrl,
                              item.title,
                              isPremiumUser
                            )
                          }
                          style={styles.trackPressContainer}
                          accessibilityLabel={`Track: ${item.name}`}
                        >
                          <FastImage
                            source={{ uri: item.thumbnailUrl }}
                            style={styles.trackImage}
                          />
                          <ThemeTextTitle style={styles.trackTitle}>
                            {item.title}
                          </ThemeTextTitle>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </Animated.View>
                );
              }}
            estimatedItemSize={200}
            contentContainerStyle={styles.trackList}
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

export default MantrasScreen;

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
