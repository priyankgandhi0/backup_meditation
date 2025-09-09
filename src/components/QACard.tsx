import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Animated,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Image,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { wp, hp } from "../helper/Responsive";
import { colors } from "../utils/colors";

// --- Get Screen Dimensions ---
const screenWidth = Dimensions.get("window").width;
const isTablet = screenWidth >= 768; // Common breakpoint for tablets

interface QACardProps {
  id: string;
  question: string;
  answer: string;
  audioUrl?: string;
  backgroundColor?: string;
  currentlySpeakingId: string | null;
  isSpeaking: boolean;
  handlePlaySpeech: (id: string, text: string) => void;
}

interface SearchBarProps {
  onSearch: (text: string) => void;
  onVoiceInput: () => void;
  isRecording: boolean;
}

const SearchBar: React.FC<SearchBarProps> = ({
  onSearch,
  onVoiceInput,
  isRecording,
}) => {
  const [searchText, setSearchText] = useState("");

  const handleTextChange = (text: string) => {
    setSearchText(text);
    onSearch(text);
  };

  return (
    <View style={styles.searchContainer}>
      <View style={styles.searchInputContainer}>
        <Ionicons
          name="search"
          size={20}
          color={colors.gray_3}
          style={styles.searchIcon}
        />
        <TextInput
          style={styles.searchInput}
          placeholder="Search your question..."
          value={searchText}
          onChangeText={handleTextChange}
          placeholderTextColor={colors.gray_3}
        />
        <TouchableOpacity onPress={onVoiceInput} style={styles.voiceButton}>
          <Ionicons
            name={isRecording ? "mic" : "mic-outline"}
            size={24}
            color={isRecording ? colors.primary : colors.gray_3}
          />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const QACard: React.FC<QACardProps> = ({
  id,
  question,
  answer,
  audioUrl,
  backgroundColor,
  currentlySpeakingId,
  isSpeaking,
  handlePlaySpeech,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const isCurrentlyPlaying = id === currentlySpeakingId && isSpeaking;

  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
  };

  const cardBackgroundColor = backgroundColor || colors.white;

  return (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: cardBackgroundColor }]}
      onPress={toggleExpand}
      activeOpacity={0.8}
    >
      <View style={styles.questionContainer}>
        <Text style={styles.question}>{question}</Text>
        <Ionicons
          name={isExpanded ? "chevron-up" : "chevron-down"}
          size={24}
          color="rgba(0,0,0,0.6)"
        />
      </View>

      {isExpanded && (
        <View style={styles.answerContainer}>
          {isCurrentlyPlaying ? (
            <View style={styles.audioVisualizationContainer}>
              <Image
                source={require("../assets/appmainimage.png")}
                style={styles.audioVisImage}
              />
              <View style={[styles.concentricCircle, styles.circle1]} />
              <View style={[styles.concentricCircle, styles.circle2]} />
              <TouchableOpacity
                style={styles.audioVisPauseButton}
                onPress={() => handlePlaySpeech(id, answer)}
              >
                <Ionicons name={"pause"} size={wp(8)} color={colors.white} />
              </TouchableOpacity>
            </View>
          ) : (
            <>
              <Text style={styles.answer}>{answer}</Text>
              <TouchableOpacity
                style={styles.audioButton}
                onPress={() => handlePlaySpeech(id, answer)}
              >
                <Ionicons
                  name={"play-circle-outline"}
                  size={32}
                  color={colors.primary}
                />
                <Text style={styles.audioText}>Listen</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    width: isTablet ? wp(85) : wp(90),
    minHeight: isTablet ? hp(7) : hp(8),
    borderRadius: 15,
    padding: isTablet ? wp(3) : wp(4),
    marginVertical: hp(1),
    alignSelf: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  questionContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  question: {
    fontSize: isTablet ? wp(3.5) : wp(4),
    fontFamily: "Quattrocento",
    color: "#000",
    flex: 1,
    marginRight: wp(2),
  },
  answerContainer: {
    marginTop: isTablet ? hp(1.5) : hp(2),
    borderTopWidth: 1,
    borderTopColor: "rgba(0,0,0,0.1)",
    paddingTop: isTablet ? hp(1.5) : hp(2),
  },
  answer: {
    fontSize: isTablet ? wp(3.3) : wp(3.8),
    fontFamily: "Quattrocento",
    color: "#000",
    lineHeight: isTablet ? wp(4.8) : wp(5.5),
  },
  audioButton: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: hp(2),
    padding: wp(2),
    alignSelf: "flex-start",
  },
  audioText: {
    marginLeft: wp(2),
    fontSize: isTablet ? wp(3) : wp(3.5),
    fontFamily: "Quattrocento",
    color: colors.primary,
    padding: wp(2),
  },
  searchContainer: {
    paddingHorizontal: wp(4),
    paddingVertical: hp(2),
    borderBottomWidth: 1,
    borderBottomColor: colors.gray_1,
  },
  searchInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.light_gray_1,
    borderRadius: 25,
    paddingHorizontal: wp(4),
    height: isTablet ? hp(5.5) : hp(6),
  },
  searchIcon: {
    marginRight: wp(2),
  },
  searchInput: {
    flex: 1,
    fontSize: isTablet ? wp(3.4) : wp(3.8),
    fontFamily: "Quattrocento",
    color: colors.black,
  },
  voiceButton: {
    padding: wp(2),
  },
  audioVisualizationContainer: {
    width: wp(45),
    height: wp(45),
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
    alignSelf: "center",
    marginVertical: hp(1),
  },
  audioVisImage: {
    width: wp(25),
    height: wp(25),
    borderRadius: wp(12.5),
    zIndex: 2,
  },
  concentricCircle: {
    position: "absolute",
    borderRadius: 1000,
    borderWidth: 2,
    zIndex: 1,
  },
  circle1: {
    width: wp(35),
    height: wp(35),
    borderColor: "rgba(76, 127, 156, 0.5)",
  },
  circle2: {
    width: wp(45),
    height: wp(45),
    borderColor: "rgba(76, 127, 156, 0.25)",
  },
  audioVisPauseButton: {
    position: "absolute",
    width: wp(12),
    height: wp(12),
    borderRadius: wp(6),
    backgroundColor: colors.primary,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 3,
    bottom: hp(1),
  },
});

export { QACard, SearchBar };
export type { QACardProps };
