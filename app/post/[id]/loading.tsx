import { Header } from "@/app/components/Header";
import { Footer } from "@/app/components/Footer";

export default function Loading() {
  return (
    <div className="min-h-screen bg-[#F8FAFC] transition-colors duration-300 dark:bg-[#0B1120]">
      <Header />
      <main className="mx-auto w-full max-w-[900px] px-4 py-8 sm:px-6">
        {/* Cover Skeleton */}
        <div className="mx-auto aspect-video max-w-4xl animate-pulse overflow-hidden rounded-[2rem] bg-gray-200 shadow-xl dark:bg-gray-800 sm:aspect-[21/9]" />
        
        {/* Title Skeleton */}
        <div className="mx-auto mt-12 max-w-3xl space-y-4">
          <div className="h-4 w-32 animate-pulse rounded-full bg-gray-200 dark:bg-gray-800" />
          <div className="h-10 w-full animate-pulse rounded-lg bg-gray-200 dark:bg-gray-800" />
          <div className="h-10 w-3/4 animate-pulse rounded-lg bg-gray-200 dark:bg-gray-800" />
        </div>

        {/* Content Skeleton */}
        <div className="mx-auto mt-16 max-w-3xl space-y-6">
          <div className="h-4 w-full animate-pulse rounded bg-gray-200 dark:bg-gray-800" />
          <div className="h-4 w-11/12 animate-pulse rounded bg-gray-200 dark:bg-gray-800" />
          <div className="h-4 w-full animate-pulse rounded bg-gray-200 dark:bg-gray-800" />
          <div className="h-4 w-5/6 animate-pulse rounded bg-gray-200 dark:bg-gray-800" />
          <div className="h-4 w-full animate-pulse rounded bg-gray-200 dark:bg-gray-800" />
        </div>
      </main>
      <Footer />
    </div>
  );
}
