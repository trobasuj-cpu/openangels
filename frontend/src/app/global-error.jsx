"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";

export default function GlobalError({ error, reset }) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="en">
      <body className="bg-black text-zinc-100 flex flex-col items-center justify-center min-h-screen px-4 font-sans">
        <div className="max-w-md w-full bg-zinc-900 border border-zinc-800 rounded-xl p-6 text-center shadow-xl">
          <div className="w-12 h-12 bg-red-500/10 text-red-400 rounded-full flex items-center justify-center mx-auto mb-4 text-xl">
            ⚠️
          </div>
          <h2 className="text-xl font-bold mb-2">Something went wrong</h2>
          <p className="text-zinc-400 text-sm mb-6">
            An unexpected error occurred. Our team has been automatically notified via Sentry.
          </p>
          <button
            onClick={() => reset()}
            className="w-full px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-black font-semibold rounded-lg transition"
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
