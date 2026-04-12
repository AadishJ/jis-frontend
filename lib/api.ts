import axios from "axios";

export const API = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080",
  withCredentials: true,
});

type ApiErrorShape = {
  message?: string;
  error?: string;
};

export function getApiErrorMessage(
  error: unknown,
  fallback = "Something went wrong. Please try again.",
) {
  if (axios.isAxiosError<ApiErrorShape>(error)) {
    const responseMessage = error.response?.data?.message;
    const responseError = error.response?.data?.error;
    return responseMessage ?? responseError ?? fallback;
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return fallback;
}
