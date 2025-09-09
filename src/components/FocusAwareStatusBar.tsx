import { useIsFocused } from "@react-navigation/native";
import { StatusBar, StatusBarProps } from "react-native";
import React from "react";

export function FocusAwareStatusBar(
  props: React.JSX.IntrinsicAttributes &
    React.JSX.IntrinsicClassAttributes<StatusBar> &
    Readonly<StatusBarProps>
) {
  const isFocused = useIsFocused();

  return isFocused ? <StatusBar {...props} /> : null;
}
