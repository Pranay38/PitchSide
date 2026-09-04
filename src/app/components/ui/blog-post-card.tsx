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
    <Card className={cn("group flex w-full flex-col gap-3 overflow-hidden glass-card rounded-2xl hover:border-primary/30 transition-all duration-300 cursor-pointer", className)}>
      {cover && (
        <CardHeader className="p-0">
          <div className="relative h-56 w-full overflow-hidden">
            <img
              src={cover}
              alt={headline}
              loading="lazy"
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
            />
            {/* Gradient overlay for depth */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            {/* Read indicator */}
            <div className="absolute bottom-3 right-3 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-background/90 backdrop-blur-sm text-xs font-bold text-primary opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300 shadow-md">
              Read →
            </div>
          </div>
        </CardHeader>
      )}

      <CardContent className="flex-grow p-5">
        {hasMeta && (
          <div className="mb-4 flex items-center text-xs font-semibold text-muted-foreground">
            {tag && (
              <Badge className="kicker rounded-full bg-secondary text-primary px-3 py-1 border-none shadow-none">
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

        <h2 className="mb-2 text-2xl font-headline leading-tight text-foreground transition-colors duration-300 group-hover:text-primary">
          {headline}
        </h2>

        <p
          className={cn("text-sm text-muted-foreground leading-relaxed", {
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
        <CardFooter className="flex items-center p-5 pt-4 border-t border-border mt-auto">
          <div className="flex flex-wrap items-center gap-1.5 text-xs font-medium text-muted-foreground">
            {writer && <span>{writer}</span>}
            {writer && publishedAt && <span>·</span>}
            {publishedAt && <span>{formatPostDate(publishedAt)}</span>}
          </div>
        </CardFooter>
      )}
    </Card>
  );
};
