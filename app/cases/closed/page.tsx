"use client";

import { useEffect, useState } from "react";
import { API, getApiErrorMessage } from "@/lib/api";
import type { Case } from "@/types/case";
import { getUser } from "@/lib/auth";
import { formatDateTime, parseCaseDisplayFields } from "@/lib/case-details";

export default function ClosedCases() {
  const [cin, setCin] = useState("");
  const [data, setData] = useState<Case | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [userId, setUserId] = useState<number | null>(null);
  const [checkingUser, setCheckingUser] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

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

  const access = async () => {
    if (!cin.trim()) {
      setError("Enter a CIN");
      return;
    }

    if (!userId) {
      setError("Unable to detect logged-in user");
      return;
    }

    try {
      setLoading(true);
      setError("");
      setSuccess("");

      const res = await API.post<Case>("/cases/access", {
        userId,
        cin: cin.trim(),
      });

      setData(res.data);

      if (role === "LAWYER") {
        setSuccess("Case opened. Lawyer access charge is handled by backend.");
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
        <p className="rounded border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
          Note: lawyer access to closed cases may incur backend billing.
        </p>
      )}

      <div className="bg-white rounded-xl border p-4 space-y-3 shadow-sm">
        <input
          className="w-full border p-2 rounded"
          placeholder="CIN (e.g. CIN-2026-xxxxxx)"
          value={cin}
          onChange={(event) => setCin(event.target.value)}
        />

        <button
          onClick={access}
          disabled={loading}
          className="bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-60"
        >
          {loading ? "Accessing..." : "Access Closed Case"}
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
