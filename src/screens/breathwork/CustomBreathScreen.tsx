import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
} from "react-native";
import BreathworkCircle from "@/src/components/breathwork/BreathworkCircle";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "@/src/utils/colors";
import { trackScreenView } from "@/src/utils/analytics";

const CustomBreathScreen = () => {
  const [inhale, setInhale] = useState(4);
  const [hold, setHold] = useState(7);
  const [exhale, setExhale] = useState(8);
  const [isRunning, setIsRunning] = useState(false);

  useEffect(() => {
    trackScreenView("CustomBreath", "CustomBreathScreen");
  }, []);

  return (
    <LinearGradient colors={["#e0eafc", "#cfdef3"]} style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => setIsRunning(false)}>
          <Ionicons name="arrow-back" size={28} color={colors.primary} />
        </TouchableOpacity>
        <Text style={styles.title}>Custom Breathing</Text>
      </View>
      <View style={styles.inputRow}>
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Inhale</Text>
          <TextInput
            style={styles.input}
            keyboardType="numeric"
            value={inhale.toString()}
            onChangeText={(v) => setInhale(Number(v) || 0)}
            editable={!isRunning}
          />
        </View>
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Hold</Text>
          <TextInput
            style={styles.input}
            keyboardType="numeric"
            value={hold.toString()}
            onChangeText={(v) => setHold(Number(v) || 0)}
            editable={!isRunning}
          />
        </View>
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Exhale</Text>
          <TextInput
            style={styles.input}
            keyboardType="numeric"
            value={exhale.toString()}
            onChangeText={(v) => setExhale(Number(v) || 0)}
            editable={!isRunning}
          />
        </View>
      </View>
      <BreathworkCircle
        inhale={inhale}
        hold={hold}
        exhale={exhale}
        isRunning={isRunning}
      />
      <TouchableOpacity
        style={[styles.button, isRunning ? styles.stop : styles.start]}
        onPress={() => setIsRunning((r) => !r)}
      >
        <Text style={styles.buttonText}>{isRunning ? "Stop" : "Start"}</Text>
      </TouchableOpacity>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 60,
    marginBottom: 24,
    alignSelf: "flex-start",
    marginLeft: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: colors.primary,
    marginLeft: 16,
    fontFamily: "Quattrocento",
  },
  inputRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  inputGroup: {
    alignItems: "center",
    marginHorizontal: 8,
  },
  inputLabel: {
    fontSize: 16,
    color: colors.primary,
    marginBottom: 4,
    fontFamily: "Quattrocento",
  },
  input: {
    width: 48,
    height: 40,
    borderRadius: 8,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.primary,
    textAlign: "center",
    fontSize: 18,
    color: colors.black,
    fontFamily: "Quattrocento",
  },
  button: {
    marginTop: 32,
    paddingHorizontal: 40,
    paddingVertical: 16,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
    elevation: 2,
  },
  start: {
    backgroundColor: colors.primary,
  },
  stop: {
    backgroundColor: colors.red,
  },
  buttonText: {
    color: "white",
    fontSize: 20,
    fontWeight: "bold",
  },
});

export default CustomBreathScreen;
