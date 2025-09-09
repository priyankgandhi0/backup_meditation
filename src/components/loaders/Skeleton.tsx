import React from "react";
import { StyleSheet } from "react-native";
import ContentLoader, { Rect, Circle } from "react-content-loader/native";
import { colors } from "@/src/utils/colors";

const SkeletonLoader  = () => (
  <ContentLoader
    speed={1.5}
    width={300}
    height={200}
    viewBox="0 0 300 60"
    backgroundColor={colors.white_2}
    foregroundColor={colors.light_gray_1}
    style={styles.container}
  >
    <Circle cx="30" cy="30" r="30" />
    <Rect x="70" y="10" rx="4" ry="4" width="180" height="10" />
    <Rect x="70" y="30" rx="4" ry="4" width="140" height="10" />
  </ContentLoader>
);

const styles = StyleSheet.create({
  container: {
    marginVertical: 10,
    marginHorizontal: 20,
  },
});

export default SkeletonLoader;
