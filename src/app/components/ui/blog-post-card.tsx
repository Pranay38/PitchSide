import * as React from "react";
import { Badge } from "./badge";
import {
  Card,
  CardHeader,
  CardContent,
  CardFooter,
} from "./card";
import { cn } from "./utils";
import { Clock } from "lucide-react";

export interface ArticleCardProps {
  headline: string;
  excerpt: string;
  cover?: string;
  tag?: string;
  readingTime?: string; // e.g. "4 min read"
  writer?: string;
  publishedAt?: string;
  clampLines?: number;
  className?: string; // allow overrides
}

// Date -> "Aug 15, 2025" (localized but concise)
export function formatPostDate(dateStr: string): string {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export const ArticleCard: React.FC<ArticleCardProps> = ({
  cover,
  tag,
  readingTime,
  headline,
  excerpt,
  writer,
  publishedAt,
  clampLines = 2, // Default clamp
  className,
}) => {
  const hasMeta = tag || readingTime;
  const hasFooter = writer || publishedAt;

  return (
    <Card className={cn("group flex w-full flex-col gap-3 overflow-hidden rounded-[2rem] shadow-sm transition-all duration-300 hover:shadow-xl hover:-translate-y-1 hover:border-[#16A34A]/30 cursor-pointer dark:bg-[#0F172A] border-gray-100 dark:border-gray-800", className)}>
      {cover && (
        <CardHeader className="p-0">
          <div className="relative h-56 w-full overflow-hidden">
            <img
              src={cover}
              alt={headline}
              loading="lazy"
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
          </div>
        </CardHeader>
      )}

      <CardContent className="flex-grow p-5">
        {hasMeta && (
          <div className="mb-4 flex items-center text-xs font-semibold text-gray-400">
            {tag && (
              <Badge className="rounded-full bg-gray-100 dark:bg-gray-800 text-[#475569] dark:text-gray-300 px-3 py-1 font-medium border-none shadow-none">
                {tag}
              </Badge>
            )}
            {tag && readingTime && <span className="mx-2">•</span>}
            {readingTime && (
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                {readingTime}
              </span>
            )}
          </div>
        )}

        <h2 className="mb-2 text-2xl md:text-3xl font-extrabold font-outfit leading-tight text-[#0F172A] dark:text-white transition-colors duration-300 group-hover:text-[#16A34A] dark:group-hover:text-[#4ade80]">
          {headline}
        </h2>

        <p
          className={cn("text-sm text-gray-500 dark:text-gray-400 leading-relaxed", {
            "overflow-hidden text-ellipsis [-webkit-box-orient:vertical] [display:-webkit-box]":
              clampLines && clampLines > 0,
          })}
          style={{
            WebkitLineClamp: clampLines,
          }}
        >
          {excerpt}
        </p>
      </CardContent>

      {hasFooter && (
        <CardFooter className="flex items-center justify-between p-5 pt-0 border-t border-gray-100 dark:border-gray-800 mt-2 bg-gray-50/50 dark:bg-gray-800/10">
          {writer && (
            <div>
              <p className="text-sm font-semibold text-[#0F172A] dark:text-gray-200">{writer}</p>
            </div>
          )}
          {publishedAt && (
            <div className={writer ? "text-right" : ""}>
              <p className="text-sm font-semibold text-[#0F172A] dark:text-gray-200">
                {formatPostDate(publishedAt)}
              </p>
            </div>
          )}
        </CardFooter>
      )}
    </Card>
  );
};
