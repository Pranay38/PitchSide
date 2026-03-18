import type { LucideIcon } from "lucide-react";

interface PageStateProps {
  icon: LucideIcon;
  eyebrow?: string;
  title: string;
  description: string;
  action?: React.ReactNode;
  className?: string;
}

export function PageState({
  icon: Icon,
  eyebrow,
  title,
  description,
  action,
  className = "",
}: PageStateProps) {
  return (
    <div className={`rounded-[2rem] border border-gray-200 bg-white px-6 py-14 text-center shadow-sm dark:border-gray-800 dark:bg-[#0F172A] ${className}`}>
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#16A34A]/10 text-[#16A34A]">
        <Icon className="h-6 w-6" />
      </div>
      {eyebrow && (
        <p className="mt-5 text-[11px] font-black uppercase tracking-[0.22em] text-[#16A34A]">
          {eyebrow}
        </p>
      )}
      <h2 className="mt-3 text-2xl font-black font-outfit text-[#0F172A] dark:text-white">
        {title}
      </h2>
      <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-[#64748B] dark:text-gray-400">
        {description}
      </p>
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
