import React, { useEffect } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import { collection, getDocs } from "firebase/firestore";
import { db } from "./firebaseConfig";

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

// Tab Navigators
import UserMain from "./navigation/UserMain";
import AdminMain from "./navigation/AdminMain";

// Stack Navigator
const Stack = createNativeStackNavigator();

export default function App() {
  // ✅ Optional: Test Firestore connection on startup
  useEffect(() => {
    async function testFirebase() {
      try {
        const snapshot = await getDocs(collection(db, "users"));
        console.log(`✅ Connected to Firestore! Found ${snapshot.size} user(s).`);
      } catch (error) {
        console.error("❌ Firestore connection failed:", error);
      }
    }
    testFirebase();
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

        {/* 🌿 Main User + Admin Navigators */}
        <Stack.Screen name="UserMain" component={UserMain} />
        <Stack.Screen name="AdminMain" component={AdminMain} />

        {/* ⚙️ Additional Admin & Utility Screens */}
        <Stack.Screen
          name="AdminDashboard"
          component={AdminDashboard}
          options={{ title: "Admin Dashboard" }}
        />
        
        {/*for managing users*/}
        <Stack.Screen name="ManageUsers" component={ManageUsers} /> 

        <Stack.Screen
          name="IoTMonitoring"
          component={IoTMonitoringScreen}
          options={{ title: "IoT Monitoring" }}
        />
        <Stack.Screen
          name="ObservationDetails"
          component={ObservationDetails}
          options={{ title: "Observation Details" }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
