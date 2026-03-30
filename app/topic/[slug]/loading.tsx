import { Header } from "@/app/components/Header";
import { Footer } from "@/app/components/Footer";

export default function Loading() {
  return (
    <div className="min-h-screen bg-[#F8FAFC] transition-colors duration-300 dark:bg-[#0B1120]">
      <Header />
      <main className="mx-auto w-full max-w-[1180px] px-4 py-8 sm:px-6">
        <div className="mb-12 flex items-baseline justify-between">
          <div>
            <div className="mb-2 h-4 w-32 animate-pulse rounded bg-gray-200 dark:bg-gray-800" />
            <div className="h-10 w-64 animate-pulse rounded-lg bg-gray-200 dark:bg-gray-800" />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="flex h-[320px] flex-col overflow-hidden rounded-[1.75rem] border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-[#0F172A]"
            >
              <div className="mb-4 h-4 w-24 animate-pulse rounded bg-gray-200 dark:bg-gray-800" />
              <div className="mb-2 h-6 w-full animate-pulse rounded bg-gray-200 dark:bg-gray-800" />
              <div className="mb-4 h-6 w-3/4 animate-pulse rounded bg-gray-200 dark:bg-gray-800" />
              <div className="mt-auto flex items-center gap-3">
                <div className="h-4 w-20 animate-pulse rounded bg-gray-200 dark:bg-gray-800" />
                <div className="h-4 w-24 animate-pulse rounded bg-gray-200 dark:bg-gray-800" />
              </div>
            </div>
          ))}
        </div>
      </main>
      <Footer />
    </div>
  );
}
