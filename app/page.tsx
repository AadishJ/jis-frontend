"use client";

import { getUserSession } from "@/lib/auth";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function Home() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    let isMounted = true;

    const loadUser = async () => {
      const session = await getUserSession();

      if (!isMounted) {
        return;
      }

      if (session.errorMessage) {
        setError(session.errorMessage);
        setRole(null);
        setLoading(false);
        return;
      }

      if (!session.user) {
        router.replace("/login");
      } else {
        setError("");
        setRole(session.user.role);
      }

      setLoading(false);
    };

    void loadUser();

    return () => {
      isMounted = false;
    };
  }, [retryCount, router]);

  if (error) {
    return (
      <div className="flex items-center justify-center h-full p-6">
        <div className="w-full max-w-md rounded-xl border bg-white p-6 shadow-sm space-y-3">
          <h1 className="text-lg font-semibold">Dashboard Unavailable</h1>
          <p className="text-sm text-red-600">{error}</p>

          <div className="flex gap-2">
            <button
              onClick={() => {
                setLoading(true);
                setRetryCount((value) => value + 1);
              }}
              className="rounded bg-blue-600 px-4 py-2 text-white"
            >
              Retry
            </button>

            <button
              onClick={() => router.replace("/login")}
              className="rounded border px-4 py-2"
            >
              Go To Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (loading || !role) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-gray-500">Redirecting...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <p className="text-sm text-gray-500">Welcome, {role.toLowerCase()}</p>
      </div>

      {role === "REGISTRAR" && (
        <div className="grid md:grid-cols-2 xl:grid-cols-5 gap-6">
          <Link
            href="/cases/create"
            className="bg-white p-6 rounded-xl border hover:shadow-md transition"
          >
            <h2 className="font-semibold">Create Case</h2>
            <p className="text-gray-500 text-sm">UC-01: Register a new case</p>
          </Link>

          <Link
            href="/cases/pending"
            className="bg-white p-6 rounded-xl border hover:shadow-md transition"
          >
            <h2 className="font-semibold">Pending Cases</h2>
            <p className="text-gray-500 text-sm">UC-06: View active cases</p>
          </Link>

          <Link
            href="/cases/hearings"
            className="bg-white p-6 rounded-xl border hover:shadow-md transition"
          >
            <h2 className="font-semibold">Hearings By Date</h2>
            <p className="text-gray-500 text-sm">
              Query upcoming hearings on a date
            </p>
          </Link>

          <Link
            href="/cases/search"
            className="bg-white p-6 rounded-xl border hover:shadow-md transition"
          >
            <h2 className="font-semibold">Case Status By CIN</h2>
            <p className="text-gray-500 text-sm">
              Query and open any case directly
            </p>
          </Link>

          <Link
            href="/cases/resolved"
            className="bg-white p-6 rounded-xl border hover:shadow-md transition"
          >
            <h2 className="font-semibold">Resolved By Period</h2>
            <p className="text-gray-500 text-sm">
              Chronological judgment report by date range
            </p>
          </Link>
        </div>
      )}

      {role === "JUDGE" && (
        <div className="grid md:grid-cols-2 gap-6">
          <Link
            href="/cases/closed"
            className="bg-white p-6 rounded-xl border hover:shadow-md transition"
          >
            <h2 className="font-semibold">Browse Cases</h2>
            <p className="text-gray-500 text-sm">
              Review past cases for judgment reference
            </p>
          </Link>

          <Link
            href="/cases/search"
            className="bg-white p-6 rounded-xl border hover:shadow-md transition"
          >
            <h2 className="font-semibold">Search By CIN</h2>
            <p className="text-gray-500 text-sm">
              Open case details and current status
            </p>
          </Link>
        </div>
      )}

      {role === "LAWYER" && (
        <div className="grid md:grid-cols-2 gap-6">
          <Link
            href="/cases/closed"
            className="bg-white p-6 rounded-xl border hover:shadow-md transition"
          >
            <h2 className="font-semibold">Browse Cases</h2>
            <p className="text-gray-500 text-sm">
              Access past cases (charges may apply)
            </p>
          </Link>

          <Link
            href="/cases/search"
            className="bg-white p-6 rounded-xl border hover:shadow-md transition"
          >
            <h2 className="font-semibold">Search By CIN</h2>
            <p className="text-gray-500 text-sm">
              Check case status and proceedings
            </p>
          </Link>
        </div>
      )}
    </div>
  );
}
