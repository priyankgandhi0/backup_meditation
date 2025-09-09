import React from "react";
import { StyleSheet, Text, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { wp } from "../helper/Responsive";
import { colors } from "../utils/colors";

interface TopicCardProps {
  title: string;
  backgroundColor: string;
  onPress: () => void;
}

const TopicCard: React.FC<TopicCardProps> = ({
  title,
  backgroundColor,
  onPress,
}) => {
  return (
    <TouchableOpacity
      style={[styles.card, { backgroundColor }]}
      onPress={onPress}
      activeOpacity={0.8} // Added activeOpacity for better feedback
    >
      <Text style={styles.title}>{title}</Text>
      <Ionicons
        name="chevron-forward-circle"
        size={23}
        color="rgba(0,0,0,0.6)" // Adjusted icon color for visibility
        style={styles.icon}
      />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    width: wp(28),
    height: wp(28),
    borderRadius: 20,
    padding: wp(4),
    margin: wp(1),
    justifyContent: "space-between",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  title: {
    fontSize: wp(4.2), // Slightly adjusted font size
    fontFamily: "Quattrocento",
    color: "#000",
    fontWeight: "600",
  },
  icon: {
    alignSelf: "flex-end",
  },
});

export default TopicCard;
