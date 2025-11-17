import React from "react";
import { render, fireEvent } from "@testing-library/react-native";
import AdminDashboard from "../screens/AdminDashboard";

// Mock @expo/vector-icons to avoid native errors
jest.mock("@expo/vector-icons", () => ({
  Ionicons: () => null,
}));

// Mock navigation prop
const mockNavigate = jest.fn();

const setup = () =>
  render(<AdminDashboard navigation={{ navigate: mockNavigate }} />);

describe("AdminDashboard Screen", () => {

  beforeEach(() => {
    mockNavigate.mockClear();
  });

  it("renders the main title and subtitle", () => {
    const { getByText } = setup();

    expect(getByText("🌿 SmartPlant Admin Panel")).toBeTruthy();
    expect(
      getByText("Manage users, monitor predictions, and view analytics.")
    ).toBeTruthy();
  });

  it("renders all dashboard cards", () => {
    const { getByText } = setup();

    expect(getByText("Manage Predictions")).toBeTruthy();
    expect(getByText("Manage Users")).toBeTruthy();
    expect(getByText("IoT Sensor Data")).toBeTruthy();
  });

  // --- Navigation behaviour tests ---
  it("navigates to ManagePredictions when the first card is pressed", () => {
    const { getByText } = setup();

    fireEvent.press(getByText("Manage Predictions"));
    expect(mockNavigate).toHaveBeenCalledWith("ManagePredictions");
  });

  it("navigates to ManageUsers when that card is pressed", () => {
    const { getByText } = setup();

    fireEvent.press(getByText("Manage Users"));
    expect(mockNavigate).toHaveBeenCalledWith("ManageUsers");
  });


  it("navigates to IoTMonitoring when IoT card is pressed", () => {
    const { getByText } = setup();

    fireEvent.press(getByText("IoT Sensor Data"));
    expect(mockNavigate).toHaveBeenCalledWith("IoTMonitoring");
  });

});
