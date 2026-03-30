import { Link } from "@/lib/router-compat";
import { Home } from "lucide-react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "./ui/breadcrumb";

export interface BreadcrumbItemType {
    label: string;
    href?: string;
}

interface BreadcrumbsProps {
    items: BreadcrumbItemType[];
}

export function Breadcrumbs({ items }: BreadcrumbsProps) {
    return (
        <Breadcrumb className="mb-6 animate-float-in">
            <BreadcrumbList className="text-[#64748B] dark:text-gray-400 font-medium text-sm">
                <BreadcrumbItem>
                    <BreadcrumbLink 
                        render={<Link to="/" />} 
                        className="flex items-center hover:text-[#16A34A] gap-1"
                    >
                        <Home className="w-3.5 h-3.5" />
                        <span className="sr-only">Home</span>
                    </BreadcrumbLink>
                </BreadcrumbItem>
                {items.length > 0 && <BreadcrumbSeparator className="text-gray-300 dark:text-gray-600" />}
                
                {items.map((item, index) => {
                    const isLast = index === items.length - 1;

                    return (
                        <div key={index} className="contents">
                            <BreadcrumbItem>
                                {isLast || !item.href ? (
                                    <BreadcrumbPage className="text-[#0F172A] dark:text-white truncate max-w-[200px] sm:max-w-[400px]">
                                        {item.label}
                                    </BreadcrumbPage>
                                ) : (
                                    <BreadcrumbLink 
                                        render={<Link to={item.href} />}
                                        className="hover:text-[#16A34A] whitespace-nowrap"
                                    >
                                        {item.label}
                                    </BreadcrumbLink>
                                )}
                            </BreadcrumbItem>
                            {!isLast && <BreadcrumbSeparator className="text-gray-300 dark:text-gray-600" />}
                        </div>
                    );
                })}
            </BreadcrumbList>
        </Breadcrumb>
    );
}
