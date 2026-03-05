import { Link } from "react-router";
import { ChevronRight, Home } from "lucide-react";

export interface BreadcrumbItem {
    label: string;
    href?: string;
}

interface BreadcrumbsProps {
    items: BreadcrumbItem[];
}

export function Breadcrumbs({ items }: BreadcrumbsProps) {
    return (
        <nav aria-label="Breadcrumb" className="mb-6 animate-float-in">
            <ol className="flex items-center space-x-2 text-sm text-[#64748B] dark:text-gray-400 font-medium">
                <li>
                    <Link
                        to="/"
                        className="flex items-center hover:text-[#16A34A] transition-colors gap-1"
                    >
                        <Home className="w-3.5 h-3.5" />
                        <span className="sr-only">Home</span>
                    </Link>
                </li>
                {items.map((item, index) => {
                    const isLast = index === items.length - 1;

                    return (
                        <li key={index} className="flex items-center space-x-2">
                            <ChevronRight className="w-3.5 h-3.5 text-gray-300 dark:text-gray-600 flex-shrink-0" />
                            {isLast || !item.href ? (
                                <span className="text-[#0F172A] dark:text-white truncate max-w-[200px] sm:max-w-[400px]">
                                    {item.label}
                                </span>
                            ) : (
                                <Link
                                    to={item.href}
                                    className="hover:text-[#16A34A] transition-colors whitespace-nowrap"
                                >
                                    {item.label}
                                </Link>
                            )}
                        </li>
                    );
                })}
            </ol>
        </nav>
    );
}
