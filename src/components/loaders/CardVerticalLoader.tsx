import React from "react";
import { Dimensions, FlatList, StyleSheet } from "react-native";
import ContentLoader, { Rect } from "react-content-loader/native";
import { colors } from "@/src/utils/colors";
import { FlashList } from "@shopify/flash-list";

const CardVerticalLoader = () => {
  const { width } = Dimensions.get("window");

  const cardWidth = width * 1;
  return (
    <ContentLoader
      speed={1}
      width={cardWidth}
      height={200}
      viewBox="0 0 80 40"
      backgroundColor={colors.white_2}
      foregroundColor={colors.light_gray_1}
      style={styles.card}
    >
      <Rect x="0" y="2" rx="40" ry="1" width="120" height="100" />
    </ContentLoader>
  );
};

const SkeletonVerticalList = () => {
  const data = [1, 2, 3, 4];

  return (
    <FlashList
      data={data}
      renderItem={() => <CardVerticalLoader />}
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.flatList}
      estimatedItemSize={200}
    />
  );
};

export default SkeletonVerticalList;

const styles = StyleSheet.create({
  card: {
    borderRadius: 8,
    marginHorizontal: "auto",
    paddingHorizontal: 10,
    overflow: "hidden",
  },
  flatList: {
    paddingVertical: 20,
  },
});
