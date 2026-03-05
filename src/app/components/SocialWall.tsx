import { useEffect, useRef } from "react";
import { Hash, RadioTower } from "lucide-react";

interface SocialWallProps {
  title: string;
  embedCode: string;
}

/**
 * Embed providers (Tagembed/Curator/etc.) usually ship a script snippet.
 * Scripts added via innerHTML do not execute automatically, so we re-create them.
 */
export function SocialWall({ title, embedCode }: SocialWallProps) {
  const embedContainerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const container = embedContainerRef.current;
    if (!container) return;

    container.innerHTML = embedCode || "";
    if (!embedCode.trim()) return;

    const scripts = Array.from(container.querySelectorAll("script"));
    scripts.forEach((oldScript) => {
      const nextScript = document.createElement("script");

      Array.from(oldScript.attributes).forEach((attr) => {
        nextScript.setAttribute(attr.name, attr.value);
      });

      nextScript.text = oldScript.text;
      oldScript.parentNode?.replaceChild(nextScript, oldScript);
    });
  }, [embedCode]);

  return (
    <section className="bg-white dark:bg-[#0F172A] rounded-2xl shadow-xl border border-gray-100 dark:border-gray-800 overflow-hidden animate-float-in">
      <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800 bg-gradient-to-r from-emerald-500/10 via-emerald-500/5 to-transparent">
        <h3 className="text-base font-black text-[#0F172A] dark:text-white tracking-tight flex items-center gap-2">
          <RadioTower className="w-4 h-4 text-accent-theme" />
          {title || "Social Wall"}
          <span className="ml-1 text-[10px] font-bold bg-accent-theme/10 text-accent-theme px-2 py-0.5 rounded-full uppercase tracking-wider">
            Live
          </span>
        </h3>
      </div>

      <div className="p-4">
        {embedCode.trim() ? (
          <div ref={embedContainerRef} className="[&_iframe]:w-full [&_iframe]:max-w-full" />
        ) : (
          <div className="rounded-xl border border-dashed border-gray-300 dark:border-gray-700 p-5 text-center">
            <Hash className="w-5 h-5 text-[#94A3B8] mx-auto mb-2" />
            <p className="text-sm font-semibold text-[#0F172A] dark:text-white">No social wall configured yet</p>
            <p className="text-xs text-[#64748B] dark:text-[#94A3B8] mt-1">
              Add your Curator.io or Tagembed snippet from the admin panel.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
