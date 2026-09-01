import { useEffect, useState } from "react";
import { Eye, EyeOff, Save } from "lucide-react";
import { toast } from "sonner";
import type { SiteSettings } from "../../lib/siteSettingsStorage";
import type { WeeklyRoundup } from "../../lib/weeklyRoundup";

interface Props {
  siteSettings: SiteSettings;
  setSiteSettings: React.Dispatch<React.SetStateAction<SiteSettings>>;
  updateSiteSettingsAsync: (updates: Partial<SiteSettings>) => Promise<SiteSettings>;
}

export function AdminWeeklyRoundupTab({ siteSettings, setSiteSettings, updateSiteSettingsAsync }: Props) {
  const [roundup, setRoundup] = useState<WeeklyRoundup>(siteSettings.weeklyRoundup);
  const [saving, setSaving] = useState(false);
  useEffect(() => setRoundup(siteSettings.weeklyRoundup), [siteSettings.weeklyRoundup]);
  const updateItem = (index: number, field: "title" | "body", value: string) => setRoundup((current) => ({ ...current, items: current.items.map((item, itemIndex) => itemIndex === index ? { ...item, [field]: value } : item) }));
  const save = async () => {
    try {
      setSaving(true);
      const weeklyRoundup = { ...roundup, updatedAt: new Date().toISOString() };
      const next = await updateSiteSettingsAsync({ weeklyRoundup });
      setSiteSettings(next);
      toast.success("Weekly roundup saved");
    } catch { toast.error("Could not save weekly roundup"); } finally { setSaving(false); }
  };
  return <div className="mx-auto max-w-5xl space-y-6 pb-20">
    <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center"><div><h2 className="text-2xl font-black text-gray-900 dark:text-white">This Week in Football</h2><p className="mt-1 text-sm text-gray-500">Your repeatable four-part weekly roundup.</p></div><button onClick={save} disabled={saving} className="flex items-center justify-center gap-2 bg-[#16A34A] px-5 py-2.5 font-bold text-white disabled:opacity-60"><Save className="h-4 w-4" />{saving ? "Saving..." : "Save roundup"}</button></div>
    <div className="grid gap-5 border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-[#111827] md:grid-cols-[1fr_180px]"><div><label className="text-sm font-bold text-gray-900 dark:text-white">Issue label</label><input value={roundup.weekLabel} onChange={(event) => setRoundup({ ...roundup, weekLabel: event.target.value })} className="mt-2 w-full border border-gray-200 bg-gray-50 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900" /></div><button onClick={() => setRoundup({ ...roundup, enabled: !roundup.enabled })} className={`flex items-center justify-center gap-2 self-end px-4 py-2.5 text-sm font-bold ${roundup.enabled ? "bg-[#16A34A] text-white" : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300"}`}>{roundup.enabled ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}{roundup.enabled ? "Published" : "Hidden"}</button><div className="md:col-span-2"><label className="text-sm font-bold text-gray-900 dark:text-white">Headline</label><input value={roundup.headline} onChange={(event) => setRoundup({ ...roundup, headline: event.target.value })} className="mt-2 w-full border border-gray-200 bg-gray-50 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900" /></div><div className="md:col-span-2"><label className="text-sm font-bold text-gray-900 dark:text-white">Introduction</label><textarea value={roundup.intro} onChange={(event) => setRoundup({ ...roundup, intro: event.target.value })} maxLength={180} rows={2} className="mt-2 w-full resize-none border border-gray-200 bg-gray-50 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900" /></div></div>
    <div className="grid gap-4 md:grid-cols-2">{roundup.items.map((item, index) => <section key={item.label} className="border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-[#111827]"><p className="text-xs font-black tracking-[0.14em] text-[#16A34A]">{item.label}</p><input value={item.title} onChange={(event) => updateItem(index, "title", event.target.value)} maxLength={80} className="mt-3 w-full border-b border-gray-200 bg-transparent py-2 text-lg font-black text-gray-900 outline-none dark:border-gray-700 dark:text-white" placeholder="Headline" /><textarea value={item.body} onChange={(event) => updateItem(index, "body", event.target.value)} maxLength={260} rows={4} className="mt-3 w-full resize-none bg-transparent text-sm leading-relaxed text-gray-600 outline-none dark:text-gray-300" placeholder="Your concise take" /><p className="text-right text-xs text-gray-400">{item.body.length}/260</p></section>)}</div>
  </div>;
}
