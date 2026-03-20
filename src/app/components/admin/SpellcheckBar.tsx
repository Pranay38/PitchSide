import { useState, useEffect, useCallback, useMemo } from "react";
import { AlertTriangle, Check, X, ChevronRight } from "lucide-react";
import { findMisspellings, type SpellIssue } from "../../data/footballDictionary";

interface SpellcheckBarProps {
  content: string;
  onFix: (found: string, replacement: string) => void;
}

export function SpellcheckBar({ content, onFix }: SpellcheckBarProps) {
  const [issues, setIssues] = useState<SpellIssue[]>([]);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const [hidden, setHidden] = useState(false);

  // Debounced scan
  useEffect(() => {
    const timer = setTimeout(() => {
      const found = findMisspellings(content);
      setIssues(found);
    }, 800);
    return () => clearTimeout(timer);
  }, [content]);

  const visibleIssues = useMemo(
    () => issues.filter((i) => !dismissed.has(`${i.found}→${i.suggestion}`)),
    [issues, dismissed]
  );

  const handleFix = useCallback(
    (issue: SpellIssue) => {
      onFix(issue.found, issue.suggestion);
      setDismissed((prev) => new Set(prev).add(`${issue.found}→${issue.suggestion}`));
    },
    [onFix]
  );

  const handleDismiss = useCallback((issue: SpellIssue) => {
    setDismissed((prev) => new Set(prev).add(`${issue.found}→${issue.suggestion}`));
  }, []);

  if (visibleIssues.length === 0 || hidden) return null;

  return (
    <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700/50 rounded-xl px-4 py-3 mb-4 animate-in slide-in-from-top-2 duration-300">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400">
          <AlertTriangle className="w-4 h-4" />
          <span className="text-xs font-bold uppercase tracking-wider">
            Spellcheck · {visibleIssues.length} {visibleIssues.length === 1 ? "issue" : "issues"}
          </span>
        </div>
        <button
          onClick={() => setHidden(true)}
          className="text-amber-500 hover:text-amber-700 dark:hover:text-amber-300 transition-colors"
          aria-label="Dismiss spellcheck"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="space-y-2">
        {visibleIssues.slice(0, 5).map((issue, idx) => (
          <div
            key={`${issue.found}-${idx}`}
            className="flex items-center gap-2 text-sm"
          >
            <span className="text-red-500 dark:text-red-400 line-through font-medium">
              {issue.found}
            </span>
            <ChevronRight className="w-3 h-3 text-gray-400" />
            <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
              {issue.suggestion}
            </span>
            <div className="ml-auto flex items-center gap-1.5">
              <button
                onClick={() => handleFix(issue)}
                className="flex items-center gap-1 px-2.5 py-1 text-xs font-bold bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors"
              >
                <Check className="w-3 h-3" />
                Fix
              </button>
              <button
                onClick={() => handleDismiss(issue)}
                className="px-2 py-1 text-xs font-medium text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
              >
                Ignore
              </button>
            </div>
          </div>
        ))}
        {visibleIssues.length > 5 && (
          <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
            +{visibleIssues.length - 5} more {visibleIssues.length - 5 === 1 ? "issue" : "issues"}
          </p>
        )}
      </div>
    </div>
  );
}
