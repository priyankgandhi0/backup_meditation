import React from "react";
import { Dimensions, FlatList, StyleSheet } from "react-native";
import ContentLoader, { Rect } from "react-content-loader/native";
import { hp, wp } from "../../helper/Responsive";
import { colors } from "@/src/utils/colors";
import { FlashList } from "@shopify/flash-list";

const CardLoader = () => {
  const { width } = Dimensions.get("window");
  const cardWidth = width * 0.47;
  return (
    <ContentLoader
      speed={1}
      width={cardWidth}
      height={200}
      viewBox="0 0 80 90"
      backgroundColor={colors.white_2}
      foregroundColor={colors.light_gray_1}
      style={styles.card}
    >
      <Rect x="0" y="10" rx="1" ry="1" width="150" height="100" />
    </ContentLoader>
  );
};

const SkeletonList = () => {
  const data = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

  return (
    <FlashList
      data={data}
      renderItem={() => <CardLoader />}
      estimatedItemSize={200}
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.flatList}
    />
  );
};

export default SkeletonList;

const styles = StyleSheet.create({
  card: {
    marginRight: 8,
    borderRadius: 8,
  },
  flatList: {
    paddingVertical: hp(2),
     paddingHorizontal: wp(2),
  },
});
