"use client";

import { useEffect, useState } from "react";
import { API, getApiErrorMessage } from "@/lib/api";
import Link from "next/link";
import { Eye } from "lucide-react";
import type { Case } from "@/types/case";
import { formatDateTime, parseCaseDisplayFields } from "@/lib/case-details";

export default function PendingCases() {
  const [cases, setCases] = useState<Case[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    let isMounted = true;

    const loadCases = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await API.get<Case[]>("/cases/pending");
        const list = Array.isArray(response.data) ? response.data : [];
        const sortedCases = [...list].sort((first, second) =>
          first.cin.localeCompare(second.cin),
        );

        if (!isMounted) {
          return;
        }

        setCases(sortedCases);
      } catch (fetchError) {
        if (!isMounted) {
          return;
        }

        setCases([]);
        setError(
          getApiErrorMessage(fetchError, "Unable to load pending cases"),
        );
      } finally {
        if (!isMounted) {
          return;
        }

        setLoading(false);
      }
    };

    void loadCases();

    return () => {
      isMounted = false;
    };
  }, [retryCount]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Pending Cases</h1>
        <p className="text-sm text-gray-500">
          UC-06: Active cases sorted by CIN with registrar report details
        </p>
      </div>

      <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
        {loading ? (
          <p className="p-6 text-sm text-gray-500">Loading cases...</p>
        ) : error ? (
          <div className="p-6 space-y-3">
            <p className="text-sm text-red-600">{error}</p>
            <button
              onClick={() => setRetryCount((value) => value + 1)}
              className="rounded border px-3 py-1.5 text-sm"
            >
              Retry
            </button>
          </div>
        ) : cases.length === 0 ? (
          <p className="p-6 text-sm text-gray-500">No pending cases</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-300">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="p-4 text-left font-medium">CIN</th>
                  <th className="p-4 text-left font-medium">Case Start</th>
                  <th className="p-4 text-left font-medium">Defendant</th>
                  <th className="p-4 text-left font-medium">Address</th>
                  <th className="p-4 text-left font-medium">Crime Details</th>
                  <th className="p-4 text-left font-medium">Lawyer</th>
                  <th className="p-4 text-left font-medium">
                    Public Prosecutor
                  </th>
                  <th className="p-4 text-left font-medium">Attending Judge</th>
                  <th className="p-4 text-right font-medium">Action</th>
                </tr>
              </thead>

              <tbody>
                {cases.map((caseItem) => {
                  const details = parseCaseDisplayFields(caseItem);
                  const crimeDetails = [
                    caseItem.crimeType,
                    details.offenseDate
                      ? `Offense Date: ${details.offenseDate}`
                      : "",
                    details.offenseLocation
                      ? `Offense Location: ${details.offenseLocation}`
                      : "",
                  ]
                    .filter(Boolean)
                    .join(" | ");

                  return (
                    <tr
                      key={caseItem.cin}
                      className="border-t hover:bg-gray-50 transition align-top"
                    >
                      <td className="p-4 font-medium text-blue-600">
                        {caseItem.cin}
                      </td>

                      <td className="p-4 text-gray-700">
                        {details.trialStartDate ||
                          formatDateTime(caseItem.createdAt)}
                      </td>

                      <td className="p-4">{details.defendantName || "-"}</td>

                      <td className="p-4 text-gray-700">
                        {details.defendantAddress || "-"}
                      </td>

                      <td className="p-4 text-gray-700">
                        {crimeDetails || "-"}
                      </td>

                      <td className="p-4 text-gray-700">
                        {details.lawyerName || "-"}
                      </td>

                      <td className="p-4 text-gray-700">
                        {details.publicProsecutor || "-"}
                      </td>

                      <td className="p-4 text-gray-700">
                        {details.presidingJudge || "-"}
                      </td>

                      <td className="p-4 text-right">
                        <Link
                          href={`/cases/${caseItem.cin}`}
                          className="inline-flex items-center gap-1 text-sm text-blue-600 hover:underline"
                        >
                          <Eye size={14} />
                          View
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
