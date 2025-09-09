import { ThemeTextProps } from "@/src/interface/Types";
import { FontPath } from "@/src/utils/FontPath";
import React from "react";
import { StyleSheet, Text } from "react-native";

const ThemeText = ({
  size = 16,
  children,
  color = "black",
  style,
  numberOfLines,
  ellipsizeMode,
  ...props
}: ThemeTextProps) => {
  return (
    <Text
      {...props}
      style={[styles.text, { fontSize: size, color: color }, style]}
      numberOfLines={numberOfLines}
      ellipsizeMode={ellipsizeMode}
    >
      {children}
    </Text>
  );
};

export default ThemeText;

const styles = StyleSheet.create({
  text: {
    fontFamily: FontPath.QuattrocentoRegular,
  },
});
