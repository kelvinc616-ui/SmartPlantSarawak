import React from "react";
import { render, fireEvent } from "@testing-library/react-native";
import LoginScreen from "../screens/LoginScreen";

describe("LoginScreen – unit tests", () => {
  const mockNav = { navigate: jest.fn() };

  test("renders email and password inputs", () => {
    const { getByPlaceholderText } = render(
      <LoginScreen navigation={mockNav} />
    );

    // Adjust placeholder text here if your screen uses slightly different wording
    expect(getByPlaceholderText(/email/i)).toBeTruthy();
    expect(getByPlaceholderText(/password/i)).toBeTruthy();
  });

  test("renders Login button", () => {
    const { getByText } = render(<LoginScreen navigation={mockNav} />);
    expect(getByText(/login/i)).toBeTruthy();
  });

  test("does not crash when pressing Login with empty fields", () => {
    const { getByText } = render(<LoginScreen navigation={mockNav} />);

    const loginButton = getByText(/login/i);
    fireEvent.press(loginButton);

    // If you later show some validation text, you can assert it here.
    // For now, just make sure no error is thrown and navigation isn't called.
    expect(mockNav.navigate).not.toHaveBeenCalled();
  });
});
