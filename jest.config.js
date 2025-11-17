module.exports = {
  preset: "react-native",

  testEnvironment: "node",

  setupFiles: [
    "<rootDir>/jest.winter-disable.js",
  ],

  setupFilesAfterEnv: [
    "<rootDir>/jest.setup.js",
  ],

  transformIgnorePatterns: [
    "node_modules/(?!(react-native" +
      "|@react-native" +
      "|@react-navigation" +
      "|@react-native-async-storage" +
      ")/)"
  ],

  moduleNameMapper: {
    "\\.(png|jpg|jpeg|gif)$": "<rootDir>/__mocks__/fileMock.js",

    // Expo
    "^expo$": "<rootDir>/__mocks__/expo.js",
    "^@expo/vector-icons$": "<rootDir>/__mocks__/@expo/vector-icons.js",

    // ⭐ CRITICAL — FIREBASE MOCKS
    "^firebase/firestore$": "<rootDir>/__mocks__/firebase/firestore.js",
    "^firebase/storage$": "<rootDir>/__mocks__/firebase/storage.js",
    "^firebase/auth$": "<rootDir>/__mocks__/firebase/auth.js",

    // Your own Firebase wrapper
    "^../firebaseConfig$": "<rootDir>/__mocks__/firebaseConfig.js",
  },
};
