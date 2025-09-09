import { ActivityIndicator, StyleSheet, TouchableOpacity } from "react-native";
import React from "react";
import { colors } from "@/src/utils/colors";
import ThemeText from "../shared/theme-text";
import { hp, wp } from "@/src/helper/Responsive";
import { AuthButtonProps } from "@/src/interface/Types";

const AuthButton = ({
  onPress,
  isLoading,
  buttonName,
  buttonStyle,
}: AuthButtonProps) => {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[styles.buttonWrapper, buttonStyle]}
    >
      {isLoading ? (
        <ActivityIndicator color={colors.white} />
      ) : (
        <ThemeText style={styles.buttonText}>{buttonName}</ThemeText>
      )}
    </TouchableOpacity>
  );
};

export default AuthButton;

const styles = StyleSheet.create({
  buttonWrapper: {
    width: wp(85),
    height: hp(6),
    marginVertical: hp(1),
    backgroundColor: colors.primary,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  buttonText: {
    color: colors.white,
    fontSize: 16,
    letterSpacing: 2,
  },
});
