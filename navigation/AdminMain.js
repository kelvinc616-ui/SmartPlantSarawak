import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";
import { Platform } from "react-native";

// Screens
import HomeScreen from "../screens/HomeScreen";
import IdentifyScreen from "../screens/IdentifyScreen";
import MapScreen from "../screens/MapScreen";
import ProfileScreen from "../screens/ProfileScreen";
import AdminDashboard from "../screens/AdminDashboard";

const Tab = createBottomTabNavigator();

export default function AdminMain() {
  return (
    <Tab.Navigator
      initialRouteName="Home"
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: "#2E7D32",
        tabBarInactiveTintColor: "gray",
        tabBarStyle: {
          backgroundColor: "#FFFFFF",
          borderTopWidth: 1,
          borderTopColor: "#E0E0E0",
          height: Platform.OS === "ios" ? 85 : 70, // ⬆️ slightly taller for visibility
          paddingBottom: Platform.OS === "ios" ? 25 : 15, // ⬆️ extra padding for iPhone & Android
          paddingTop: 8,
          position: "absolute", // keeps it above gesture navigation bar
          bottom: Platform.OS === "android" ? 10 : 0, // ⬆️ raises the bar a bit
          left: 10,
          right: 10,
          borderRadius: 20, // rounded corners for a cleaner floating look
          elevation: 5, // subtle shadow on Android
          shadowColor: "#000",
          shadowOpacity: 0.1,
          shadowRadius: 6,
        },
        tabBarIcon: ({ color, size }) => {
          let iconName;

          switch (route.name) {
            case "Home":
              iconName = "home-outline";
              break;
            case "Identify":
              iconName = "leaf-outline";
              break;
            case "Map":
              iconName = "map-outline";
              break;
            case "Profile":
              iconName = "person-outline";
              break;
            case "Admin":
              iconName = "settings-outline";
              break;
            default:
              iconName = "ellipse-outline";
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Identify" component={IdentifyScreen} />
      <Tab.Screen name="Map" component={MapScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
      <Tab.Screen name="Admin" component={AdminDashboard} />
    </Tab.Navigator>
  );
}
