"use client";

import { logout } from "@/lib/auth";
import Link from "next/link";

export default function Navbar() {
  const handleLogout = () => {
    void logout();
  };

  return (
    <div className="bg-blue-200 shadow">
      <div className="flex justify-between items-center p-4">
        <h1 className="font-bold text-lg">JIS</h1>

        <div className="flex gap-4 text-black">
          <Link href="/cases/pending">Pending</Link>
          <Link href="/cases/create">Create</Link>
          <Link href="/cases/closed">Closed</Link>

          <button onClick={handleLogout} className="text-red-600">
            Logout
          </button>
        </div>
      </div>
    </div>
  );
}
