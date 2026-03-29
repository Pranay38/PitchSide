import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getCategoryBadgeColor(category: string, isOverlay: boolean = false) {
  const cat = (category || "").toLowerCase();
  
  if (cat.includes("premier league") || cat.includes("epl")) {
    return isOverlay 
      ? "bg-purple-600/80 text-white border-purple-400/50" 
      : "bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 border-purple-200/50 dark:border-purple-800/50";
  }
  if (cat.includes("la liga") || cat.includes("serie a") || cat.includes("champions league")) {
    return isOverlay 
      ? "bg-rose-600/80 text-white border-rose-400/50" 
      : "bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-300 border-rose-200/50 dark:border-rose-800/50";
  }
  if (cat.includes("tactics") || cat.includes("analysis") || cat.includes("deep dive") || cat.includes("artdirection") || cat.includes("branding")) {
    return isOverlay 
      ? "bg-blue-600/80 text-white border-blue-400/50" 
      : "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-200/50 dark:border-blue-800/50";
  }
  if (cat.includes("transfer") || cat.includes("rumor")) {
    return isOverlay 
      ? "bg-amber-600/80 text-white border-amber-400/50" 
      : "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 border-amber-200/50 dark:border-amber-800/50";
  }
  
  // Default fallback
  return isOverlay 
    ? "bg-black/60 text-white border-white/20 bg-opacity-80" 
    : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700";
}
