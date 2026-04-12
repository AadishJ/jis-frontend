import { API } from "@/lib/api";

export type AuthUser = {
  userId: number;
  name: string;
  role: "REGISTRAR" | "JUDGE" | "LAWYER" | "ADMIN";
};

export type LoginPayload = {
  password: string;
  userId?: number;
  name?: string;
};

export async function login(payload: LoginPayload) {
  const response = await API.post<AuthUser>("/auth/login", {
    userId: payload.userId,
    name: payload.name,
    password: payload.password,
  });

  return response.data;
}

export async function getUser() {
  try {
    const response = await API.get<AuthUser>("/auth/me");
    return response.data;
  } catch {
    return null;
  }
}

export async function logout() {
  try {
    await API.post("/auth/logout");
  } finally {
    if (typeof window !== "undefined") {
      window.location.href = "/login";
    }
  }
}
