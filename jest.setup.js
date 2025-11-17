import "@testing-library/jest-native/extend-expect";

jest.mock("@react-navigation/native", () => ({
  useNavigation: () => ({ navigate: jest.fn() }),
  NavigationContainer: ({ children }) => children,
}));

jest.mock("@react-navigation/native-stack", () => ({
  createNativeStackNavigator: () => {
    return {
      Navigator: ({ children }) => children,
      Screen: () => null,
    };
  },
}));


// -------- MOCK EXPO MODULES -------- //
jest.mock("expo-asset", () => ({}));
jest.mock("expo-font", () => ({}));

jest.mock("expo-location", () => ({
  requestForegroundPermissionsAsync: jest.fn(() =>
    Promise.resolve({ status: "granted" })
  ),
  getCurrentPositionAsync: jest.fn(() =>
    Promise.resolve({
      coords: { latitude: 1.55, longitude: 110.34 }
    })
  )
}));

jest.mock("expo-image-picker", () => ({
  requestCameraPermissionsAsync: jest.fn(() =>
    Promise.resolve({ status: "granted" })
  ),
  requestMediaLibraryPermissionsAsync: jest.fn(() =>
    Promise.resolve({ status: "granted" })
  ),
  launchCameraAsync: jest.fn(() =>
    Promise.resolve({ cancelled: false, assets: [{ uri: "test.jpg" }] })
  ),
  launchImageLibraryAsync: jest.fn(() =>
    Promise.resolve({ cancelled: false, assets: [{ uri: "test.jpg" }] })
  )
}));

// -------- MOCK RN MAPS -------- //
jest.mock("react-native-maps", () => {
  const React = require("react");
  const { View } = require("react-native");
  return {
    __esModule: true,
    default: View,
    Marker: View,
    Callout: View,
    PROVIDER_GOOGLE: "google",
  };
});

// -------- MOCK ASYNC STORAGE -------- //
jest.mock("@react-native-async-storage/async-storage", () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn()
}));

// -------- MOCK FIREBASE CONFIG -------- //
jest.mock("./firebaseConfig", () => ({
  auth: { currentUser: { uid: "test-user" } },
  db: {},
  storage: {},
}));

// -------- MOCK EXPO VECTOR ICONS -------- //
jest.mock("@expo/vector-icons", () => {
  return {
    Ionicons: () => null,
    MaterialIcons: () => null,
    AntDesign: () => null,
    FontAwesome: () => null,
  };
});

jest.mock("@react-navigation/bottom-tabs", () => ({
  createBottomTabNavigator: () => {
    return {
      Navigator: ({ children }) => children,
      Screen: () => null,
    };
  }
}));

// -------- MOCK FETCH -------- //
global.fetch = require("jest-fetch-mock");
