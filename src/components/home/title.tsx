import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import ThemeText from "../shared/theme-text";
import { colors } from "@/src/utils/colors";
import { homeCardStyles } from "@/src/styles/card-home.styles";
import { TitleHomeProps } from "@/src/interface/Types";
import { hp } from "@/src/helper/Responsive";

const TitleHome = ({ onClickSeeAll, title }: TitleHomeProps) => {
  //SEE ALL Arrow styling
  return (
    <View style={style.mainView}>
      <Text style={homeCardStyles.title}>{title}</Text>
      <TouchableOpacity style={style.button} onPress={onClickSeeAll}>
        <ThemeText
          style={{
            ...homeCardStyles.seeAll,
            textDecorationLine: "underline",
          }}
        >
          See All
        </ThemeText>
        <Ionicons
          size={14}
          color={colors.dark_mauve}
          name="chevron-forward"
          style={{ marginRight: 18 }}
        />
      </TouchableOpacity>
    </View>
  );
};

export default TitleHome;
const style = StyleSheet.create({
  mainView: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: hp(1),
  },
  button: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
});
