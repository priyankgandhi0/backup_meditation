import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Pressable,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Slider } from "@miblanchard/react-native-slider";
import { useAudioEffects } from "../.././context/AudioEffectsContext";
import { colors } from "@/src/utils/colors";
import { modalStyles } from "@/src/styles/modal.styles";
import { hp, wp } from "@/src/helper/Responsive";
import { FrequenciesModalProps } from "@/src/interface/Types";

export const FrequenciesModal = ({
  visible,
  onClose,
}: FrequenciesModalProps) => {
  const {
    activeFrequencies,
    frequencyVolumes,
    toggleFrequency,
    changeFrequencyVolume,
  } = useAudioEffects();

  return (
    <Modal
      visible={visible}
      onRequestClose={onClose}
      animationType="slide"
      transparent={true}
    >
      <View style={modalStyles.modalOverlay}>
        <View style={modalStyles.modalContainer}>
          <Pressable
            style={{
              alignSelf: "flex-end",
            }}
          >
            <Ionicons name="close" size={24} color="black" onPress={onClose} />
          </Pressable>
          <Text style={modalStyles.modalTitle}>Frequencies</Text>
          {Object.keys(frequencyVolumes).map((freqName) => (
            <View key={freqName} style={modalStyles.modalItem}>
              <Text style={styles.frequencyText}>{freqName}</Text>
              <View style={styles.controlRow}>
                <Slider
                  value={frequencyVolumes[freqName]}
                  minimumValue={0}
                  maximumValue={1}
                  containerStyle={styles.slider}
                  minimumTrackTintColor={colors.dark_mauve_3}
                  maximumTrackTintColor={colors.gray_1}
                  thumbTintColor={colors.dark_mauve_3}
                  onValueChange={(value) =>
                    changeFrequencyVolume(freqName, value[0])
                  }
                />
                <TouchableOpacity onPress={() => toggleFrequency(freqName)}>
                  <Ionicons
                    name={
                      activeFrequencies.includes(freqName)
                        ? "volume-high"
                        : "volume-mute"
                    }
                    size={24}
                    color={
                      activeFrequencies.includes(freqName)
                        ? colors.dark_mauve_3
                        : colors.dark_gray_1
                    }
                  />
                </TouchableOpacity>
              </View>
            </View>
          ))}
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Text style={styles.closeButtonText}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  controlRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  frequencyText: {
    fontSize: 14,
    color: colors.black,
  },
  slider: {
    flex: 1,
  },
  closeButton: {
    marginTop: hp(2),
    padding: wp(4),
    backgroundColor: colors.dark_mauve_4,
    borderRadius: 5,
    alignItems: "center",
  },
  closeButtonText: {
    color: colors.white,
    fontWeight: "bold",
  },
});
