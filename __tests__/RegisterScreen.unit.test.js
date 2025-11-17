import React from "react";
import { render } from "@testing-library/react-native";
import RegisterScreen from "../screens/RegisterScreen";

describe("RegisterScreen – unit tests", () => {
  test("renders basic registration fields", () => {
    const { getByPlaceholderText } = render(<RegisterScreen />);

    expect(getByPlaceholderText(/email/i)).toBeTruthy();

    // Password fields
    const passwordField = getByPlaceholderText("Password");
    const confirmPasswordField = getByPlaceholderText("Confirm Password");

    expect(passwordField).toBeTruthy();
    expect(confirmPasswordField).toBeTruthy();
  });
});
