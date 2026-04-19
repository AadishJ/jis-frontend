"use client";

import { useEffect } from "react";

export default function Error({
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
    <div className="flex min-h-[50vh] items-center justify-center p-6">
      <div className="w-full max-w-lg rounded-xl border bg-white p-6 shadow-sm space-y-3">
        <h1 className="text-xl font-semibold">Something Went Wrong</h1>
        <p className="text-sm text-gray-700">
          This page hit an unexpected issue. Please try loading it again.
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
          Try Again
        </button>
      </div>
    </div>
  );
}
