import { sendPredictionRequest, getHealthStatus } from "../utils/apiClient";

const API_BASE = "https://example-flask-api.com"; // for tests only

beforeEach(() => {
  fetch.resetMocks();
});

describe("API Client – sendPredictionRequest", () => {
  test("calls /predict with correct payload and returns JSON", async () => {
    const mockBody = { label: "Cyperus_iria", confidence: 0.93 };

    fetch.mockResponseOnce(JSON.stringify(mockBody), { status: 200 });

    const result = await sendPredictionRequest(API_BASE, "test-image-url");

    // Check that fetch was called correctly
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(fetch).toHaveBeenCalledWith(
      `${API_BASE}/predict`,
      expect.objectContaining({
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageUrl: "test-image-url" }),
      })
    );

    // Check parsed response
    expect(result).toEqual(mockBody);
  });

  test("throws API_ERROR_xxx when backend returns non-200", async () => {
    fetch.mockResponseOnce("Server error", { status: 500 });

    await expect(
      sendPredictionRequest(API_BASE, "test-image-url")
    ).rejects.toThrow(/API_ERROR_500/);
  });

  test("throws error when API base URL is missing", async () => {
    await expect(
      sendPredictionRequest("", "test-image-url")
    ).rejects.toThrow(/API_BASE_URL_MISSING/);
  });
});

describe("API Client – getHealthStatus", () => {
  test("returns health JSON when /health is OK", async () => {
    const healthBody = { status: "ok", version: "v1" };
    fetch.mockResponseOnce(JSON.stringify(healthBody), { status: 200 });

    const result = await getHealthStatus(API_BASE);

    expect(fetch).toHaveBeenCalledWith(`${API_BASE}/health`);
    expect(result).toEqual(healthBody);
  });
});
