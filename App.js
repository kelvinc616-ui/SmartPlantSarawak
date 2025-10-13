// App.js
import React, { useEffect } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import { View, Text } from "react-native";

// Firebase Imports
import { db } from "./firebaseConfig";
import { collection, getDocs } from "firebase/firestore";

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

// 🔹 Tab Navigator
const Tab = createBottomTabNavigator();

// Main Tab Navigation (Home, Identify, Map, Profile)
function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ color, size }) => {
          let iconName;
          if (route.name === "Home") iconName = "home-outline";
          else if (route.name === "Identify") iconName = "camera-outline";
          else if (route.name === "Map") iconName = "map-outline";
          else if (route.name === "Profile") iconName = "person-outline";
          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: "#2E7D32",
        tabBarInactiveTintColor: "gray",
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Identify" component={IdentifyScreen} />
      <Tab.Screen name="Map" component={MapScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

// 🔹 Stack Navigator
const Stack = createNativeStackNavigator();

export default function App() {
  // 🧠 Test Firestore Connection on Startup (Optional)
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
      <Stack.Navigator initialRouteName="Login">
        {/* 🔐 Auth Screens */}
        <Stack.Screen
          name="Login"
          component={LoginScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="Register"
          component={RegisterScreen}
          options={{ title: "Register" }}
        />

        {/* 🌿 Main App */}
        <Stack.Screen
          name="Main"
          component={TabNavigator}
          options={{ headerShown: false }}
        />

        {/* 🔎 Additional Screens */}
        <Stack.Screen
          name="ObservationDetails"
          component={ObservationDetails}
          options={{ title: "Observation Details" }}
        />
        <Stack.Screen
          name="AdminDashboard"
          component={AdminDashboard}
          options={{ title: "Admin Dashboard" }}
        />
        <Stack.Screen
          name="IoTMonitoring"
          component={IoTMonitoringScreen}
          options={{ title: "IoT Monitoring" }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
