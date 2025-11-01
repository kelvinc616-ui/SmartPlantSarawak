import React, { useEffect } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { onAuthStateChanged } from "firebase/auth";
import { collection, getDocs } from "firebase/firestore";
import { auth, db } from "./firebaseConfig";

// Screens
import HomeScreen from "./screens/HomeScreen";
import IdentifyScreen from "./screens/IdentifyScreen";
import MapScreen from "./screens/MapScreen";
import ProfileScreen from "./screens/ProfileScreen";
import LoginScreen from "./screens/LoginScreen";
import RegisterScreen from "./screens/RegisterScreen";
import AdminDashboard from "./screens/AdminDashboard";
import IoTMonitoringScreen from "./screens/IoTMonitoringScreen";
import ObservationDetails from "./screens/ObservationDetails";
import ManageUsers from "./screens/ManageUsers";
import ManagePredictions from "./screens/ManagePredictions";

// Tab Navigators
import UserMain from "./navigation/UserMain";
import AdminMain from "./navigation/AdminMain";

// Stack Navigator
const Stack = createNativeStackNavigator();

export default function App() {
  // ✅ Firestore connection test AFTER user login
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const snapshot = await getDocs(collection(db, "users"));
          console.log(`✅ Firestore connected. Found ${snapshot.size} user(s).`);
        } catch (error) {
          console.error("❌ Firestore connection failed:", error);
        }
      } else {
        console.log("⚠️ Skipped Firestore test (user not logged in)");
      }
    });

    return unsubscribe;
  }, []);

  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Login"
        screenOptions={{ headerShown: false }}
      >
        {/* 🔐 Authentication Screens */}
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Register" component={RegisterScreen} />

        {/* 🌿 Main User & Admin Navigators */}
        <Stack.Screen name="UserMain" component={UserMain} />
        <Stack.Screen name="AdminMain" component={AdminMain} />

        {/* ⚙️ Admin Utility Screens */}
        <Stack.Screen
          name="AdminDashboard"
          component={AdminDashboard}
          options={{ title: "Admin Dashboard", headerShown: true }}
        />
        <Stack.Screen
          name="ManageUsers"
          component={ManageUsers}
          options={{ title: "Manage Users", headerShown: true }}
        />
        <Stack.Screen
          name="ManagePredictions"
          component={ManagePredictions}
          options={{ title: "Manage Predictions", headerShown: true }}
        />

        {/* 🌦️ IoT Monitoring */}
        <Stack.Screen
          name="IoTMonitoring"
          component={IoTMonitoringScreen}
          options={{ title: "IoT Monitoring", headerShown: true }}
        />

        {/* 🔍 Observation Details */}
        <Stack.Screen
          name="ObservationDetails"
          component={ObservationDetails}
          options={{ title: "Observation Details", headerShown: true }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
