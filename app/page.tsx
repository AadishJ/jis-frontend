"use client";

import { getUser } from "@/lib/auth";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function Home() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const loadUser = async () => {
      const user = await getUser();

      if (!isMounted) {
        return;
      }

      if (!user) {
        router.replace("/login");
      } else {
        setRole(user.role);
      }

      setLoading(false);
    };

    void loadUser();

    return () => {
      isMounted = false;
    };
  }, [router]);

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
