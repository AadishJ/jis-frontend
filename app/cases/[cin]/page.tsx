"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { API } from "@/lib/api";
import type { Case } from "@/types/case";

export default function CasePage() {
  const { cin } = useParams<{ cin: string }>();
  const [data, setData] = useState<Case | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    API.get(`/cases/${cin}`)
      .then((res) => setData(res.data))
      .finally(() => setLoading(false));
  }, [cin]);

  const scheduleHearing = async () => {
    await API.post("/cases/hearings", {
      cin,
      hearingDate: "2026-04-01",
      courtSlot: "10:00 AM",
    });
    alert("Hearing scheduled");
  };

  const adjourn = async () => {
    await API.post("/cases/adjournments", {
      hearingId: 1,
      reason: "Adjourned",
      newHearingDate: "2026-04-10",
    });
    alert("Adjourned");
  };

  const closeCase = async () => {
    await API.post(`/cases/${cin}/close`, {
      judgmentSummary: "Closed via UI",
    });
    alert("Case closed");
  };

  if (loading) return <p>Loading...</p>;
  if (!data) return <p>Case not found</p>;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold">{cin}</h1>
        <p className="text-sm text-gray-500">Case details and actions</p>
      </div>

      {/* Case Info */}
      <div className="bg-white p-6 rounded-xl border shadow-sm space-y-3">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <p>
            <span className="font-medium">Defendant:</span>{" "}
            {data.defendantDetails}
          </p>

          <p>
            <span className="font-medium">Crime:</span> {data.crimeType}
          </p>

          <p>
            <span className="font-medium">Status:</span>{" "}
            <span className="text-blue-600">{data.status}</span>
          </p>

          <p>
            <span className="font-medium">Prosecutor:</span>{" "}
            {data.prosecutorDetails}
          </p>
        </div>
      </div>

      {/* Actions */}
      <div className="bg-white p-6 rounded-xl border shadow-sm">
        <h2 className="text-sm font-medium mb-4">Actions</h2>

        <div className="flex flex-wrap gap-3">
          <button
            onClick={scheduleHearing}
            className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-green-700"
          >
            Schedule Hearing
          </button>

          <button
            onClick={adjourn}
            className="bg-yellow-500 text-white px-4 py-2 rounded-lg text-sm hover:bg-yellow-600"
          >
            Adjourn
          </button>

          <button
            onClick={closeCase}
            className="bg-red-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-red-700"
          >
            Close Case
          </button>
        </div>
      </div>
    </div>
  );
}
