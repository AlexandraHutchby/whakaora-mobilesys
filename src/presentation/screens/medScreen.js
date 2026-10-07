/* eslint-disable no-unused-vars */
/* eslint-disable react-native/no-color-literals */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable no-restricted-imports */

import { React, useState } from "react"
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  TextInput,
  Switch,
} from "react-native"
import { router } from "expo-router"
import { useLocalSearchParams } from "expo-router"
import { SafeAreaView } from "react-native-safe-area-context"

import { saveUserMedication } from "@/application/services/medicationService"

const frequencies = ["Never", "Once", "Daily", "Weekly"]
const frequencyTypes = ["Day", "Week", "Month"]

const MedScreen = () => {
  const [dosage, setDosage] = useState("0")
  const [frequency, setFrequency] = useState("never")
  const [takeWithFood, setTakeWithFood] = useState(false)
  const [takenBeforeFood, setTakenBeforeFood] = useState(false)
  const [preferredTime, setPreferredTime] = useState("")
  const [frequencyType, setFrequencyType] = useState("")

  const {
    medicationReferenceId,
    medicationName,
    userMedicationId,
    customName: existingCustomName,
  } = useLocalSearchParams()

  const originalName = String(medicationName || "")
  const [customName, setCustomName] = useState(String(existingCustomName || medicationName || ""))

  const completeMedication = () => {
    if (!medicationName && !userMedicationId) return
    saveUserMedication({
      id: userMedicationId ? Number(userMedicationId) : undefined,
      medicationReferenceId: medicationReferenceId ? Number(medicationReferenceId) : null,
      medicationName: String(medicationName || customName),
      customName: customName.trim() || null,
    })

    router.replace({
      pathname: "/screen",
      params: { destination: "myMeds" },
    })
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          {/** Back Arrow */}
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Image
              source={require("../../../assets/icons/back.png")}
              style={styles.backIcon}
              resizeMode="contain"
            />

            <Text style={styles.title}>
              {userMedicationId ? "Edit medication" : "Add medication"}
            </Text>

            <View style={styles.card}>
              <Text style={styles.label}>Name shown in My Meds</Text>
              <TextInput
                value={customName}
                onChangeText={setCustomName}
                placeholder="Give this medication a name"
                style={styles.nicknameInput}
                autoCapitalize="sentences"
              />
              <Text style={styles.originalLabel}>Reference Medication</Text>
              <Text style={styles.originalName}>{originalName || "Not selected"}</Text>
            </View>

            <View style={styles.card}>
              {/** DOSAGE */}
              <Text style={styles.cardTitle}>Dosage</Text>
              <Text style={styles.label}>Amount</Text>
              <TextInput
                value={dosage}
                onChangeText={setDosage}
                style={styles.input}
                keyboardType="numeric"
                placeholder="0"
              />

              {/** FREQUENCY */}
              <Text style={styles.label}>How often?</Text>
              <View style={styles.optionRow}>
                {frequencies.map((option) => (
                  <TouchableOpacity
                    key={option}
                    style={[styles.option, frequency === option && styles.optionSelected]}
                    onPress={() => setFrequency(option)}
                  >
                    <Text
                      style={[styles.optionText, frequency === option && styles.optionTextSelected]}
                    >
                      {option}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/** FREQUENCY UNIT */}
              <Text style={styles.label}>Frequency Unit</Text>
              <View style={styles.optionRow}>
                {frequencyTypes.map((option) => (
                  <TouchableOpacity
                    key={option}
                    style={[styles.option, frequencyType === option && styles.optionSelected]}
                    onPress={() => setFrequencyType(option)}
                  >
                    <Text
                      style={[
                        styles.optionText,
                        frequencyType === option && styles.optionTextSelected,
                      ]}
                    >
                      Per {option.toLowerCase()}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.card}>
              <Text style={styles.cardTitle}>Instructions</Text>

              {/** WITH FOOD */}
              <View style={styles.switchRow}>
                <Text style={styles.switchLabel}>Take with food</Text>
                <Switch value={takeWithFood} onValueChange={setTakeWithFood} />
              </View>

              {/** BEFORE FOOD */}
              <View style={styles.switchRow}>
                <Text style={styles.switchLabel}>Take before food</Text>
                <Switch value={takenBeforeFood} onValueChange={setTakeWithFood} />
              </View>

              {/** PREFERRED TIME */}
              <Text style={styles.label}>Preferred Time</Text>
              <TextInput
                value={preferredTime}
                onChangeText={setPreferredTime}
                style={styles.input}
                placeholder="For example, 08:00"
                keyboardType="numbers-and-punctuation"
              />
            </View>

            <TouchableOpacity style={styles.completeButton} onPress={completeMedication}>
              <Text style={styles.completeText}>
                {userMedicationId ? "Save changes" : "Add to My Meds"}
              </Text>
            </TouchableOpacity>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  backButton: {
    alignSelf: "flex-end",
    marginRight: 8,
    marginTop: 16,
  },
  backIcon: {
    height: 30,
    width: 30,
  },
  card: {
    backgroundColor: "#F5FAF9",
    borderRadius: 12,
    marginBottom: 16,
    padding: 16,
  },
  cardTitle: {
    color: "#135348",
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 14,
  },
  completeButton: {
    alignItems: "center",
    backgroundColor: "#4DB3D8",
    borderRadius: 8,
    marginTop: 4,
    paddingVertical: 16,
  },
  completeText: {
    color: "#111827",
    fontSize: 18,
    fontWeight: "700",
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  flex: {
    flex: 1,
  },
  input: {
    backgroundColor: "#FFFFFF",
    borderColor: "#D1D5DB",
    borderRadius: 8,
    borderWidth: 1,
    color: "#111827",
    fontSize: 16,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  label: {
    color: "#374151",
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 7,
    marginTop: 12,
  },
  nicknameInput: {
    backgroundColor: "#FFFFFF",
    borderColor: "#4DB3D8",
    borderRadius: 8,
    borderWidth: 2,
    color: "#111827",
    paddingHorizontal: 12,
    paddingVertical: 11,
  },
  option: {
    borderColor: "#B8D8D4",
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  optionRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  optionSelected: {
    color: "#000000",
  },
  optionText: {
    color: "#135348",
    fontWeight: "600",
  },
  optionTextSelected: {
    color: "#000000",
  },
  originalLabel: {
    color: "#6B7280",
    fontSize: 12,
    marginTop: 16,
  },
  originalName: {
    color: "#374151",
    fontSize: 15,
    marginTop: 4,
  },
  safeArea: {
    backgroundColor: "#FFFFFF",
    flex: 1,
  },
  switchLabel: {
    color: "#374151",
    fontSize: 16,
  },
  switchRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
  },
  title: {
    color: "#135348",
    fontSize: 50,
    fontWeight: "600",
    marginBottom: 32,
    marginTop: 8,
    textAlign: "center",
  },
})

export default MedScreen
