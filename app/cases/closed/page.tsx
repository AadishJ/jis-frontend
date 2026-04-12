"use client";

import { useState } from "react";
import { API } from "@/lib/api";
import type { Case } from "@/types/case";

export default function ClosedCases() {
  const [cin, setCin] = useState("");
  const [data, setData] = useState<Case | null>(null);

  const access = async () => {
    const res = await API.post("/cases/access", {
      cin,
    });

    setData(res.data);
  };

  return (
    <div className="max-w-xl space-y-4">
      <h1 className="text-2xl font-semibold">Closed Cases</h1>

      <input
        className="w-full border p-2 rounded"
        placeholder="CIN"
        onChange={(e) => setCin(e.target.value)}
      />

      <button
        onClick={access}
        className="bg-blue-600 text-white px-4 py-2 rounded"
      >
        Access
      </button>

      {data && (
        <pre className="bg-gray-100 p-3 rounded text-sm">
          {JSON.stringify(data, null, 2)}
        </pre>
      )}
    </div>
  );
}
