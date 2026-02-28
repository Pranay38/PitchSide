export function Footer() {
  return (
    <footer className="mt-20 bg-white dark:bg-[#0F172A] border-t border-gray-200 dark:border-gray-800 transition-colors duration-300">
      <div className="max-w-[1100px] mx-auto px-6 py-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-[#64748B] dark:text-gray-400">
          <div className="flex items-center gap-2">
            <span className="text-lg">⚽</span>
            <p>&copy; 2026 <span className="font-medium text-[#0F172A] dark:text-white">PitchSide</span>. All rights reserved.</p>
          </div>
          <div className="flex gap-6">
            <a href="#" className="hover:text-[#16A34A] transition-colors">About</a>
            <a href="#" className="hover:text-[#16A34A] transition-colors">Contact</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
