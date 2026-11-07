"use client";

import { useEffect } from "react";

export default function GlobalError({ error, reset }) {
  useEffect(() => {
    console.error("[GlobalError]", error);
  }, [error]);

  return (
    <html lang="en">
      <body className="bg-zinc-950 text-zinc-100 flex flex-col items-center justify-center min-h-screen px-4 font-sans">
        <div className="max-w-md w-full bg-zinc-900 border border-zinc-800 rounded-xl p-6 text-center shadow-xl">
          <div className="w-12 h-12 bg-red-500/10 text-red-400 rounded-full flex items-center justify-center mx-auto mb-4 text-xl">
            !
          </div>
          <h2 className="text-xl font-semibold mb-2">Something went wrong</h2>
          <p className="text-zinc-400 text-sm mb-6">
            An unexpected error occurred while loading this page. Please try again.
          </p>
          <button
            onClick={() => reset()}
            className="w-full px-4 py-2.5 bg-white hover:bg-zinc-200 text-zinc-950 font-semibold rounded-lg transition"
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
