import { sendPredictionRequest } from "../../utils/apiClient";

const API_BASE = "https://example-flask-api.com";

beforeEach(() => {
  fetch.resetMocks();
});

describe("Performance – prediction API", () => {
  test("prediction request completes under 2 seconds", async () => {
    // Simulate backend taking ~500ms
    fetch.mockResponseOnce(
      () =>
        new Promise((resolve) =>
          setTimeout(
            () => resolve(JSON.stringify({ label: "Cyperus_iria", confidence: 0.91 })),
            500
          )
        ),
      { status: 200 }
    );

    const start = Date.now();
    await sendPredictionRequest(API_BASE, "test-image-url");
    const duration = Date.now() - start;

    // Adjust the threshold to whatever you want for your report
    expect(duration).toBeLessThan(2000);
  });
});
