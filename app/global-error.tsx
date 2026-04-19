"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="en">
      <body className="bg-gray-50">
        <main className="flex min-h-screen items-center justify-center p-6">
          <div className="w-full max-w-lg rounded-xl border bg-white p-6 shadow-sm space-y-3">
            <h1 className="text-xl font-semibold">Application Error</h1>
            <p className="text-sm text-gray-700">
              The app ran into an unexpected problem. Please retry.
            </p>

            {error.digest && (
              <p className="text-xs text-gray-500">
                Error reference: {error.digest}
              </p>
            )}

            <button
              onClick={() => unstable_retry()}
              className="rounded bg-blue-600 px-4 py-2 text-white"
            >
              Retry
            </button>
          </div>
        </main>
      </body>
    </html>
  );
}
