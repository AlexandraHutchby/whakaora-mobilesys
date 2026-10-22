/* eslint-disable no-unused-vars */
/* eslint-disable react/no-unescaped-entities */
/* eslint-disable react-native/no-color-literals */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable no-restricted-imports */

import { React, useState } from "react"
import { View, Text, TouchableOpacity, StyleSheet, Image, ScrollView } from "react-native"
import { router } from "expo-router"
import { SafeAreaView } from "react-native-safe-area-context"

import { useCombinations } from "../hooks/useCombinations"
import { useMedicationList } from "../hooks/useMedicationList"

const CombinationScreen = () => {
  const { medications } = useMedicationList()
  const { combinations, add, remove } = useCombinations()
  const [first, setFirst] = useState(null)
  const [second, setSecond] = useState(null)
  const [error, setError] = useState(null)

  const nameOf = (id) => medications.find((m) => m.id === id)?.displayName ?? "Removed medication"
  const handleAdd = () => {
    if (first === null || second === null) return
    if (add(first, second) === null) {
      setError("That combination is already saved")
      return
    }
    setError(null)
    setFirst(null)
    setSecond(null)
  }

  return (
    <SafeAreaView style={styles.container}>
      {/** Back Arrow */}
      <TouchableOpacity style={styles.backButton} activeOpacity={0.7} onPress={() => router.back()}>
        <Image
          source={require("../../../assets/icons/back.png")}
          style={styles.backIcon}
          resizeMode="contain"
        />
      </TouchableOpacity>

      {/** Title */}
      <Text style={styles.title}>Combinations</Text>

      <ScrollView contentContainerStyle={styles.list}>
        <Text style={styles.text}>Do you have any meds that don't work together?</Text>
        {/** Existing Combination */}
        {combinations.map((c) => (
          <View key={c.id} style={styles.row}>
            <TouchableOpacity style={styles.deleteButton} onPress={() => remove(c.id)}>
              <Image
                source={require("../../../assets/icons/x.png")}
                style={styles.deleteIcon}
                resizeMode="contain"
              />
            </TouchableOpacity>
            <Text style={styles.pairText}>
              {nameOf(c.userMedicationId)} + {nameOf(c.interactingMedicationId)}
            </Text>
          </View>
        ))}

        {/** Add New */}
        {medications.length < 2 ? (
          <Text style={styles.help}>
            Add at least two medications in My Meds to record a combination
          </Text>
        ) : (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Add a combination</Text>

            <Text style={styles.label}>First medication</Text>
            <View style={styles.optionRow}>
              {medications.map((m) => (
                <TouchableOpacity
                  key={m.id}
                  style={[styles.option, first === m.id && styles.optionSelected]}
                  onPress={() => {
                    setFirst(m.id)
                    if (second === m.id) setSecond(null)
                  }}
                >
                  <Text style={[styles.optionText, first === m.id && styles.optionTextSelected]}>
                    {m.displayName}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.label}>Shouldn't be taken with</Text>
            <View style={styles.optionRow}>
              {medications
                .filter((m) => m.id !== first)
                .map((m) => (
                  <TouchableOpacity
                    key={m.id}
                    style={[styles.option, second === m.id && styles.optionSelected]}
                    onPress={() => setSecond(m.id)}
                  >
                    <Text style={[styles.optionText, second === m.id && styles.optionTextSelected]}>
                      {m.displayName}
                    </Text>
                  </TouchableOpacity>
                ))}
            </View>

            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            <TouchableOpacity
              style={[styles.addButton, (first === null || second === null) && styles.addDisabled]}
              disabled={first === null || second === null}
              onPress={handleAdd}
            >
              <Text style={styles.addText}>Save Combination</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  addButton: {
    alignItems: "center",
    backgroundColor: "#4DB3D8",
    borderRadius: 8,
    marginTop: 16,
    paddingVertical: 12,
  },
  addDisabled: {
    opacity: 0.4,
  },
  addText: {
    color: "#111827",
    fontSize: 16,
    fontWeight: "700",
  },
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
    padding: 16,
  },
  cardTitle: {
    color: "#135348",
    fontSize: 20,
    fontWeight: "700",
  },
  container: {
    backgroundColor: "#FFFFFF",
    flex: 1,
    paddingHorizontal: 20,
  },
  deleteButton: {
    paddingHorizontal: 6,
  },
  deleteIcon: {
    height: 30,
    width: 30,
  },
  errorText: {
    color: "#B91C1C",
    fontSize: 13,
    marginTop: 10,
  },
  help: {
    color: "#374151",
    fontSize: 15,
  },
  label: {
    color: "#374151",
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 7,
    marginTop: 14,
  },
  list: {
    gap: 14,
    paddingBottom: 40,
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
  optionText: {
    color: "#135348",
    fontWeight: "600",
  },
  optionTextSelected: {
    color: "#000000",
  },
  pairText: {
    color: "#000000",
    flex: 1,
    fontSize: 18,
    paddingHorizontal: 10,
  },
  row: {
    alignItems: "center",
    borderColor: "#000000",
    borderRadius: 4,
    borderWidth: 1,
    flexDirection: "row",
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  text: {
    color: "#374151",
    fontSize: 16,
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

export default CombinationScreen
