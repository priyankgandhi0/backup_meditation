import React from "react";
import { View, FlatList, ActivityIndicator, TouchableOpacity, Text } from "react-native";
import { TrackItem } from "./TrackItem";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";
import { TrackListProps } from "@/src/interface/Types";
import { colors } from "@/src/utils/colors";

export const TrackList = ({
  tracks,
  isLoading,
  onTrackPress,
  onToggleFavorite,
  loadingFavorites,
  isPremiumUser,
  isAuthenticated,
}: TrackListProps) => {
  return (
    <View>
      {isLoading ? (
        <ActivityIndicator size="large" color={colors.green} />
      ) : (
        tracks?.map((item, index) => {
          return (
            // <Animated.View
            //   key={item._id}
            //   entering={FadeIn.delay(index * 100)}
            //   exiting={FadeOut}
            // >
              <TrackItem
                item={item}
                index={index}
                onTrackPress={onTrackPress}
                onToggleFavorite={onToggleFavorite}
                loadingFavorites={loadingFavorites}
                isPremiumUser={isPremiumUser}
                isFavorite={false}
                isAuthenticated={isAuthenticated}
              />
            // </Animated.View>
          );
        })
      )}
    </View>
  );
};
