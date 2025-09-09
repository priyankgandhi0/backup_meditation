import React from "react";
import { View, Text, TouchableOpacity, StyleSheet, Modal } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Slider } from "@miblanchard/react-native-slider";
import { useAudioEffects } from "../.././context/AudioEffectsContext";
import { modalStyles } from "../.././/styles/modal.styles";
import { EFFECT_SOUNDS } from "@/src/utils/JsonData";
import { colors } from "@/src/utils/colors";
import { hp, wp } from "@/src/helper/Responsive";
import { EffectsModalProps } from "@/src/interface/Types";

export const EffectsModal = ({ visible, onClose }: EffectsModalProps) => {
  const { activeEffects, effectVolumes, toggleEffect, changeEffectVolume } =
    useAudioEffects();

  return (
    <Modal
      visible={visible}
      onRequestClose={onClose}
      animationType="slide"
      transparent={true}
    >
      <View style={modalStyles.modalOverlay}>
        <View style={modalStyles.modalContainer}>
          <Text style={modalStyles.modalTitle}>Effects</Text>
          {Object.keys(effectVolumes).map((effectName, key) => (
            <View key={effectName} style={modalStyles.modalItem}>
              <Text style={styles.effectText}>
                {EFFECT_SOUNDS[key].icon}
                {effectName}
              </Text>
              <View style={styles.controlRow}>
                <Slider
                  value={effectVolumes[effectName]}
                  minimumValue={0}
                  maximumValue={1}
                  containerStyle={styles.slider}
                  minimumTrackTintColor={colors.dark_mauve_3}
                  maximumTrackTintColor={colors.gray_1}
                  thumbTintColor={colors.dark_mauve_3}
                  onValueChange={(value) =>
                    changeEffectVolume(effectName, value[0])
                  }
                />
                <TouchableOpacity onPress={() => toggleEffect(effectName)}>
                  <Ionicons
                    name={
                      activeEffects.includes(effectName)
                        ? "volume-high"
                        : "volume-mute"
                    }
                    size={24}
                    color={
                      activeEffects.includes(effectName)
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
  effectText: {
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
