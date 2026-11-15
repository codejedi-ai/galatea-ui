// Thin client for the Next.js routes under app/api/, each of which maps 1:1
// to a galatea_server RPC (see the comment at the top of each route.ts).
// Session cookies are set by the server itself (signin/verify routes), so
// nothing here ever touches a token — the browser doesn't have one to touch.

async function apiFetch<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new Error(data.message ?? "Request failed")
  }
  return data as T
}

export const authClient = {
  signUp: (body: { email: string; password: string }) =>
    apiFetch<{ id: string; email: string }>("/api/auth/signup", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  signIn: (body: { email: string; password: string }) =>
    apiFetch<{ ok: true }>("/api/auth/signin", { method: "POST", body: JSON.stringify(body) }),
  verify: (body: { type: string; email: string; token: string }) =>
    apiFetch<{ ok: true }>("/api/auth/verify", { method: "POST", body: JSON.stringify(body) }),
  check: () => apiFetch<{ userId: string; email: string; sessionId: string }>("/api/auth/check"),
}

export interface Bot {
  id: string
  name: string
  description: string
  avatarUrl: string
}

export const botClient = {
  botAll: () => apiFetch<{ bots: Bot[] }>("/api/bots"),
  botCreate: (body: { bot: Omit<Bot, "id"> }) =>
    apiFetch<{ bot: Bot }>("/api/bots", { method: "POST", body: JSON.stringify(body.bot) }),
  botUpdate: (body: { id: string; bot: Omit<Bot, "id"> }) =>
    apiFetch<{ bot: Bot }>(`/api/bots/${body.id}`, { method: "PUT", body: JSON.stringify(body.bot) }),
  botDelete: (body: { id: string }) => apiFetch<{ bot: Bot }>(`/api/bots/${body.id}`, { method: "DELETE" }),
}

export const blobClient = {
  imageUpload: async (body: { image: Uint8Array }) => {
    const res = await fetch("/api/blob/upload", { method: "POST", body: body.image })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) throw new Error(data.message ?? "Upload failed")
    return data as { url: string }
  },
}
