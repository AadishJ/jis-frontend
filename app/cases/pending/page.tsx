"use client";

import { useEffect, useState } from "react";
import { API } from "@/lib/api";
import Link from "next/link";
import { Eye } from "lucide-react";
import type { Case } from "@/types/case";

export default function PendingCases() {
  const [cases, setCases] = useState<Case[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    API.get("/cases/pending")
      .then((res) => setCases(res.data))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold">Pending Cases</h1>
        <p className="text-sm text-gray-500">
          All currently active court cases
        </p>
      </div>

      {/* Card */}
      <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
        {loading ? (
          <p className="p-6 text-sm text-gray-500">Loading cases...</p>
        ) : cases.length === 0 ? (
          <p className="p-6 text-sm text-gray-500">No pending cases</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="p-4 text-left font-medium">CIN</th>
                <th className="p-4 text-left font-medium">Defendant</th>
                <th className="p-4 text-left font-medium">Crime</th>
                <th className="p-4 text-right font-medium">Action</th>
              </tr>
            </thead>

            <tbody>
              {cases.map((c) => (
                <tr
                  key={c.cin}
                  className="border-t hover:bg-gray-50 transition"
                >
                  <td className="p-4 font-medium text-blue-600">{c.cin}</td>

                  <td className="p-4">{c.defendantDetails}</td>

                  <td className="p-4 text-gray-600">{c.crimeType}</td>

                  <td className="p-4 text-right">
                    <Link
                      href={`/cases/${c.cin}`}
                      className="inline-flex items-center gap-1 text-sm text-blue-600 hover:underline"
                    >
                      <Eye size={14} />
                      View
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
