/* eslint-disable no-unused-vars */
/* eslint-disable react-native/no-color-literals */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable no-restricted-imports */

import { React, useState } from "react"
import { View, Text, TouchableOpacity, StyleSheet, Image, TextInput } from "react-native"
import { router } from "expo-router"
import { SafeAreaView } from "react-native-safe-area-context"

const MedScreen = () => {
  const [dosage, setDosage] = useState("0")
  const [frequency, setFrequency] = useState("never")
  const [takeWithFood, changeWithFood] = useState(false)
  const [takenBeforeFood, changeBeforeFood] = useState(false)
  const [preferredTime, changePreferredTime] = useState("")
  const [frequencyType, setFrequencyType] = useState("")
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
      <Text style={styles.title}>Med</Text>

      {/** Dosage */}
      <View style={styles.dosage}>
        <Text style={styles.dosageText}>Dosage:</Text>
        <TextInput
          style={styles.dosageInput}
          onChangeText={setDosage}
          value={dosage}
          keyboardType="numeric"
        />
      </View>

      {/** Frequency */}
      <View style={styles.frequency}>
        <Text style={styles.frequencyText}>Frequency:</Text>
        <TextInput style={styles.frequencyInput} onChange={setFrequency} value={frequency} />
      </View>

      {/** Frequency Type*/}
      <View style={styles.frequencyType}>
        <Text style={styles.frequencyTypeText}>Frequency Type:</Text>
        <TextInput
          style={styles.frequencyTypeInput}
          onChange={setFrequencyType}
          value={frequencyType}
          placeholder="daily"
        />
      </View>

      {/** With food */}
      <View style={styles.withFood}>
        <Text style={styles.withFoodText}>Taken with Food:</Text>
        <TextInput style={styles.withFoodInput} onChange={changeWithFood} value={takeWithFood} />
      </View>

      {/** Before Food */}
      <View style={styles.beforeFood}>
        <Text style={styles.beforeFoodText}>Taken before Food:</Text>
        <TextInput
          style={styles.beforeFoodInput}
          onChange={changeBeforeFood}
          value={takenBeforeFood}
        />
      </View>

      {/** Preferred Time */}
      <View style={styles.preferredTime}>
        <Text style={styles.preferredTimeText}>Preferred Time:</Text>
        <TextInput
          style={styles.preferredTimeInput}
          onChange={changePreferredTime}
          value={preferredTime}
          placeholder="12 00"
        />
      </View>

      <TouchableOpacity style={styles.button} onPress={() => {}}>
        <Text style={styles.buttonText}>Complete</Text>
      </TouchableOpacity>
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
  button: {
    alignSelf: "center",
    backgroundColor: "#4DB3D8",
    borderRadius: 6,
    paddingHorizontal: 16,
    paddingVertical: 18,
    width: "70%",
  },
  buttonText: {
    color: "#000000",
    fontSize: 24,
    fontWeight: "500",
    textAlign: "center",
  },
  container: {
    backgroundColor: "#FFFFFF",
    flex: 1,
    paddingHorizontal: 20,
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
