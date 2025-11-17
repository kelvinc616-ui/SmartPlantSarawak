module.exports = {
  preset: "react-native",

  testEnvironment: "node",     // ✅ FIXED

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
    "^expo$": "<rootDir>/__mocks__/expo.js",
    "^@expo/vector-icons$": "<rootDir>/__mocks__/@expo/vector-icons.js",
  },
};
