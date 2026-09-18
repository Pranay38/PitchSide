export default function Loading() {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center space-y-4">
      <div className="w-12 h-12 border-4 border-gray-200 dark:border-gray-800 border-t-[#16A34A] dark:border-t-[#16A34A] rounded-full animate-spin"></div>
      <p className="text-slate-500 dark:text-gray-400 font-medium animate-pulse text-sm tracking-widest uppercase">
        Loading
      </p>
    </div>
  );
}
