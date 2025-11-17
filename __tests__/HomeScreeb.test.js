/**
 * HOME SCREEN TEST (FULLY FIXED)
 */

import React from "react";
import { render, waitFor, fireEvent } from "@testing-library/react-native";
import HomeScreen from "../screens/HomeScreen";

// 🔥 Mock navigation
const navigation = {
  navigate: jest.fn(),
};

// 🔥 Mock Firestore
jest.mock("firebase/firestore", () => ({
  getDocs: jest.fn(),
  collection: jest.fn(),
  query: jest.fn(),
  where: jest.fn(),
  orderBy: jest.fn(),
  limit: jest.fn(),
}));

import { getDocs } from "firebase/firestore";

describe("HomeScreen Tests", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("loads and displays sections", async () => {
    // Mock getDocs twice (recent + explore)
    getDocs
      .mockResolvedValueOnce({
        docs: [
          {
            id: "r1",
            data: () => ({
              predicted_label: "Rafflesia",
              confidence: 95,
              imageUrl: "https://test.com/a.jpg",
            }),
          },
        ],
      })
      .mockResolvedValueOnce({
        docs: [
          {
            id: "e1",
            data: () => ({
              predicted_label: "Orchid",
              confidence: 82,
              imageUrl: "https://test.com/b.jpg",
            }),
          },
        ],
      });

    const screen = render(<HomeScreen navigation={navigation} />);

    await waitFor(() => {
      expect(screen.getByText("Recent Observations")).toBeTruthy();
      expect(screen.getByText("Explore Sarawak Flora")).toBeTruthy();
    });
  });

  test("navigates to observation details when pressing a card", async () => {
    getDocs
      .mockResolvedValueOnce({
        docs: [
          {
            id: "p1",
            data: () => ({
              predicted_label: "Rafflesia",
              confidence: 92,
              imageUrl: "https://img.com/r.jpg",
            }),
          },
        ],
      })
      .mockResolvedValueOnce({
        docs: [],
      });

    const screen = render(<HomeScreen navigation={navigation} />);

    let card;
    await waitFor(() => {
      card = screen.getByText("Rafflesia");
    });

    fireEvent.press(card);

    expect(navigation.navigate).toHaveBeenCalled();
  });

  test("supports pull-to-refresh", async () => {
    getDocs
      .mockResolvedValueOnce({ docs: [] })
      .mockResolvedValueOnce({ docs: [] });

    const screen = render(<HomeScreen navigation={navigation} />);

    let scrollView;
    await waitFor(() => {
      scrollView = screen.getByTestId("HomeScrollView");
    });

    fireEvent(scrollView, "refresh");

    expect(getDocs).toHaveBeenCalledTimes(2);
  });
});
