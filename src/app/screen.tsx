/* eslint-disable no-restricted-imports */
import React from "react"
import { useLocalSearchParams, usePathname, useSegments } from "expo-router"

import CameraScreen from "@/presentation/screens/cameraScreen"
import CombinationScreen from "@/presentation/screens/combinationScreen"
import CommonUseSearchScreen from "@/presentation/screens/commonUseSearchScreen"
import FinderScreen from "@/presentation/screens/finderScreen"
import FoodTimingsScreen from "@/presentation/screens/foodTimingsScreen"
import HomeScreen from "@/presentation/screens/homeScreen"
import LoginScreen from "@/presentation/screens/loginScreen"
import ManualSearchScreen from "@/presentation/screens/manualSearch"
import MedicationDetailsScreen from "@/presentation/screens/medicationDetailsScreen"
import MedScreen from "@/presentation/screens/medScreen"
import MyMedScreen from "@/presentation/screens/myMedsScreen"
import ScheduleScreen from "@/presentation/screens/scheduleScreen"
import TrackerScreen from "@/presentation/screens/trackerScreen"

const screenRegistry: Record<string, React.ComponentType> = {
  myMeds: MyMedScreen,
  finder: FinderScreen,
  combination: CombinationScreen,
  schedule: ScheduleScreen,
  tracker: TrackerScreen,
  foodTimings: FoodTimingsScreen,
  home: HomeScreen,
  camera: CameraScreen,
  commonUseSearch: CommonUseSearchScreen,
  login: LoginScreen,
  manualSearch: ManualSearchScreen,
  med: MedScreen,
  medicationDetails: MedicationDetailsScreen,
}

export default function Screens() {
  console.log("SCREEN.tsx is running")
  const params = useLocalSearchParams<{ destination?: string | string[] }>()
  const screenName = Array.isArray(params.destination)
    ? params.destination[0]
    : params.destination || "home"

  const pathname = usePathname()
  const segments = useSegments()

  console.log("Screen parameter:", params.destination)
  console.log("Selected screen:", screenName)
  console.log("Pathname:", pathname)
  console.log("Segments:", segments)

  const ScreenComponent = screenRegistry[screenName]

  if (!ScreenComponent) {
    return <HomeScreen />
  }

  return <ScreenComponent />
}
