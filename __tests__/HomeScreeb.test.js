// __tests__/HomeScreeb.test.js
import React from "react";
import { render, fireEvent, waitFor, act } from "@testing-library/react-native";
import HomeScreen from "../screens/HomeScreen";

jest.mock("firebase/firestore", () => ({
  collection: jest.fn(),
  query: jest.fn(),
  where: jest.fn(),
  orderBy: jest.fn(),
  limit: jest.fn(),
  getDocs: jest.fn(),
}));

import { getDocs } from "firebase/firestore";

const mockNavigation = {
  navigate: jest.fn(),
};

describe("HomeScreen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("loads and displays Recent Observations and Explore Sarawak Flora sections", async () => {
    getDocs
      .mockResolvedValueOnce({
        docs: [
          {
            id: "r1",
            data: () => ({
              predicted_label: "Rafflesia",
              confidence: 92,
              imageUrl: "https://example.com/raff.jpg",
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
              confidence: 80,
              imageUrl: "https://example.com/orchid.jpg",
            }),
          },
        ],
      });

    let screen;

    await act(async () => {
      screen = render(<HomeScreen navigation={mockNavigation} />);
    });

    await waitFor(() => {
      expect(screen.getByText("Recent Observations")).toBeTruthy();
      expect(screen.getByText("Explore Sarawak Flora")).toBeTruthy();
    });
  });

  it("navigates to observation details when pressing a card", async () => {
    getDocs
      .mockResolvedValueOnce({
        docs: [
          {
            id: "p1",
            data: () => ({
              predicted_label: "Rafflesia",
              confidence: 95,
              imageUrl: "https://example.com/raff.jpg",
            }),
          },
        ],
      })
      .mockResolvedValueOnce({
        docs: [],
      });

    let screen;

    await act(async () => {
      screen = render(<HomeScreen navigation={mockNavigation} />);
    });

    let card;
    await waitFor(() => {
      card = screen.getByText("Rafflesia");
    });

    fireEvent.press(card);

    expect(mockNavigation.navigate).toHaveBeenCalledWith(
      "ObservationDetails",
      expect.any(Object)
    );
  });
});
