export const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || "http://localhost:5000";

export async function apiFetch(path, options = {}) {
  const url = path.startsWith("http") ? path : `${API_BASE_URL}${path}`;
  const defaultHeaders = { "Content-Type": "application/json" };
  const headers = { ...defaultHeaders, ...(options.headers || {}) };

  const response = await fetch(url, { ...options, headers });
  if (!response.ok) {
    let responseBody = "";
    try {
      responseBody = await response.text();
    } catch (e) {}
    const error = new Error(`Request failed with status ${response.status}`);
    error.status = response.status;
    error.body = responseBody;
    throw error;
  }

  const contentType = response.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    return response.json();
  }
  return response.text();
}

export function ping() {
  return apiFetch("/health", { method: "GET" });
}


