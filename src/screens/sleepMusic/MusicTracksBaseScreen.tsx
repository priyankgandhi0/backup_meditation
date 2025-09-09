import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  ActivityIndicator,
  Modal,
  TouchableOpacity,
  ImageBackground,
  ScrollView,
  StyleSheet,
  Image,
} from "react-native";
import {
  RouteProp,
  useIsFocused,
  useNavigation,
  useRoute,
} from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { useAudio } from "../../context/AudioContext";
import { convertMusicTrackToTrack } from "../../utils/trackConverter";
import { CategoryModal } from "../../components/modals/CategoryModal";
import { LinearGradient } from "expo-linear-gradient";
import { FavoritesList } from "../../components/tracks/FavoriteList";
import { TrackList } from "../../components/tracks/TrackList";
import { RootStackParamList } from "../../navigation/NavigationType";
import BackButton from "../../components/BackButton";
import { hp, isiPAD, RFValue, wp } from "../../helper/Responsive";
import { ImagePath } from "../../utils/ImagePath";
import { FocusAwareStatusBar } from "../../components/FocusAwareStatusBar";
import { StackNavigationProp } from "@react-navigation/stack";
import ThemeText from "../../components/shared/theme-text";
import { useAppSelector } from "../../redux/StateType";
import { useDispatch } from "react-redux";
import { playerActions } from "../../redux/slice/PlayerSlice";
import { colors } from "@/src/utils/colors";
import { FontPath } from "@/src/utils/FontPath";
import { CategoryType, MusicTrack } from "@/src/interface/Types";
import {
  useAddFavorites,
  useGetSleepMusicByCategory,
  useGetSleepMusicByCategoryFavorites,
  useGetSleepMusicPreview,
} from "@/src/api/query/SleepMusicService";
import { trackScreenView } from "@/src/utils/analytics";

export const MusicTracksScreen = () => {
  const navigation =
    useNavigation<StackNavigationProp<RootStackParamList, "BaseHome">>();
  const { loadTrack, setPlaylist } = useAudio();
  const { isPlayerContinue } = useAppSelector((state) => state.player);
  const { userData } = useAppSelector((state) => state.auth);

  const routes = useRoute<RouteProp<RootStackParamList, "MusicTracksScreen">>();
  const isFoused = useIsFocused();
  const dispatch = useDispatch();

  const [searchQuery, setSearchQuery] = useState("");
  const [isCategoryModalVisible, setIsCategoryModalVisible] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<CategoryType | null>(
    null
  );
  const [loadingFavorites, setLoadingFavorites] = useState(false);
  const [favoriteError, setFavoriteError] = useState<string | null>(null);
  const [currentTab, setCurrentTab] = useState<"favorites" | "allTracks">(
    "allTracks"
  );
  const getSleepMusicByCategory = useGetSleepMusicByCategory();
  const getSleepMusicByCategoryFavorites =
    useGetSleepMusicByCategoryFavorites();
  const getSleepMusicPreview = useGetSleepMusicPreview();
  const addFavorites = useAddFavorites();

  useEffect(() => {
    trackScreenView("MusicTrack", "MusicTracksScreen");
    if(isFoused){
      handleGetSleepMusic();
      handleGetFavorites();
    }
  }, [isFoused]);

  useEffect(() => {
      handleGetSleepMusic();
      handleGetFavorites();
  }, [selectedCategory?._id]);

  const handleGetSleepMusic = () => {
    try {
      if (userData?.token) {
        getSleepMusicByCategory.mutateAsync({
          categoryId: selectedCategory?._id || "",
          token: userData?.token,
        });
      } else {
        getSleepMusicPreview.mutateAsync({
          categoryId: selectedCategory?._id || "",
        });
      }
    } catch (error) {
      console.log("handleGetSleepMusic=>", error);
    }
  };

  const handleGetFavorites = () => {
    try {
      getSleepMusicByCategoryFavorites.mutateAsync({
        categoryId: selectedCategory?._id || "",
        token: userData?.token,
      });
    } catch (error) {
      console.log("handleGetFavorites=>", error);
    }
  };

  useEffect(() => {
    if (getSleepMusicByCategory?.data?.musicList) {
      getSleepMusicByCategory?.data?.isPremium
        ? setPlaylist(
            getSleepMusicByCategory?.data.musicList.map(
              convertMusicTrackToTrack
            )
          )
        : setPlaylist(
            getSleepMusicByCategory?.data?.musicList
              .filter((music: { isPremium: boolean }) => !music.isPremium)
              .map(convertMusicTrackToTrack)
          );
    }
  }, [getSleepMusicByCategory?.data?.musicList]);

  const handleTrackPress = (track: MusicTrack) => {
    const convertedTrack = convertMusicTrackToTrack(track);
    loadTrack(convertedTrack, "SleepMusic");
    dispatch(playerActions.setIsPlayerContinue(true));
    dispatch(
      playerActions.setMusic({
        isBack: true,
        isFrequency: true,
        screen: "MusicTrack",
        root: "SleepMusic",
        track: convertedTrack,
      })
    );
    navigation.navigate("Player", {
      isBack: true,
      isFrequency: true,
      screen: "MusicTrack",
      root: "SleepMusic",
      track: track,
    });
  };

  const handleToggleFavorite = async (musicId: string) => {
    if (!userData?.user?.email) {
      navigation.navigate("BottomTabNavigator", {
        screen: "Home",
        params: {
          screen: "Login",
        },
      });
      return;
    }
    setLoadingFavorites(true);
    setFavoriteError(null);
    try {
      addFavorites.mutateAsync({
        musicId: musicId,
        token: userData?.token,
      });
      handleGetSleepMusic();
      handleGetFavorites();
    } catch (error) {
      setFavoriteError("Error toggling favorite");
      console.error("Error toggling favorite:", error);
    } finally {
      setLoadingFavorites(false);
    }
  };

  const handleClearCategory = () => {
    setSelectedCategory(null);
    handleGetSleepMusic();
    handleGetFavorites();
  };

  const handleUpgradeNow = () => {
    navigation.navigate("BottomTabNavigator", {
      screen: "Home",
      params: {
        screen: userData?.user?.email ? "Subscription" : "Login",
      },
    });
  };

  const filterTracks = (tracks: MusicTrack[]) => {
    return tracks?.filter((track) =>
      searchQuery
        ? track.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          track.description.toLowerCase().includes(searchQuery.toLowerCase())
        : true
    );
  };

  const sleepMusicList = userData?.token
    ? getSleepMusicByCategory?.data?.musicList
    : getSleepMusicPreview?.data?.musicList;

  const isPremium = userData?.token
    ? getSleepMusicByCategory?.data?.isPremium
    : getSleepMusicPreview?.data?.isPremium;

  const renderContent = () => {
    if (currentTab === "favorites") {
      return (
          <FavoritesList
            tracks={filterTracks(
              getSleepMusicByCategoryFavorites?.data?.musicList ?? []
            )}
            isLoading={getSleepMusicByCategoryFavorites?.isPending}
            onTrackPress={handleTrackPress}
            onToggleFavorite={handleToggleFavorite}
            loadingFavorites={loadingFavorites}
            isPremiumUser={isPremium}
            isAuthenticated={userData?.user?.email != ""}
          />
      );
    }

    return (
        <TrackList
          tracks={filterTracks(sleepMusicList)}
          isLoading={getSleepMusicByCategory.isPending}
          onTrackPress={handleTrackPress}
          onToggleFavorite={handleToggleFavorite}
          loadingFavorites={loadingFavorites}
          isPremiumUser={isPremium}
          isAuthenticated={userData?.user?.email != ""}
        />
    );
  };

  const handleTabChange = (tab: "favorites" | "allTracks") => {
    setCurrentTab(tab);
    setFavoriteError(null);
  };

  return (
    <ImageBackground source={ImagePath.musicBaseBack} style={{ flex: 1 }}>
      <FocusAwareStatusBar
        barStyle={"light-content"}
        translucent
        backgroundColor={"transparent"}
      />
      <ScrollView
        bounces={false}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: hp(2) }}
      >
        {routes.params?.isBack && <BackButton />}
        <View>
          <Image source={ImagePath.SleepListScreenMob} style={styles.topImageBackground}/>
          {userData?.user?.email && isPremium && (
            <View style={styles.header}>
              <TouchableOpacity
                onPress={() => setIsCategoryModalVisible(true)}
                style={styles.categoryButton}
              >
                <Ionicons
                  name="filter"
                  size={isiPAD ? 30 : 24}
                  color={colors.white}
                />
                <Text style={styles.categoryButtonText}>Categories</Text>
              </TouchableOpacity>
              {selectedCategory && (
                <View style={styles.selectedCategoryBadge}>
                  <Text style={styles.selectedCategoryText}>
                    {selectedCategory.name}
                  </Text>
                  <TouchableOpacity
                    onPress={handleClearCategory}
                    style={styles.clearButton}
                  >
                    <Ionicons
                      name="close-circle"
                      size={isiPAD ? 25 : 16}
                      color={colors.white}
                    />
                  </TouchableOpacity>
                </View>
              )}
            </View>
          )}
        </View>
      
        {favoriteError && <Text style={styles.errorText}>{favoriteError}</Text>}

        <View style={styles.searchContainer}>
          <Ionicons
            name="search"
            size={20}
            color={colors.dark_gray_2}
            style={styles.searchIcon}
          />
          <TextInput
            style={styles.searchInput}
            placeholder="Search tracks..."
            placeholderTextColor={colors.dark_gray_2}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
        <View style={styles.tabsContainer}>
          <TouchableOpacity
            style={[
              styles.tabButton,
              currentTab === "allTracks" && styles.activeTabButton,
            ]}
            onPress={() => handleTabChange("allTracks")}
          >
            <ThemeText
              style={[
                styles.tabButtonText,
                currentTab === "allTracks" ? styles.activeTabButtonText : {},
              ]}
            >
              All tracks
            </ThemeText>
          </TouchableOpacity>
          {userData?.user?.email && (
            <TouchableOpacity
              style={[
                styles.tabButton,
                currentTab === "favorites" && styles.activeTabButton,
              ]}
              onPress={() => handleTabChange("favorites")}
            >
              <ThemeText
                style={[
                  styles.tabButtonText,
                  currentTab === "favorites" ? styles.activeTabButtonText : {},
                ]}
              >
                Favorites
              </ThemeText>
            </TouchableOpacity>
          )}
        </View>
        {renderContent()}
      </ScrollView>
      <Modal
        transparent={true}
        animationType="fade"
        visible={loadingFavorites}
        onRequestClose={() => {}}
      >
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={colors.green} />
        </View>
      </Modal>

      {!userData?.user?.email && (
        <LinearGradient
          colors={["transparent", colors.primary]}
          style={[
            styles.upgradeButtonContainer,
            {
              bottom: isPlayerContinue ? hp(0) : hp(-5),
            },
          ]}
        >
          <TouchableOpacity
            style={styles.upgradeButton}
            onPress={handleUpgradeNow}
          >
            <ThemeText style={styles.upgradeButtonText}>
              Login to Access
            </ThemeText>
          </TouchableOpacity>
        </LinearGradient>
      )} 
      <CategoryModal
        isVisible={isCategoryModalVisible}
        onClose={() => setIsCategoryModalVisible(false)}
        onSelectCategory={(category) => {
          setIsCategoryModalVisible(false);
          setSelectedCategory(category);
          handleGetSleepMusic();
          handleGetFavorites();
        }}
        selectedCategory={selectedCategory}
      />
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  topImageBackground: {
    width: wp(100),
    height: hp(isiPAD ? 50 : 35),
  },
  header: {
    flexDirection: "row",
    position: "absolute",
    justifyContent: "space-between",
    alignItems: "center",
    right: wp(2),
    marginTop: hp(2),
  },
  categoryButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.primary,
    borderRadius: 50,
    width: isiPAD ? wp(19) : wp(35),
    height: isiPAD ? wp(4) : wp(9),
    borderWidth: 2,
    paddingHorizontal: wp(2),
    borderColor: colors.gray_1,
    shadowColor: colors.black,
  },
  categoryButtonText: {
    marginLeft: wp(1),
    fontSize: RFValue(11),
    color: colors.white,
    fontWeight: "bold",
  },
  selectedCategoryBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.light_white_1,
    borderRadius: 80,
    paddingHorizontal: wp(2),
    height: isiPAD ? wp(4) : wp(9),
    marginLeft: wp(2),
    borderWidth: 2,
    borderColor: colors.light_white_1,
  },
  selectedCategoryText: {
    color: colors.black,
    fontSize: RFValue(11),
    fontWeight: "bold",
  },
  clearButton: {
    marginLeft: wp(1),
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.white,
    borderRadius: 10,
    height: isiPAD ? hp(3.5) : hp(5),
    marginHorizontal: wp(5),
    marginVertical: hp(2),
    paddingHorizontal: wp(2),
    shadowRadius: 4,
    elevation: 1,
    shadowColor: colors.black,
  },
  searchIcon: {
    marginRight: wp(2),
    color: colors.black,
  },
  searchInput: {
    fontSize: RFValue(12),
    color: colors.black,
    fontFamily: FontPath.QuattrocentoRegular,
  },
  errorText: {
    color: "red",
    textAlign: "center",
    marginVertical: hp(2),
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.black_900,
  },
  upgradeButtonContainer: {
    position: "absolute",
    width: wp(100),
    height: hp(20),
    alignItems: "center",
    justifyContent: "center",
  },
  upgradeButton: {
    backgroundColor: colors.primary,
    padding: wp(3),
    borderRadius: 25,
    width: wp(80),
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.light_white_1,
    shadowColor: colors.black,
  },
  upgradeButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: "bold",
  },
  tabsContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    width: wp(80),
    alignSelf: "center",
    marginBottom: hp(1),
  },
  tabButton: {
    borderRadius: 100,
    width: isiPAD ? wp(18) : wp(30),
    justifyContent: "center",
    alignItems: "center",
    height: hp(4),
    backgroundColor: colors.primary,
    borderWidth: 3,
    borderColor: colors.gray_1,
    shadowColor: colors.black,
  },
  activeTabButton: {
    backgroundColor: colors.primary,
  },
  tabButtonText: {
    fontSize: RFValue(13),
    color: colors.white,
  },
  activeTabButtonText: {
    color: colors.white,
    fontWeight: "bold",
  },
});
