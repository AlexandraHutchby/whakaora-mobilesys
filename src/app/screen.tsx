import { useLocalSearchParams } from "expo-router";

import HomeScreen from "@/presentation/screens/homeScreen";
import MyMedScreen from "@/presentation/screens/myMedsScreen";
import FinderScreen from "@/presentation/screens/finderScreen";
import CombinationScreen from "@/presentation/screens/combinationScreen";
import ScheduleScreen from "@/presentation/screens/scheduleScreen";
import TrackerScreen from "@/presentation/screens/trackerScreen";
import FoodTimingsScreen from "@/presentation/screens/foodTimingsScreen";
import CameraScreen from "@/presentation/screens/cameraScreen";
import CommonUseSearchScreen from "@/presentation/screens/commonUseSearchScreen";
import LoginScreen from "@/presentation/screens/loginScreen";
import ManualSearchScreen from "@/presentation/screens/manualSearch";
import MedScreen from "@/presentation/screens/medScreen";
import React from "react";

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
};

export default function Screens() {
    const params = useLocalSearchParams<{ screen?: string | string[] }>();
    const screenName = Array.isArray(params.screen)
        ? params.screen[0]
        : params.screen || "home";

    console.log("Screen parameter:", params.screen);
    console.log("Selected screen:", screenName);

    const ScreenComponent = screenRegistry[screenName];

    if (!ScreenComponent) {
        return <HomeScreen />;
    }

    return <ScreenComponent />;
}