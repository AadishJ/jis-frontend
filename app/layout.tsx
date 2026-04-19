"use client";

import "./globals.css";
import Sidebar from "@/components/Sidebar";
import { getUserSession } from "@/lib/auth";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [verifiedPath, setVerifiedPath] = useState<string | null>(null);
  const [authError, setAuthError] = useState("");
  const [authRetryCount, setAuthRetryCount] = useState(0);

  useEffect(() => {
    let isMounted = true;

    const checkAuth = async () => {
      if (pathname === "/login") {
        setAuthError("");
        return;
      }

      const session = await getUserSession();

      if (!isMounted) {
        return;
      }

      if (session.errorMessage) {
        setAuthError(session.errorMessage);
        setVerifiedPath(null);
        return;
      }

      setAuthError("");

      if (!session.user) {
        router.replace("/login");
        return;
      }

      setVerifiedPath(pathname);
    };

    void checkAuth();

    return () => {
      isMounted = false;
    };
  }, [authRetryCount, pathname, router]);

  const isLoginPage = pathname === "/login";
  const checkingAuth = !isLoginPage && !authError && verifiedPath !== pathname;

  return (
    <html lang="en">
      <body suppressHydrationWarning className="bg-gray-50">
        {checkingAuth && !isLoginPage ? (
          <div className="flex h-screen items-center justify-center">
            <p className="text-gray-500">Checking session...</p>
          </div>
        ) : !isLoginPage && authError ? (
          <main className="flex h-screen items-center justify-center p-6">
            <div className="w-full max-w-md rounded-xl border bg-white p-6 shadow-sm space-y-3">
              <h1 className="text-lg font-semibold">Session Check Failed</h1>
              <p className="text-sm text-red-600">{authError}</p>

              <div className="flex gap-2">
                <button
                  onClick={() => setAuthRetryCount((value) => value + 1)}
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
          </main>
        ) : isLoginPage ? (
          <main>{children}</main>
        ) : (
          <div className="flex h-screen">
            <Sidebar />
            <main className="flex-1 overflow-y-auto p-6">{children}</main>
          </div>
        )}
      </body>
    </html>
  );
}
