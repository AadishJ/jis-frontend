"use client";

import { login } from "@/lib/auth";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function Login() {
  const [userId, setUserId] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async () => {
    if (!userId || !password) {
      setError("Enter both user ID and password");
      return;
    }

    try {
      setLoading(true);
      setError("");
      await login(Number(userId), password);
      router.replace("/");
    } catch {
      setError("Invalid user ID or password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen flex items-center justify-center">
      <div className="bg-white p-6 rounded-xl border w-80 space-y-4">
        <h2 className="text-xl font-semibold text-center">Login to JIS</h2>

        <input
          className="w-full border p-2 rounded"
          placeholder="User ID"
          type="number"
          value={userId}
          onChange={(e) => setUserId(e.target.value)}
        />

        <input
          className="w-full border p-2 rounded"
          placeholder="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          onClick={handleLogin}
          disabled={loading}
          className="bg-blue-600 text-white w-full py-2 rounded disabled:opacity-60"
        >
          {loading ? "Logging in..." : "Login"}
        </button>
      </div>
    </div>
  );
}
