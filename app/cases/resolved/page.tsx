"use client";

import { useState } from "react";
import { API, getApiErrorMessage, getApiErrorStatus } from "@/lib/api";
import type { Case } from "@/types/case";
import { formatDateTime, parseCaseDisplayFields } from "@/lib/case-details";

type ResolvedRow = {
  cin: string;
  startDate: string;
  judgmentDate: string;
  judge: string;
  judgmentSummary: string;
};

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  return value as Record<string, unknown>;
}

function asString(value: unknown) {
  return typeof value === "string" ? value : "";
}

function resolveJudgmentDate(caseItem: Case) {
  const candidates = [
    (caseItem as Case & { judgmentDate?: string }).judgmentDate,
    caseItem.updatedAt,
    caseItem.createdAt,
  ].filter((value): value is string => typeof value === "string");

  return candidates[0] ?? "";
}

function normalizeResolvedRow(value: unknown): ResolvedRow | null {
  const row = asRecord(value);

  if (!row) {
    return null;
  }

  const cin = asString(row.cin).trim();

  if (!cin) {
    return null;
  }

  const looksLikeCaseEntity =
    typeof row.defendantDetails === "string" ||
    typeof row.prosecutorDetails === "string" ||
    typeof row.status === "string";

  if (looksLikeCaseEntity) {
    const caseItem = row as unknown as Case;
    const details = parseCaseDisplayFields(caseItem);

    return {
      cin,
      startDate: details.trialStartDate || caseItem.createdAt || "-",
      judgmentDate: resolveJudgmentDate(caseItem),
      judge: details.presidingJudge || "-",
      judgmentSummary: caseItem.judgmentSummary || "-",
    };
  }

  return {
    cin,
    startDate:
      asString(row.caseStartDate) ||
      asString(row.startDate) ||
      asString(row.createdAt) ||
      "-",
    judgmentDate: asString(row.judgmentDate),
    judge: asString(row.attendingJudge) || asString(row.judge) || "-",
    judgmentSummary: asString(row.judgmentSummary) || "-",
  };
}

function inRange(value: string, startDate: string, endDate: string) {
  if (!value) {
    return false;
  }

  const normalized = value.slice(0, 10);

  if (normalized.length !== 10) {
    return false;
  }

  return normalized >= startDate && normalized <= endDate;
}

export default function ResolvedCasesPage() {
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [rows, setRows] = useState<ResolvedRow[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
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

    setHasSearched(true);
    setLoading(true);
    setError("");
    setSource("");
    setRows([]);

    const endpointCandidates = [
      `/cases/resolved?from=${fromDate}&to=${toDate}`,
      `/cases/closed?from=${fromDate}&to=${toDate}`,
      `/cases/judgments?from=${fromDate}&to=${toDate}`,
    ];

    try {
      let lastProbeError: unknown = null;

      for (const endpoint of endpointCandidates) {
        try {
          const response = await API.get(endpoint);
          const list = Array.isArray(response.data) ? response.data : [];
          const rowsFromEndpoint = list
            .map((item) => normalizeResolvedRow(item))
            .filter((row): row is ResolvedRow => row !== null)
            .filter((row) => inRange(row.judgmentDate, fromDate, toDate))
            .sort((first, second) =>
              (first.judgmentDate || "").localeCompare(
                second.judgmentDate || "",
              ),
            );

          setRows(rowsFromEndpoint);
          setSource(endpoint);
          return;
        } catch (probeError) {
          const status = getApiErrorStatus(probeError);

          if (
            status === 401 ||
            status === 403 ||
            (typeof status === "number" && status >= 500)
          ) {
            throw probeError;
          }

          lastProbeError = probeError;
        }
      }

      setRows([]);
      setSource(
        "No resolved-case endpoint found in backend for this date range",
      );

      if (lastProbeError) {
        const probeMessage = getApiErrorMessage(lastProbeError, "");

        if (probeMessage) {
          setSource(
            (current) => `${current}. Endpoint probe detail: ${probeMessage}`,
          );
        }
      }
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
              onChange={(event) => {
                setFromDate(event.target.value);
                setError("");
              }}
            />
          </label>

          <label className="space-y-1 text-sm">
            <span className="font-medium">To Date</span>
            <input
              type="date"
              className="w-full border rounded p-2"
              value={toDate}
              onChange={(event) => {
                setToDate(event.target.value);
                setError("");
              }}
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
        {!hasSearched ? (
          <p className="p-4 text-sm text-gray-600">
            Select a date range and click Search Resolved Cases.
          </p>
        ) : rows.length === 0 ? (
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
