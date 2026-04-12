"use client";

import { getApiErrorMessage } from "@/lib/api";
import { login } from "@/lib/auth";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function Login() {
  const [mode, setMode] = useState<"userId" | "name">("userId");
  const [userId, setUserId] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async () => {
    if (!password) {
      setError("Enter your password");
      return;
    }

    if (mode === "userId" && !userId) {
      setError("Enter your user ID");
      return;
    }

    if (mode === "name" && !name.trim()) {
      setError("Enter your username");
      return;
    }

    try {
      setLoading(true);
      setError("");

      if (mode === "userId") {
        await login({
          userId: Number(userId),
          password,
        });
      } else {
        await login({
          name: name.trim(),
          password,
        });
      }

      router.replace("/");
    } catch (loginError) {
      setError(getApiErrorMessage(loginError, "Invalid credentials"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen flex items-center justify-center bg-gray-100 p-4">
      <div className="bg-white p-6 rounded-xl border w-full max-w-sm space-y-4 shadow-sm">
        <h2 className="text-xl font-semibold text-center">Login to JIS</h2>

        <div className="grid grid-cols-2 gap-2 rounded-lg bg-gray-100 p-1">
          <button
            onClick={() => setMode("userId")}
            className={`rounded-md py-1.5 text-sm ${
              mode === "userId" ? "bg-white shadow" : "text-gray-600"
            }`}
          >
            User ID
          </button>

          <button
            onClick={() => setMode("name")}
            className={`rounded-md py-1.5 text-sm ${
              mode === "name" ? "bg-white shadow" : "text-gray-600"
            }`}
          >
            Name
          </button>
        </div>

        {mode === "userId" ? (
          <input
            className="w-full border p-2 rounded"
            placeholder="User ID"
            type="number"
            value={userId}
            onChange={(event) => setUserId(event.target.value)}
          />
        ) : (
          <input
            className="w-full border p-2 rounded"
            placeholder="Username"
            value={name}
            onChange={(event) => setName(event.target.value)}
          />
        )}

        <input
          className="w-full border p-2 rounded"
          placeholder="Password"
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
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
