import axios from "axios";

export const API = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080",
  withCredentials: true,
});

type ApiErrorShape = {
  message?: unknown;
  error?: unknown;
  detail?: unknown;
  details?: unknown;
  title?: unknown;
  errors?: unknown;
};

const KNOWN_BACKEND_MESSAGE_MAP: Record<string, string> = {
  "user not found": "Unable to verify your account. Please log in again.",
  "only registrar can create cases":
    "Only registrar users can create new cases.",
  "cannot edit closed case": "Closed cases cannot be edited.",
  "cannot schedule hearing for closed case":
    "Hearings can only be scheduled for pending cases.",
  "case already closed": "This case is already closed.",
  "judgment summary required":
    "Enter a judgment summary before closing the case.",
  "hearing date is required": "Select a hearing date before continuing.",
  "from and to are required": "Select both from and to dates.",
  "from date must be before or equal to to date":
    "From date must be on or before the to date.",
  "hearing not found": "No hearing exists for the provided hearing ID.",
  "case is not closed": "Only closed cases can be accessed here.",
  "unauthorized access": "You are not authorized to access this case.",
};

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  return value as Record<string, unknown>;
}

function asString(value: unknown) {
  if (typeof value !== "string") {
    return "";
  }

  return value.trim();
}

function findFirstString(values: unknown[]) {
  for (const value of values) {
    const normalized = asString(value);

    if (normalized) {
      return normalized;
    }
  }

  return "";
}

function getMessageFromErrorsField(value: unknown) {
  if (Array.isArray(value)) {
    const text = value
      .map((item) => {
        if (typeof item === "string") {
          return item.trim();
        }

        const record = asRecord(item);

        if (!record) {
          return "";
        }

        return findFirstString([
          record.message,
          record.defaultMessage,
          record.error,
          record.field,
        ]);
      })
      .filter(Boolean)
      .join("; ");

    return text;
  }

  const errorsRecord = asRecord(value);

  if (errorsRecord) {
    const text = Object.values(errorsRecord)
      .map((item) => {
        if (Array.isArray(item)) {
          return item
            .map((entry) => asString(entry))
            .filter(Boolean)
            .join(", ");
        }

        return asString(item);
      })
      .filter(Boolean)
      .join("; ");

    return text;
  }

  return "";
}

function mapKnownBackendMessage(message: string) {
  const normalized = message.trim().toLowerCase();
  return KNOWN_BACKEND_MESSAGE_MAP[normalized] ?? message;
}

function extractApiErrorMessage(data: unknown) {
  if (typeof data === "string") {
    return mapKnownBackendMessage(data.trim());
  }

  const payload = asRecord(data) as ApiErrorShape | null;

  if (!payload) {
    return "";
  }

  const directMessage = findFirstString([
    payload.message,
    payload.error,
    payload.detail,
    payload.details,
    payload.title,
  ]);

  if (directMessage) {
    return mapKnownBackendMessage(directMessage);
  }

  const errorsMessage = getMessageFromErrorsField(payload.errors);
  return errorsMessage ? mapKnownBackendMessage(errorsMessage) : "";
}

export function getApiErrorStatus(error: unknown) {
  if (!axios.isAxiosError(error)) {
    return null;
  }

  return error.response?.status ?? null;
}

export function isApiNetworkError(error: unknown) {
  if (!axios.isAxiosError(error)) {
    return false;
  }

  return !error.response;
}

export function getApiErrorMessage(
  error: unknown,
  fallback = "Something went wrong. Please try again.",
) {
  if (axios.isAxiosError<ApiErrorShape>(error)) {
    const responseMessage = extractApiErrorMessage(error.response?.data);

    if (responseMessage) {
      return responseMessage;
    }

    if (isApiNetworkError(error)) {
      return "Unable to reach the server. Please check your connection and try again.";
    }

    const status = error.response?.status;

    if (status === 400) {
      return "Invalid request. Please review the entered details.";
    }

    if (status === 401) {
      return "Your session has expired. Please log in again.";
    }

    if (status === 403) {
      return "You do not have permission to perform this action.";
    }

    if (status === 404) {
      return "Requested record was not found.";
    }

    if (status === 409) {
      return "Request conflicts with current data. Refresh and try again.";
    }

    if (typeof status === "number" && status >= 500) {
      return "Server error occurred. Please try again in a moment.";
    }

    return fallback;
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return fallback;
}
