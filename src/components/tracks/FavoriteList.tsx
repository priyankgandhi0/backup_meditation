import React from "react";
import { View, FlatList, Text } from "react-native";

import { TrackItem } from "./TrackItem";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";
import { RFValue } from "../../helper/Responsive";
import { FavoritesListProps } from "@/src/interface/Types";
import { FlashList } from "@shopify/flash-list";

export const FavoritesList = ({
  tracks,
  onTrackPress,
  onToggleFavorite,
  loadingFavorites,
  isPremiumUser,
  isAuthenticated,
}: FavoritesListProps) => {
  return (
    <View>
      <>
      <FlatList
           data={tracks}
           ListEmptyComponent={() => (
            <Text
              style={{
                fontSize: RFValue(14),
                alignSelf: "center",
              }}
            >
              Tracks no found
            </Text>
          )}
          renderItem={({ item, index }) => (
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
                isFavorite={true}
                isAuthenticated={isAuthenticated}
              />
            // </Animated.View>
          )}
          />
      </>
    </View>
  );
};
