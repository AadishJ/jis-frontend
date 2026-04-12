"use client";

import Link from "next/link";
import { useState } from "react";
import { API, getApiErrorMessage } from "@/lib/api";
import type { Case } from "@/types/case";
import { parseCaseDisplayFields } from "@/lib/case-details";

export default function CaseSearchPage() {
  const [cin, setCin] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<Case | null>(null);

  const search = async () => {
    if (!cin.trim()) {
      setError("Enter a CIN to search");
      return;
    }

    try {
      setLoading(true);
      setError("");
      const response = await API.get<Case>(`/cases/${cin.trim()}`);
      setResult(response.data);
    } catch (searchError) {
      setResult(null);
      setError(getApiErrorMessage(searchError, "Case not found for this CIN"));
    } finally {
      setLoading(false);
    }
  };

  const details = result ? parseCaseDisplayFields(result) : null;

  return (
    <div className="max-w-3xl space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">Search Case By CIN</h1>
        <p className="text-sm text-gray-500">Query case status and details</p>
      </div>

      <div className="rounded-xl border bg-white p-4 shadow-sm space-y-3">
        <input
          className="w-full border rounded p-2"
          placeholder="CIN (e.g. CIN-2026-xxxxxx)"
          value={cin}
          onChange={(event) => setCin(event.target.value)}
        />

        <button
          onClick={search}
          disabled={loading}
          className="rounded bg-blue-600 px-4 py-2 text-white disabled:opacity-60"
        >
          {loading ? "Searching..." : "Search"}
        </button>

        {error && <p className="text-sm text-red-600">{error}</p>}
      </div>

      {result && (
        <div className="rounded-xl border bg-white p-6 shadow-sm text-sm space-y-3">
          <div className="grid gap-2 md:grid-cols-2">
            <p>
              <span className="font-medium">CIN:</span> {result.cin}
            </p>

            <p>
              <span className="font-medium">Status:</span> {result.status}
            </p>

            <p>
              <span className="font-medium">Defendant:</span>{" "}
              {details?.defendantName || "-"}
            </p>

            <p>
              <span className="font-medium">Crime Type:</span>{" "}
              {result.crimeType}
            </p>

            <p>
              <span className="font-medium">Public Prosecutor:</span>{" "}
              {details?.publicProsecutor || "-"}
            </p>

            <p>
              <span className="font-medium">Presiding Judge:</span>{" "}
              {details?.presidingJudge || "-"}
            </p>
          </div>

          <Link
            href={`/cases/${result.cin}`}
            className="inline-block rounded border px-4 py-2 bg-gray-50"
          >
            Open Full Case
          </Link>
        </div>
      )}
    </div>
  );
}
