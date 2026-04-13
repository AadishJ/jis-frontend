"use client";

import { useEffect, useState } from "react";
import { API, getApiErrorMessage } from "@/lib/api";
import type { Case } from "@/types/case";
import { getUser } from "@/lib/auth";
import { formatDateTime, parseCaseDisplayFields } from "@/lib/case-details";

const LAWYER_ACCESS_FEE_INR = 499;
const RAZORPAY_CHECKOUT_SCRIPT_SRC =
  "https://checkout.razorpay.com/v1/checkout.js";
const RAZORPAY_CHECKOUT_SCRIPT_ID = "razorpay-checkout-js";
const RAZORPAY_TEST_KEY_ID = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID ?? "";

type RazorpaySuccessResponse = {
  razorpay_payment_id: string;
  razorpay_order_id?: string;
  razorpay_signature?: string;
};

type RazorpayFailureResponse = {
  error?: {
    code?: string;
    description?: string;
    source?: string;
    step?: string;
    reason?: string;
    metadata?: {
      order_id?: string;
      payment_id?: string;
    };
  };
};

type RazorpayOptions = {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  notes?: Record<string, string>;
  handler: (response: RazorpaySuccessResponse) => void;
  modal?: {
    ondismiss?: () => void;
  };
  theme?: {
    color?: string;
  };
};

type RazorpayInstance = {
  open: () => void;
  on: (
    eventName: "payment.failed",
    callback: (response: RazorpayFailureResponse) => void,
  ) => void;
};

type RazorpayWindow = Window & {
  Razorpay?: new (options: RazorpayOptions) => RazorpayInstance;
};

function loadRazorpayCheckoutScript() {
  return new Promise<boolean>((resolve) => {
    if (typeof window === "undefined") {
      resolve(false);
      return;
    }

    const razorpayWindow = window as RazorpayWindow;

    if (razorpayWindow.Razorpay) {
      resolve(true);
      return;
    }

    const existingScript = document.getElementById(
      RAZORPAY_CHECKOUT_SCRIPT_ID,
    ) as HTMLScriptElement | null;

    if (existingScript) {
      if (existingScript.dataset.loaded === "true") {
        resolve(Boolean(razorpayWindow.Razorpay));
        return;
      }

      existingScript.addEventListener(
        "load",
        () => {
          resolve(true);
        },
        { once: true },
      );
      existingScript.addEventListener(
        "error",
        () => {
          resolve(false);
        },
        { once: true },
      );
      return;
    }

    const script = document.createElement("script");
    script.id = RAZORPAY_CHECKOUT_SCRIPT_ID;
    script.src = RAZORPAY_CHECKOUT_SCRIPT_SRC;
    script.async = true;
    script.onload = () => {
      script.dataset.loaded = "true";
      resolve(true);
    };
    script.onerror = () => {
      resolve(false);
    };

    document.body.appendChild(script);
  });
}

export default function ClosedCases() {
  const [cin, setCin] = useState("");
  const [data, setData] = useState<Case | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [userId, setUserId] = useState<number | null>(null);
  const [checkingUser, setCheckingUser] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [paidCin, setPaidCin] = useState<string | null>(null);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [paymentNote, setPaymentNote] = useState("");

  useEffect(() => {
    let isMounted = true;

    const loadUser = async () => {
      const user = await getUser();

      if (!isMounted) {
        return;
      }

      setRole(user?.role ?? null);
      setUserId(user?.userId ?? null);
      setCheckingUser(false);
    };

    void loadUser();

    return () => {
      isMounted = false;
    };
  }, []);

  const normalizedCin = cin.trim();
  const paymentDoneForCurrentCin =
    role !== "LAWYER" ||
    (normalizedCin.length > 0 && paidCin === normalizedCin);

  const handleCinChange = (value: string) => {
    const trimmedCin = value.trim();

    setCin(value);
    setError("");
    setSuccess("");
    setPaymentNote("");
    setData(null);

    if (!trimmedCin || paidCin !== trimmedCin) {
      setPaidCin(null);
    }
  };

  const openRazorpayTestCheckout = async () => {
    if (!normalizedCin) {
      setError("Enter a CIN before payment");
      return;
    }

    if (!RAZORPAY_TEST_KEY_ID) {
      setError(
        "Missing NEXT_PUBLIC_RAZORPAY_KEY_ID. Add your rzp_test key to enable Razorpay test mode.",
      );
      return;
    }

    if (paidCin === normalizedCin) {
      setPaymentNote("Payment already completed for this CIN.");
      return;
    }

    try {
      setPaymentLoading(true);
      setError("");
      setSuccess("");
      setPaymentNote("Opening Razorpay test checkout...");

      const scriptLoaded = await loadRazorpayCheckoutScript();

      if (!scriptLoaded) {
        setError(
          "Unable to load Razorpay checkout. Check your network and try again.",
        );
        setPaymentNote("");
        setPaymentLoading(false);
        return;
      }

      const razorpayWindow = window as RazorpayWindow;

      if (!razorpayWindow.Razorpay) {
        setError("Razorpay checkout is unavailable in this browser session.");
        setPaymentNote("");
        setPaymentLoading(false);
        return;
      }

      const checkout = new razorpayWindow.Razorpay({
        key: RAZORPAY_TEST_KEY_ID,
        amount: LAWYER_ACCESS_FEE_INR * 100,
        currency: "INR",
        name: "JIS Court Case System",
        description: `Closed case access for ${normalizedCin}`,
        notes: {
          cin: normalizedCin,
          userId: String(userId ?? ""),
        },
        handler: (response) => {
          setPaidCin(normalizedCin);
          setPaymentLoading(false);
          setPaymentNote(
            `Razorpay test payment successful. Payment ID: ${response.razorpay_payment_id}`,
          );
          setSuccess(
            "Razorpay test payment successful. You can now access the closed case.",
          );
        },
        modal: {
          ondismiss: () => {
            setPaymentLoading(false);
            setPaymentNote("Razorpay checkout closed.");
          },
        },
        theme: {
          color: "#1d4ed8",
        },
      });

      checkout.on("payment.failed", (response) => {
        setPaymentLoading(false);
        setPaymentNote("");
        setSuccess("");
        setError(
          response.error?.description ??
            "Payment failed in Razorpay test mode. Please try again.",
        );
      });

      checkout.open();
      setPaymentLoading(false);
      setPaymentNote("Razorpay checkout opened. Complete payment in popup.");
    } catch (paymentError) {
      setPaymentLoading(false);
      setPaymentNote("");
      setError(
        getApiErrorMessage(
          paymentError,
          "Unable to start Razorpay test checkout",
        ),
      );
    }
  };

  const access = async () => {
    if (!normalizedCin) {
      setError("Enter a CIN");
      return;
    }

    if (!userId) {
      setError("Unable to detect logged-in user");
      return;
    }

    if (role === "LAWYER" && !paymentDoneForCurrentCin) {
      setError("Complete Razorpay payment before accessing this case");
      setSuccess("");
      return;
    }

    try {
      setLoading(true);
      setError("");
      setSuccess("");

      const res = await API.post<Case>("/cases/access", {
        userId,
        cin: normalizedCin,
      });

      setData(res.data);

      if (role === "LAWYER") {
        setSuccess(
          "Closed case opened after successful Razorpay test payment.",
        );
      } else {
        setSuccess("Closed case opened successfully.");
      }
    } catch (accessError) {
      setError(getApiErrorMessage(accessError, "Unable to access closed case"));
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  if (checkingUser) {
    return <p className="text-sm text-gray-600">Loading profile...</p>;
  }

  if (role !== "JUDGE" && role !== "LAWYER") {
    return (
      <div className="max-w-2xl rounded-xl border bg-white p-6">
        <h1 className="text-xl font-semibold">Closed Cases</h1>
        <p className="mt-2 text-sm text-red-600">
          Closed-case browsing is available only for judge and lawyer roles.
        </p>
      </div>
    );
  }

  const details = data ? parseCaseDisplayFields(data) : null;

  return (
    <div className="max-w-4xl space-y-4">
      <h1 className="text-2xl font-semibold">Closed Cases</h1>
      <p className="text-sm text-gray-500">
        UC-07: Browse old cases by CIN ({role})
      </p>

      {role === "LAWYER" && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 space-y-3">
          <p className="text-sm text-amber-900">
            Razorpay test checkout required for lawyer access. Fee: INR{" "}
            {LAWYER_ACCESS_FEE_INR}
          </p>

          <p className="text-xs text-amber-800">
            Payment status:{" "}
            {normalizedCin && paidCin === normalizedCin
              ? "Paid for current CIN"
              : "Pending"}
          </p>

          <button
            onClick={() => {
              void openRazorpayTestCheckout();
            }}
            disabled={loading || paidCin === normalizedCin}
            className="bg-amber-700 text-white px-4 py-2 rounded disabled:opacity-60"
          >
            {paymentLoading
              ? "Opening Razorpay..."
              : normalizedCin && paidCin === normalizedCin
                ? "Payment Completed"
                : `Pay INR ${LAWYER_ACCESS_FEE_INR} (Razorpay Test)`}
          </button>

          {!RAZORPAY_TEST_KEY_ID && (
            <p className="text-xs text-red-700">
              Add NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_test_xxx in your env file to
              enable Razorpay test mode checkout.
            </p>
          )}

          {paymentNote && (
            <p className="text-xs text-amber-800">{paymentNote}</p>
          )}
        </div>
      )}

      <div className="bg-white rounded-xl border p-4 space-y-3 shadow-sm">
        <input
          className="w-full border p-2 rounded"
          placeholder="CIN (e.g. CIN-2026-xxxxxx)"
          value={cin}
          onChange={(event) => handleCinChange(event.target.value)}
        />

        <button
          onClick={access}
          disabled={loading || (role === "LAWYER" && !paymentDoneForCurrentCin)}
          className="bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-60"
        >
          {loading
            ? "Accessing..."
            : role === "LAWYER" && !paymentDoneForCurrentCin
              ? "Complete Razorpay Payment First"
              : "Access Closed Case"}
        </button>

        {error && <p className="text-sm text-red-600">{error}</p>}
        {success && <p className="text-sm text-green-700">{success}</p>}
      </div>

      {data && (
        <div className="bg-white rounded-xl border p-6 shadow-sm space-y-3 text-sm">
          <div className="grid gap-3 md:grid-cols-2">
            <p>
              <span className="font-medium">CIN:</span> {data.cin}
            </p>

            <p>
              <span className="font-medium">Status:</span> {data.status}
            </p>

            <p>
              <span className="font-medium">Defendant:</span>{" "}
              {details?.defendantName || "-"}
            </p>

            <p>
              <span className="font-medium">Address:</span>{" "}
              {details?.defendantAddress || "-"}
            </p>

            <p>
              <span className="font-medium">Lawyer:</span>{" "}
              {details?.lawyerName || "-"}
            </p>

            <p>
              <span className="font-medium">Crime Type:</span> {data.crimeType}
            </p>

            <p>
              <span className="font-medium">Public Prosecutor:</span>{" "}
              {details?.publicProsecutor || "-"}
            </p>

            <p>
              <span className="font-medium">Presiding Judge:</span>{" "}
              {details?.presidingJudge || "-"}
            </p>

            <p>
              <span className="font-medium">Case Created:</span>{" "}
              {formatDateTime(data.createdAt)}
            </p>
          </div>

          <div className="rounded-lg bg-gray-50 border p-3">
            <p className="font-medium mb-1">Judgment Summary</p>
            <p>{data.judgmentSummary || "No judgment summary recorded"}</p>
          </div>
        </div>
      )}
    </div>
  );
}
