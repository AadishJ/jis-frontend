import { API, getApiErrorMessage, getApiErrorStatus } from "@/lib/api";

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

export type AuthSessionResult = {
  user: AuthUser | null;
  errorMessage: string | null;
  statusCode: number | null;
};

export async function getUserSession() {
  try {
    const response = await API.get<AuthUser>("/auth/me");

    return {
      user: response.data,
      errorMessage: null,
      statusCode: response.status,
    } satisfies AuthSessionResult;
  } catch (error) {
    const statusCode = getApiErrorStatus(error);

    if (statusCode === 401) {
      return {
        user: null,
        errorMessage: null,
        statusCode,
      } satisfies AuthSessionResult;
    }

    return {
      user: null,
      errorMessage: getApiErrorMessage(
        error,
        "Unable to verify your session right now. Please retry.",
      ),
      statusCode,
    } satisfies AuthSessionResult;
  }
}

export async function getUser() {
  const session = await getUserSession();
  return session.user;
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
