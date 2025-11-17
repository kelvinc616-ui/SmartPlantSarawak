// __tests__/EditProfileScreeb.test.js
import React from "react";
import { render, waitFor, fireEvent } from "@testing-library/react-native";
import EditProfileScreen from "../screens/EditProfileScreen";

// Mock firebaseConfig (auth + db + storage)
jest.mock("../firebaseConfig", () => ({
  auth: { currentUser: { uid: "user123", email: "kelvin@example.com" } },
  db: {},
  storage: {},
}));

// Mock Firestore functions used in the screen
import { getDoc, updateDoc, doc } from "firebase/firestore";

jest.mock("firebase/firestore", () => ({
  doc: jest.fn(),
  getDoc: jest.fn(),
  updateDoc: jest.fn(),
}));

// We do NOT need to test ImagePicker or real uploads here.
// Just test that data loads and that save triggers updateDoc.

describe("EditProfileScreen", () => {
  const navigation = { goBack: jest.fn() };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("loads and displays user data from Firestore", async () => {
    // Mock Firestore user document
    getDoc.mockResolvedValue({
      exists: () => true,
      data: () => ({
        username: "Kelvin",
        email: "kelvin@example.com",
        avatarUrl: "https://example.com/avatar.jpg",
      }),
    });

    const screen = render(<EditProfileScreen navigation={navigation} />);

    // Wait for loading to finish and data to appear
    await waitFor(() => {
      // loading spinner should disappear
      expect(screen.queryByTestId("ActivityIndicator")).toBeNull();

      // Username and email should be in the inputs
      expect(screen.getByDisplayValue("Kelvin")).toBeTruthy();
      expect(screen.getByDisplayValue("kelvin@example.com")).toBeTruthy();
    });
  });

  it("saves updated username (no avatar change)", async () => {
    // Initial user data
    getDoc.mockResolvedValue({
      exists: () => true,
      data: () => ({
        username: "Kelvin",
        email: "kelvin@example.com",
        avatarUrl: null,
      }),
    });

    const screen = render(<EditProfileScreen navigation={navigation} />);

    // Wait until loading finishes
    await waitFor(() => {
      expect(screen.queryByTestId("ActivityIndicator")).toBeNull();
    });

    // Change username
    const usernameInput = screen.getByPlaceholderText("Enter your username");
    fireEvent.changeText(usernameInput, "New Kelvin");

    // We mock fetch just in case, but with no selectedImage
    // the component will not call fetch().
    global.fetch = jest.fn();

    // Press "Save Changes"
    fireEvent.press(screen.getByText("Save Changes"));

    // Assert Firestore update + navigation back
    await waitFor(() => {
      expect(updateDoc).toHaveBeenCalledTimes(1);
      expect(navigation.goBack).toHaveBeenCalledTimes(1);
    });
  });
});
