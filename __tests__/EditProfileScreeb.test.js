/**
 * EDIT PROFILE SCREEN TEST (FULLY FIXED)
 */

import React from "react";
import { render, fireEvent, waitFor } from "@testing-library/react-native";
import EditProfileScreen from "../screens/EditProfileScreen";

// 🔥 Mock navigation
const navigation = { goBack: jest.fn() };

// 🔥 Mock Firebase Auth
jest.mock("../firebaseConfig", () => ({
  auth: {
    currentUser: {
      uid: "u123",
      email: "kelvin@test.com",
    },
  },
  db: {},
  storage: {},
}));

// 🔥 Mock Firestore
jest.mock("firebase/firestore", () => ({
  getDoc: jest.fn(),
  updateDoc: jest.fn(),
  doc: jest.fn(),
}));

import { getDoc, updateDoc, doc } from "firebase/firestore";

// 🔥 Mock fetch (Firebase Storage upload)
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({}),
  })
);

// 🔥 Mock ImagePicker
jest.mock("expo-image-picker", () => ({
  requestMediaLibraryPermissionsAsync: jest.fn(() =>
    Promise.resolve({ status: "granted" })
  ),
  launchImageLibraryAsync: jest.fn(() =>
    Promise.resolve({
      canceled: false,
      assets: [{ uri: "local-img.jpg" }],
    })
  ),
  MediaTypeOptions: {
    Images: "Images",
  },
}));

describe("EditProfileScreen Tests", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("loads and displays user data", async () => {
    getDoc.mockResolvedValue({
      exists: () => true,
      data: () => ({
        username: "Kelvin",
        email: "kelvin@test.com",
      }),
    });

    const screen = render(<EditProfileScreen navigation={navigation} />);

    await waitFor(() => {
      expect(screen.getByDisplayValue("Kelvin")).toBeTruthy();
      expect(screen.getByDisplayValue("kelvin@test.com")).toBeTruthy();
    });
  });

  test("allows selecting an image", async () => {
    getDoc.mockResolvedValue({
      exists: () => true,
      data: () => ({ username: "User", email: "x@test.com" }),
    });

    const picker = require("expo-image-picker");

    const screen = render(<EditProfileScreen navigation={navigation} />);

    const changeBtn = screen.getByText("Change Profile Photo");
    fireEvent.press(changeBtn);

    await waitFor(() => {
      expect(picker.launchImageLibraryAsync).toHaveBeenCalled();
    });
  });

  test("saves profile changes & uploads avatar", async () => {
    getDoc.mockResolvedValue({
      exists: () => true,
      data: () => ({ username: "Kelvin", email: "kelvin@test.com" }),
    });

    doc.mockReturnValue("mockDocRef");

    const screen = render(<EditProfileScreen navigation={navigation} />);

    // Edit username
    const usernameInput = screen.getByPlaceholderText("Enter your username");
    fireEvent.changeText(usernameInput, "New Kelvin");

    fireEvent.press(screen.getByText("Save Changes"));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalled();
      expect(updateDoc).toHaveBeenCalled();
      expect(navigation.goBack).toHaveBeenCalled();
    });
  });
});
