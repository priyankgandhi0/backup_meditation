import { ThemeTextTitleProps } from "@/src/interface/Types";
import { FontPath } from "@/src/utils/FontPath";
import React from "react";
import { StyleSheet, Text } from "react-native";

const ThemeTextTitle = ({
  size = 16,
  children,
  color = "black",
  style,
  numberOfLines,
  ellipsizeMode,
}: ThemeTextTitleProps) => {
  return (
    <Text
      style={[styles.text, { fontSize: size, color: color }, style]}
      numberOfLines={numberOfLines}
      ellipsizeMode={ellipsizeMode}
    >
      {children}
    </Text>
  );
};

export default ThemeTextTitle;

const styles = StyleSheet.create({
  text: {
    fontFamily: FontPath.Quattrocento,
  },
});
