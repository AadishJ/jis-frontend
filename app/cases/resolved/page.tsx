"use client";

import { useState } from "react";
import { API, getApiErrorMessage } from "@/lib/api";
import type { Case } from "@/types/case";
import { formatDateTime, parseCaseDisplayFields } from "@/lib/case-details";

type ResolvedRow = {
  cin: string;
  startDate: string;
  judgmentDate: string;
  judge: string;
  judgmentSummary: string;
};

function resolveJudgmentDate(caseItem: Case) {
  const candidates = [
    (caseItem as Case & { judgmentDate?: string }).judgmentDate,
    caseItem.updatedAt,
    caseItem.createdAt,
  ].filter((value): value is string => typeof value === "string");

  return candidates[0] ?? "";
}

function inRange(value: string, startDate: string, endDate: string) {
  if (!value) {
    return false;
  }

  const normalized = value.slice(0, 10);
  return normalized >= startDate && normalized <= endDate;
}

export default function ResolvedCasesPage() {
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [rows, setRows] = useState<ResolvedRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [source, setSource] = useState("");

  const search = async () => {
    if (!fromDate || !toDate) {
      setError("Select both from and to dates");
      return;
    }

    if (fromDate > toDate) {
      setError("From date cannot be after to date");
      return;
    }

    setLoading(true);
    setError("");
    setSource("");

    const endpointCandidates = [
      `/cases/resolved?from=${fromDate}&to=${toDate}`,
      `/cases/closed?from=${fromDate}&to=${toDate}`,
      `/cases/judgments?from=${fromDate}&to=${toDate}`,
    ];

    try {
      for (const endpoint of endpointCandidates) {
        try {
          const response = await API.get<Case[]>(endpoint);
          const list = Array.isArray(response.data) ? response.data : [];
          const rowsFromEndpoint = list
            .filter((caseItem) => caseItem.status === "CLOSED")
            .map((caseItem) => {
              const details = parseCaseDisplayFields(caseItem);
              const judgmentDate = resolveJudgmentDate(caseItem);

              return {
                cin: caseItem.cin,
                startDate: details.trialStartDate || caseItem.createdAt || "-",
                judgmentDate,
                judge: details.presidingJudge || "-",
                judgmentSummary: caseItem.judgmentSummary || "-",
              };
            })
            .filter((row) => inRange(row.judgmentDate, fromDate, toDate))
            .sort((first, second) =>
              (first.judgmentDate || "").localeCompare(
                second.judgmentDate || "",
              ),
            );

          setRows(rowsFromEndpoint);
          setSource(endpoint);
          setLoading(false);
          return;
        } catch {
          // Try next endpoint signature.
        }
      }

      setRows([]);
      setSource("No resolved-case endpoint found in backend");
    } catch (searchError) {
      setRows([]);
      setError(
        getApiErrorMessage(searchError, "Unable to query resolved cases"),
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">Resolved Cases By Period</h1>
        <p className="text-sm text-gray-500">
          Query cases resolved in a date range (chronological order)
        </p>
      </div>

      <div className="max-w-3xl rounded-xl border bg-white p-4 shadow-sm space-y-3">
        <div className="grid gap-3 md:grid-cols-2">
          <label className="space-y-1 text-sm">
            <span className="font-medium">From Date</span>
            <input
              type="date"
              className="w-full border rounded p-2"
              value={fromDate}
              onChange={(event) => setFromDate(event.target.value)}
            />
          </label>

          <label className="space-y-1 text-sm">
            <span className="font-medium">To Date</span>
            <input
              type="date"
              className="w-full border rounded p-2"
              value={toDate}
              onChange={(event) => setToDate(event.target.value)}
            />
          </label>
        </div>

        <button
          onClick={search}
          disabled={loading}
          className="rounded bg-blue-600 px-4 py-2 text-white disabled:opacity-60"
        >
          {loading ? "Searching..." : "Search Resolved Cases"}
        </button>

        {error && <p className="text-sm text-red-600">{error}</p>}
        {source && <p className="text-xs text-gray-600">Source: {source}</p>}
      </div>

      <div className="rounded-xl border bg-white shadow-sm overflow-hidden">
        {rows.length === 0 ? (
          <p className="p-4 text-sm text-gray-600">No resolved cases found.</p>
        ) : (
          <table className="w-full text-sm min-w-225">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="p-3 text-left font-medium">Case Start Date</th>
                <th className="p-3 text-left font-medium">CIN</th>
                <th className="p-3 text-left font-medium">Judgment Date</th>
                <th className="p-3 text-left font-medium">Attending Judge</th>
                <th className="p-3 text-left font-medium">Judgment Summary</th>
              </tr>
            </thead>

            <tbody>
              {rows.map((row) => (
                <tr key={row.cin} className="border-t align-top">
                  <td className="p-3">{formatDateTime(row.startDate)}</td>
                  <td className="p-3">{row.cin}</td>
                  <td className="p-3">{formatDateTime(row.judgmentDate)}</td>
                  <td className="p-3">{row.judge}</td>
                  <td className="p-3">{row.judgmentSummary}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
