import React from "react";
import { View, TouchableOpacity, StyleSheet, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from "react-native-reanimated";
import { NavigationProp, useNavigation } from "@react-navigation/native";
import { hp, isiPAD, RFValue, wp } from "../../helper/Responsive";
import ThemeTextTitle from "../shared/theme-title";
import ThemeText from "../shared/theme-text";
import FastImage from "react-native-fast-image";
import { TrackItemProps } from "@/src/interface/Types";
import { RootStackParamList } from "@/src/navigation/NavigationType";
import { colors } from "@/src/utils/colors";
import { useAppSelector } from "@/src/redux/StateType";

export const TrackItem = ({
  item,
  onTrackPress,
  onToggleFavorite,
  loadingFavorites,
  isPremiumUser,
  isAuthenticated,
}: TrackItemProps) => {
    const { userData } = useAppSelector((state) => state.auth);
  
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();

  const canInteract = !item.isPremium || isPremiumUser;


  const handleFavoritePress = () => {
    onToggleFavorite(item._id);
  };

  return (
    <TouchableOpacity
      style={[
        styles.trackContainer,
        item.isPremium && !isPremiumUser && styles.premiumTrackContainer,
      ]}
      onPress={() => console.log('====>')}
    >
      <View style={styles.player}>
        <Ionicons name="play" size={26} color={colors.light_pink_1} />
      </View>

      <View style={styles.trackItem}>
        {item.isPremium && !isPremiumUser && (
          <Pressable
            style={styles.lockOverlay}
            onPress={() => {
              navigation.navigate("BottomTabNavigator", {
                screen: "Home",
                params: {
                  screen: isAuthenticated ? "Subscription" : "Login",
                },
              });
            }}
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
          onPress={() => onTrackPress(item)}
          disabled={!canInteract}
          style={styles.trackPressContainer}
        >
          <FastImage
            source={{ uri: item.imageFilename }}
            style={styles.trackImage}
          />
          <View style={styles.textRowView}>
            <View>
              <ThemeTextTitle style={styles.trackTitle}>
                {item.name}
              </ThemeTextTitle>
              <ThemeText style={styles.trackDescription}>
                {item.description}
              </ThemeText>
            </View>

            {isAuthenticated && (
                <TouchableOpacity
                  onPress={handleFavoritePress}
                  disabled={loadingFavorites || !canInteract}
                >
                  <Ionicons
                    name={
                      item.favorites.includes(userData.user?.id || "")
                        ? "heart"
                        : "heart-outline"
                    }
                    size={28}
                    color={colors.light_pink_1}
                  />
                </TouchableOpacity>
            )}
          </View>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
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
  gradientContainer: {
    borderRadius: 10,
    borderWidth: 3,
    borderColor: colors.gray_1,
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
  },
  trackDescription: {
    fontSize: RFValue(10),
    color: "gray",
    maxWidth: wp(60),
    marginTop: hp(1),
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
  lockText: {
    color: colors.white,
    fontWeight: "bold",
  },
  textRowView: {
    flexDirection: "row",
    justifyContent: "space-between",
    flex: 1,
    marginHorizontal: wp(2),
  },
  player: {
    position: "absolute",
    right: wp(5),
    bottom: hp(2),
  },
  lockIcons: {
    marginRight: wp(6),
    marginTop: hp(1),
  },
});
