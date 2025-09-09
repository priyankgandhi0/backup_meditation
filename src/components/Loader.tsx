import { ActivityIndicator, StyleSheet, View } from "react-native";
import React from "react";
import { hp, wp } from "../helper/Responsive";
import { colors } from "../utils/colors";
import { LoaderProps } from "../interface/Types";
import { FocusAwareStatusBar } from "./FocusAwareStatusBar";

const Loader = ({ isBottom = false }: LoaderProps) => {
  return (
    <View
      style={[
        styles.lodingView,
        {
          height: hp(isBottom ? 100 : 80),
        },
      ]}
    >
        <FocusAwareStatusBar
              barStyle="light-content"
              translucent
              backgroundColor="transparent"
            />
      <View style={styles.loadingWhiteView}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    </View>
  );
};

export default Loader;

const styles = StyleSheet.create({
  lodingView: {
    width: wp(100),
    position: "absolute",
    justifyContent: "center",
    zIndex: 2,
    alignItems: "center",
    backgroundColor: colors.black_3,
  },
  loadingWhiteView: {
    backgroundColor: colors.white,
    width: wp(20),
    height: wp(20),
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 12,
  },
});
