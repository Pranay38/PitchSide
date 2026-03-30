"use client";

/**
 * RouteErrorBoundary — now a standalone error UI component.
 * In Next.js, this is used by app/error.tsx (not useRouteError).
 */
export function RouteErrorBoundary({ error, reset }: { error?: Error; reset?: () => void }) {
  // If it's a dynamic import error (chunk load error), automatically refresh the page
  const isChunkLoadError = error?.name === "TypeError" && error?.message?.includes("Failed to fetch dynamically imported module");
  
  if (isChunkLoadError) {
    if (typeof window !== "undefined") {
      window.location.reload();
    }
    return null;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0A0F1A] text-white p-6">
      <div className="max-w-md text-center space-y-6">
        <div className="text-6xl">⚽</div>
        <h1 className="text-2xl font-black font-outfit">
          Offside! Something went wrong.
        </h1>
        <p className="text-gray-400 text-sm leading-relaxed">
          We've logged this error and will look into it. 
          In the meantime, try refreshing or heading back to the homepage.
        </p>
        {error && (
          <pre className="text-left bg-white/5 rounded-xl p-4 text-xs text-red-400 overflow-auto max-h-32">
            {error.message}
          </pre>
        )}
        <div className="flex gap-3 justify-center">
          <button
            onClick={() => reset ? reset() : window.location.reload()}
            className="px-6 py-3 bg-[#16A34A] rounded-xl font-bold text-sm hover:bg-[#15803d] transition-colors"
          >
            Try Again
          </button>
          <button
            onClick={() => window.location.href = "/"}
            className="px-6 py-3 bg-white/10 rounded-xl font-bold text-sm hover:bg-white/20 transition-colors"
          >
            Go Home
          </button>
        </div>
      </div>
    </div>
  );
}
