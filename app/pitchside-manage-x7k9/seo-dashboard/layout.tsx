'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function SEODashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  
  const navItems = [
    { name: 'Dashboard', href: '/pitchside-manage-x7k9/seo-dashboard' },
    { name: 'Title Optimizer', href: '/pitchside-manage-x7k9/seo-dashboard/title-optimizer' },
    { name: 'Content Calendar', href: '/pitchside-manage-x7k9/seo-dashboard/content-calendar' },
  ];

  return (
    <div className="flex h-screen bg-[#0B1120] text-gray-200">
      <div className="w-64 border-r border-gray-800 bg-[#0F172A] p-4 flex flex-col gap-4">
        <h2 className="text-xl font-bold text-white mb-4">SEO Engine</h2>
        <nav className="flex flex-col gap-2">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`px-4 py-2 rounded-md transition-colors ${
                pathname === item.href
                  ? 'bg-green-600 text-white'
                  : 'hover:bg-gray-800 text-gray-400'
              }`}
            >
              {item.name}
            </Link>
          ))}
        </nav>
      </div>
      <div className="flex-1 overflow-auto p-8">
        {children}
      </div>
    </div>
  );
}
