export async function parseJsonResponse<T = unknown>(
  response: Response
): Promise<T> {
  const text = await response.text();

  if (!text.trim()) {
    if (!response.ok) {
      throw new Error(`Request failed (${response.status})`);
    }
    return {} as T;
  }

  try {
    return JSON.parse(text) as T;
  } catch {
    throw new Error(
      response.ok ? "Invalid server response" : `Request failed (${response.status})`
    );
  }
}
