/* eslint-disable no-unused-vars */
/* eslint-disable react/no-unescaped-entities */
/* eslint-disable react-native/no-color-literals */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable no-restricted-imports */

import React, { useState } from "react"
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  TextInput,
  Switch,
  ScrollView,
} from "react-native"
import { router } from "expo-router"
import { SafeAreaView } from "react-native-safe-area-context"

import { useMealTimings } from "../hooks/useMealTimings"

const FoodTimingsScreen = () => {
  const { meals, setTime, setEnabled, addMeal } = useMealTimings()

  const [drafts, setDrafts] = useState({})
  const [errors, setErrors] = useState({})

  const [newName, setNewName] = useState("")
  const [newTime, setNewTime] = useState("")
  const [addError, setAddError] = useState(null)

  const commit = (id) => {
    const draft = drafts[id]
    if (draft === undefined) return
    if (setTime(id, draft)) {
      setDrafts((d) => {
        const { [id]: _removed, ...rest } = d
        return rest
      })
      setErrors((e) => ({ ...e, [id]: undefined }))
    } else {
      setErrors((e) => ({ ...e, [id]: "Use a time like 08:00" }))
    }
  }

  const handleAdd = () => {
    if (addMeal(newName, newTime)) {
      setNewName("")
      setNewTime("")
      setAddError(null)
    } else {
      setAddError("Enter a name and a time like 15:30.")
    }
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
      <Text style={styles.title}>Food Timings</Text>

      <ScrollView contentContainerStyle={styles.list} keyboardShouldPersistTaps="handled">
        <Text style={styles.help}>
          Your schedule uses these times for medications take with or before food.
        </Text>

        {meals.map((meal) => (
          <View key={meal.id} style={styles.card}>
            <View style={styles.cardRow}>
              <Text style={styles.mealName}>{meal.mealType}</Text>
              <Switch value={meal.enabled} onValueChange={(v) => setEnabled(meal.id, v)} />
            </View>
            <TextInput
              value={drafts[meal.id] ?? meal.scheduleTime ?? ""}
              onChangeText={(t) => setDrafts((d) => ({ ...d, [meal.id]: t }))}
              onEndEditing={() => commit(meal.id)}
              style={[styles.input, !meal.enabled && styles.inputDisabled]}
              placeholder="08:00"
              keyboardType="numbers-and-punctuation"
              editable={meal.enabled}
            />
            {errors[meal.id] ? <Text style={styles.errorText}>{errors[meal.id]}</Text> : null}
          </View>
        ))}

        {/*** Add another meal */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Add a meal or snack</Text>
          <TextInput
            value={newName}
            onChangeText={setNewName}
            style={styles.input}
            placeholder="Name, e.g. Supper"
          />
          <TextInput
            value={newTime}
            onChangeText={setNewTime}
            style={[styles.input, styles.spaced]}
            placeholder="Time, e.g. 21:00"
            keyboardType="numbers-and-punctuation"
          />
          {addError ? <Text style={styles.errorText}>{addError}</Text> : null}
          <TouchableOpacity style={styles.addButton} onPress={handleAdd}>
            <Text style={styles.addText}>Add</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  addButton: {
    alignItems: "center",
    backgroundColor: "#4DB3D8",
    borderRadius: 8,
    marginTop: 12,
    paddingVertical: 12,
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
  cardRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  cardTitle: {
    color: "#125348",
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 10,
  },
  container: {
    backgroundColor: "#FFFFFF",
    flex: 1,
    paddingHorizontal: 20,
  },
  errorText: {
    color: "#B91C1C",
    fontSize: 13,
    marginTop: 6,
  },
  help: {
    color: "#374151",
    fontSize: 15,
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
  inputDisabled: {
    backgroundColor: "#F3F4F6",
    color: "#9CA3AF",
  },
  list: {
    gap: 14,
    paddingBottom: 40,
  },
  mealName: {
    color: "#135348",
    fontSize: 20,
    fontWeight: "700",
  },
  spaced: {
    marginTop: 10,
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

export default FoodTimingsScreen
