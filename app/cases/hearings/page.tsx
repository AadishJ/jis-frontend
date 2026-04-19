"use client";

import { useState } from "react";
import { API, getApiErrorMessage, getApiErrorStatus } from "@/lib/api";
import type { Case } from "@/types/case";
import { getLeadPart } from "@/lib/case-details";

type HearingRow = {
  hearingId: number | null;
  cin: string;
  hearingDate: string;
  courtSlot: string;
  defendant: string;
};

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  return value as Record<string, unknown>;
}

function toStringValue(value: unknown) {
  return typeof value === "string" ? value : "";
}

function toNumberValue(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function normalizeHearingRow(value: unknown): HearingRow | null {
  const row = asRecord(value);

  if (!row) {
    return null;
  }

  const caseEntity = asRecord(row.caseEntity);
  const cin = toStringValue(row.cin) || toStringValue(caseEntity?.cin);
  const hearingDate =
    toStringValue(row.hearingDate) || toStringValue(row.newHearingDate);
  const courtSlot = toStringValue(row.courtSlot) || "-";
  const defendantDetails =
    toStringValue(row.defendantDetails) ||
    toStringValue(caseEntity?.defendantDetails);

  if (!cin || !hearingDate) {
    return null;
  }

  return {
    hearingId: toNumberValue(row.hearingId),
    cin,
    hearingDate,
    courtSlot,
    defendant: getLeadPart(defendantDetails) || "-",
  };
}

function caseMatchesDate(caseItem: Case, selectedDate: string) {
  const candidates = [
    (caseItem as Case & { hearingDate?: string }).hearingDate,
    (caseItem as Case & { nextHearingDate?: string }).nextHearingDate,
  ].filter((value): value is string => typeof value === "string");

  return candidates.some((value) => value.startsWith(selectedDate));
}

export default function HearingsByDatePage() {
  const [date, setDate] = useState("");
  const [rows, setRows] = useState<HearingRow[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [note, setNote] = useState("");

  const loadHearings = async () => {
    if (!date) {
      setError("Select a date first");
      return;
    }

    setHasSearched(true);
    setLoading(true);
    setRows([]);
    setError("");
    setNote("");

    try {
      const endpointCandidates = [
        `/cases/hearings?date=${date}`,
        `/cases/hearings?hearingDate=${date}`,
        `/cases/hearings/${date}`,
      ];
      let lastProbeError: unknown = null;

      for (const endpoint of endpointCandidates) {
        try {
          const response = await API.get(endpoint);
          const payload = Array.isArray(response.data)
            ? response.data
            : [response.data];

          const normalized = payload
            .map((item) => normalizeHearingRow(item))
            .filter((item): item is HearingRow => item !== null)
            .filter((item) => item.hearingDate.startsWith(date));

          setRows(normalized);
          setNote(
            normalized.length > 0
              ? `Loaded from ${endpoint}`
              : `No hearing records returned from ${endpoint} for the selected date`,
          );
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

      const pendingResponse = await API.get<Case[]>("/cases/pending");
      const fallbackRows = pendingResponse.data
        .filter((caseItem) => caseMatchesDate(caseItem, date))
        .map((caseItem) => ({
          hearingId: null,
          cin: caseItem.cin,
          hearingDate: date,
          courtSlot: "-",
          defendant: getLeadPart(caseItem.defendantDetails) || "-",
        }));

      setRows(fallbackRows);
      setNote(
        fallbackRows.length > 0
          ? "Loaded from available case metadata"
          : "No hearing-list endpoint was found and no pending-case metadata matches this date",
      );

      if (lastProbeError && fallbackRows.length === 0) {
        const probeMessage = getApiErrorMessage(lastProbeError, "");

        if (probeMessage) {
          setNote(
            (current) => `${current}. Endpoint probe detail: ${probeMessage}`,
          );
        }
      }
    } catch (loadError) {
      setRows([]);
      setError(
        getApiErrorMessage(
          loadError,
          "Unable to load hearings for the selected date",
        ),
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">Hearings By Date</h1>
        <p className="text-sm text-gray-500">
          Query cases coming up for hearing on a selected date
        </p>
      </div>

      <div className="rounded-xl border bg-white p-4 shadow-sm space-y-3 max-w-2xl">
        <label className="block space-y-1 text-sm">
          <span className="font-medium">Hearing Date</span>
          <input
            type="date"
            className="w-full border rounded p-2"
            value={date}
            onChange={(event) => {
              setDate(event.target.value);
              setError("");
              setNote("");
            }}
          />
        </label>

        <button
          onClick={loadHearings}
          disabled={loading}
          className="rounded bg-blue-600 px-4 py-2 text-white disabled:opacity-60"
        >
          {loading ? "Loading..." : "Find Hearings"}
        </button>

        {error && <p className="text-sm text-red-600">{error}</p>}
        {note && <p className="text-xs text-gray-600">{note}</p>}
      </div>

      <div className="rounded-xl border bg-white shadow-sm overflow-hidden">
        {!hasSearched ? (
          <p className="p-4 text-sm text-gray-600">
            Select a hearing date and click Find Hearings.
          </p>
        ) : rows.length === 0 ? (
          <p className="p-4 text-sm text-gray-600">
            No hearing records for this date.
          </p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="p-3 text-left font-medium">Hearing ID</th>
                <th className="p-3 text-left font-medium">CIN</th>
                <th className="p-3 text-left font-medium">Defendant</th>
                <th className="p-3 text-left font-medium">Date</th>
                <th className="p-3 text-left font-medium">Court Slot</th>
              </tr>
            </thead>

            <tbody>
              {rows.map((row, index) => (
                <tr
                  key={`${row.cin}-${row.hearingDate}-${index}`}
                  className="border-t"
                >
                  <td className="p-3">{row.hearingId ?? "-"}</td>
                  <td className="p-3">{row.cin}</td>
                  <td className="p-3">{row.defendant}</td>
                  <td className="p-3">{row.hearingDate}</td>
                  <td className="p-3">{row.courtSlot}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
