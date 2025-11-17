export async function sendPredictionRequest(apiBaseUrl, imageUrl) {
  if (!apiBaseUrl) {
    throw new Error("API_BASE_URL_MISSING");
  }

  const response = await fetch(`${apiBaseUrl}/predict`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ imageUrl }),
  });

  if (!response.ok) {
    throw new Error(`API_ERROR_${response.status}`);
  }

  return response.json();
}

export async function getHealthStatus(apiBaseUrl) {
  if (!apiBaseUrl) {
    throw new Error("API_BASE_URL_MISSING");
  }

  const response = await fetch(`${apiBaseUrl}/health`);
  if (!response.ok) {
    throw new Error(`API_HEALTH_ERROR_${response.status}`);
  }
  return response.json();
}