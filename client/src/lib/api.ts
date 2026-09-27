export const API_URL = process.env.NEXT_PUBLIC_API_URL || "";

type Options = RequestInit & { raw?: boolean };

export async function api<T>(path: string, options: Options = {}): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {})
    }
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: "Request failed" }));
    throw new Error(error.message || "Request failed");
  }

  return res.json();
}

export const jsonBody = (body: unknown) => ({ body: JSON.stringify(body) });
