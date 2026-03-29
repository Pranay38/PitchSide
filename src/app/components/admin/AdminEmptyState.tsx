import type { LucideIcon } from "lucide-react";

interface AdminEmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: React.ReactNode;
  iconColor?: string;
  iconBgColor?: string;
}

export function AdminEmptyState({
  icon: Icon,
  title,
  description,
  action,
  iconColor = "text-blue-500",
  iconBgColor = "bg-blue-100 dark:bg-blue-900/30",
}: AdminEmptyStateProps) {
  return (
    <div className="text-center py-10 px-4 bg-gray-50 dark:bg-[#0F172A] border border-dashed border-gray-200 dark:border-gray-800 rounded-xl flex flex-col items-center justify-center">
      <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-4 ${iconBgColor}`}>
        <Icon className={`w-6 h-6 ${iconColor}`} />
      </div>
      <p className="text-base font-semibold text-gray-800 dark:text-gray-200 mb-1">{title}</p>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-5 max-w-sm">{description}</p>
      {action && <div>{action}</div>}
    </div>
  );
}
