import { useEffect, useState } from "react"
import { Slot, SplashScreen } from "expo-router"
import { useFonts } from "@expo-google-fonts/space-grotesk"
import { KeyboardProvider } from "react-native-keyboard-controller"
import { initialWindowMetrics, SafeAreaProvider } from "react-native-safe-area-context"

import rawMedicationData from "@/data/local/medications.json"
import { initialiseDatabase } from "@/data/local/sqlite/create_database"
import db from "@/data/local/sqlite/database"
import {
  countMedicationReferences,
  importMedicationReferences,
} from "@/data/local/sqlite/medicationReference"
import { resetDatabase } from "@/data/local/sqlite/resetDatabase"
import { initI18n } from "@/i18n"
import { ThemeProvider } from "@/theme/context"
import { customFontsToLoad } from "@/theme/typography"
import { loadDateFnsLocale } from "@/utils/formatDate"

console.log("layout module loaded")
SplashScreen.preventAutoHideAsync()

for (const t of ["mealSchedule", "medicationSchedule", "interactionRecord"]) {
  const cols = db.execute(`PRAGMA table_info(${t})`).rows?._array?.map((c) => c.name)
  console.log("SCHEMA", t, JSON.stringify(cols))
}

if (__DEV__) {
  // Load Reactotron configuration in development. We don't want to
  // include this in our production bundle, so we are using `if (__DEV__)`
  // to only execute this in development.
  console.log("before Reactotron")
  require("@/devtools/ReactotronConfig")
  console.log("after Reactotron")
}

export default function Root() {
  console.log("Root rendered")
  type MedicationImportRecord = {
    medication_name: string
    common_names?: unknown
    common_use?: string | null
    contra_indication?: string | null
    cautions?: string | null
    side_effects?: string | null
    patient_advice?: string | null
  }

  const [fontsLoaded, fontError] = useFonts(customFontsToLoad)
  const [isI18nInitialized, setIsI18nInitialized] = useState(false)
  const medicationData = rawMedicationData as unknown as MedicationImportRecord[]

  useEffect(() => {
    console.log("database effect started")
    try {
      resetDatabase()
      console.log("initialising database")
      initialiseDatabase()
      if (countMedicationReferences() === 0) {
        console.log("creating medications")
        for (const item of medicationData) {
          importMedicationReferences([item])
        }
      }
    } catch (error) {
      console.log("Error initialising database:", error)
    }
    initI18n()
      .then(() => setIsI18nInitialized(true))
      .then(() => loadDateFnsLocale())
  }, [medicationData])

  const loaded = fontsLoaded && isI18nInitialized

  useEffect(() => {
    if (fontError) throw fontError
  }, [fontError])

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync()
    }
  }, [loaded])

  if (!loaded) {
    return null
  }

  return (
    <SafeAreaProvider initialMetrics={initialWindowMetrics}>
      <ThemeProvider>
        <KeyboardProvider>
          <Slot />
        </KeyboardProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  )
}
