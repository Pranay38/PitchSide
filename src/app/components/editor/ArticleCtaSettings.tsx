import { HeartHandshake, RotateCcw } from "lucide-react";
import type { BlogPost } from "../../data/posts";

interface ArticleCtaSettingsProps {
  value: NonNullable<BlogPost["articleCta"]>;
  onChange: (value: NonNullable<BlogPost["articleCta"]>) => void;
}

const DEFAULTS = {
  subscriberHeadline: "Enjoying the analysis?",
  subscriberBody: "If The Touchline Dribble makes matchdays more interesting, consider supporting the independent writing and helping fund more tactical deep dives.",
  nonSubscriberHeadline: "Get The Weekly Whistle",
  nonSubscriberBody: "One strong football opinion and one useful lesson, every week.",
};

export function ArticleCtaSettings({ value, onChange }: ArticleCtaSettingsProps) {
  const enabled = value.enabled !== false;
  const update = (key: keyof typeof DEFAULTS, next: string) => onChange({ ...value, [key]: next });

  return (
    <section className="rounded-2xl bg-white p-6 shadow-sm dark:bg-[#1E293B]">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-sm font-semibold text-[#0F172A] dark:text-white">
            <HeartHandshake className="h-4 w-4 text-[#16A34A]" aria-hidden="true" />
            End-of-article CTA
          </div>
          <p className="mt-1 text-xs leading-5 text-[#64748B] dark:text-gray-400">
            Subscribers see Razorpay support. Everyone else sees the inbox signup.
          </p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={enabled}
          aria-label="Show automatic end-of-article CTA"
          onClick={() => onChange({ ...value, enabled: !enabled })}
          className={`relative h-7 w-12 shrink-0 rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#16A34A] focus-visible:ring-offset-2 ${enabled ? "bg-[#16A34A]" : "bg-gray-300 dark:bg-gray-600"}`}
        >
          <span className={`absolute left-1 top-1 h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${enabled ? "translate-x-5" : "translate-x-0"}`} />
        </button>
      </div>

      {enabled && (
        <div className="mt-5 space-y-5">
          <div className="space-y-3">
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#16A34A]">Not subscribed</p>
            <label className="block text-xs font-medium text-[#475569] dark:text-gray-300">
              Headline
              <input
                type="text"
                value={value.nonSubscriberHeadline || ""}
                onChange={(event) => update("nonSubscriberHeadline", event.target.value)}
                placeholder={DEFAULTS.nonSubscriberHeadline}
                className="mt-1.5 w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-[#0F172A] outline-none focus:border-[#16A34A] focus:ring-2 focus:ring-[#16A34A]/20 dark:border-gray-600 dark:bg-[#0F172A] dark:text-white"
              />
            </label>
            <label className="block text-xs font-medium text-[#475569] dark:text-gray-300">
              Paragraph
              <textarea
                rows={3}
                value={value.nonSubscriberBody || ""}
                onChange={(event) => update("nonSubscriberBody", event.target.value)}
                placeholder={DEFAULTS.nonSubscriberBody}
                className="mt-1.5 w-full resize-y rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm leading-6 text-[#0F172A] outline-none focus:border-[#16A34A] focus:ring-2 focus:ring-[#16A34A]/20 dark:border-gray-600 dark:bg-[#0F172A] dark:text-white"
              />
            </label>
          </div>

          <div className="space-y-3 border-t border-gray-100 pt-5 dark:border-gray-700">
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#16A34A]">Already subscribed</p>
            <label className="block text-xs font-medium text-[#475569] dark:text-gray-300">
              Headline
              <input
                type="text"
                value={value.subscriberHeadline || ""}
                onChange={(event) => update("subscriberHeadline", event.target.value)}
                placeholder={DEFAULTS.subscriberHeadline}
                className="mt-1.5 w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-[#0F172A] outline-none focus:border-[#16A34A] focus:ring-2 focus:ring-[#16A34A]/20 dark:border-gray-600 dark:bg-[#0F172A] dark:text-white"
              />
            </label>
            <label className="block text-xs font-medium text-[#475569] dark:text-gray-300">
              Paragraph
              <textarea
                rows={3}
                value={value.subscriberBody || ""}
                onChange={(event) => update("subscriberBody", event.target.value)}
                placeholder={DEFAULTS.subscriberBody}
                className="mt-1.5 w-full resize-y rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm leading-6 text-[#0F172A] outline-none focus:border-[#16A34A] focus:ring-2 focus:ring-[#16A34A]/20 dark:border-gray-600 dark:bg-[#0F172A] dark:text-white"
              />
            </label>
          </div>

          <button
            type="button"
            onClick={() => onChange({ enabled: true })}
            className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-gray-200 px-3 py-2 text-xs font-semibold text-[#475569] transition hover:border-[#16A34A] hover:text-[#16A34A] dark:border-gray-600 dark:text-gray-300"
          >
            <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" /> Use default copy
          </button>
        </div>
      )}
    </section>
  );
}
