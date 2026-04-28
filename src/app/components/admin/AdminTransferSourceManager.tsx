import { useEffect, useMemo, useState } from "react";
import {
  ExternalLink,
  Link2,
  LoaderCircle,
  Lock,
  Pencil,
  Save,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import {
  buildTransferDossierSlug,
  buildTransferTopic,
  getTransferTierLabel,
  type TransferWatchEntry,
} from "../../lib/transferWatch";
import {
  buildTransferSourceSnapshot,
  formatTransferSourceDate,
  getTransferSourceStanceLabel,
  getTransferSourcesForDossier,
  normalizeTransferSourceArticle,
  type TransferSourceArticle,
  type TransferSourceStance,
} from "../../lib/transferSources";

interface AdminTransferSourceManagerProps {
  selectedEntry: TransferWatchEntry | null;
  transferSources: TransferSourceArticle[];
  onPersistTransferSources: (nextSources: TransferSourceArticle[]) => Promise<void>;
}

interface SourceDraft {
  url: string;
  canonicalUrl: string;
  title: string;
  sourceLabel: string;
  reporter: string;
  publishedAt: string;
  stance: TransferSourceStance;
  claimSummary: string;
  sourceTier: number | "";
  paywalled: boolean;
  isPrimaryReport: boolean;
  notes: string;
}

const DEFAULT_DRAFT: SourceDraft = {
  url: "",
  canonicalUrl: "",
  title: "",
  sourceLabel: "",
  reporter: "",
  publishedAt: "",
  stance: "analysis",
  claimSummary: "",
  sourceTier: "",
  paywalled: false,
  isPrimaryReport: false,
  notes: "",
};

function toDatetimeLocal(value?: string): string {
  if (!value) return "";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "";
  const adjusted = new Date(parsed.getTime() - parsed.getTimezoneOffset() * 60000);
  return adjusted.toISOString().slice(0, 16);
}

function fromDatetimeLocal(value: string): string {
  if (!value) return "";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "";
  return parsed.toISOString();
}

export function AdminTransferSourceManager({
  selectedEntry,
  transferSources,
  onPersistTransferSources,
}: AdminTransferSourceManagerProps) {
  const [draft, setDraft] = useState<SourceDraft>(DEFAULT_DRAFT);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [previewing, setPreviewing] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setDraft(DEFAULT_DRAFT);
    setEditingId(null);
  }, [selectedEntry?.id]);

  const selectedDossier = useMemo(() => {
    if (!selectedEntry) return null;

    return {
      dossierSlug: buildTransferDossierSlug(selectedEntry),
      topic: buildTransferTopic(selectedEntry.player, selectedEntry.club),
      player: selectedEntry.player,
      club: selectedEntry.club,
    };
  }, [selectedEntry]);

  const dossierSources = useMemo(() => {
    if (!selectedDossier) return [];
    return getTransferSourcesForDossier(transferSources, selectedDossier);
  }, [selectedDossier, transferSources]);

  const snapshot = useMemo(
    () => buildTransferSourceSnapshot(dossierSources),
    [dossierSources],
  );

  const resetDraft = () => {
    setDraft(DEFAULT_DRAFT);
    setEditingId(null);
  };

  const handlePreview = async () => {
    if (!selectedEntry) {
      toast.error("Select and save a dossier entry first.");
      return;
    }

    if (!/^https?:\/\//i.test(draft.url)) {
      toast.error("Paste a valid source URL first.");
      return;
    }

    setPreviewing(true);
    try {
      const token = localStorage.getItem("pitchside_admin_auth");
      const res = await fetch("/api/transfer-source-preview", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          url: draft.url,
          player: selectedEntry.player,
          club: selectedEntry.club,
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || "Failed to preview source.");
      }

      setDraft((prev) => ({
        ...prev,
        url: data?.draft?.url || prev.url,
        canonicalUrl: data?.draft?.canonicalUrl || data?.preview?.canonicalUrl || prev.canonicalUrl,
        title: data?.draft?.title || prev.title,
        sourceLabel: data?.draft?.sourceLabel || prev.sourceLabel,
        reporter: data?.draft?.reporter || prev.reporter,
        publishedAt: toDatetimeLocal(data?.draft?.publishedAt || data?.preview?.publishedAt || ""),
        stance: data?.draft?.stance || prev.stance,
        claimSummary: data?.draft?.claimSummary || prev.claimSummary,
        paywalled: data?.draft?.paywalled === true,
      }));
      toast.success("Source metadata fetched.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to preview source.");
    } finally {
      setPreviewing(false);
    }
  };

  const handleSave = async () => {
    if (!selectedEntry || !selectedDossier) {
      toast.error("Save the transfer entry before adding sources.");
      return;
    }

    const normalized = normalizeTransferSourceArticle({
      id: editingId || undefined,
      dossierSlug: selectedDossier.dossierSlug,
      topic: selectedDossier.topic,
      player: selectedEntry.player,
      club: selectedEntry.club,
      url: draft.url,
      canonicalUrl: draft.canonicalUrl || draft.url,
      title: draft.title,
      sourceLabel: draft.sourceLabel,
      reporter: draft.reporter || undefined,
      publishedAt: fromDatetimeLocal(draft.publishedAt),
      discoveredAt: new Date().toISOString(),
      stance: draft.stance,
      claimSummary: draft.claimSummary,
      sourceTier: draft.sourceTier === "" ? undefined : (Number(draft.sourceTier) as 1 | 2 | 3 | 4 | 5),
      paywalled: draft.paywalled,
      isPrimaryReport: draft.isPrimaryReport,
      notes: draft.notes || undefined,
    });

    if (!normalized) {
      toast.error("Preview or complete the source fields before saving.");
      return;
    }

    const nextSources = [
      normalized,
      ...transferSources.filter((source) => source.id !== normalized.id),
    ];

    setSaving(true);
    try {
      await onPersistTransferSources(nextSources);
      toast.success(editingId ? "Linked source updated." : "Linked source added.");
      resetDraft();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to save linked source.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    setSaving(true);
    try {
      await onPersistTransferSources(transferSources.filter((source) => source.id !== id));
      toast.success("Linked source removed.");
      if (editingId === id) resetDraft();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to remove linked source.");
    } finally {
      setSaving(false);
    }
  };

  if (!selectedEntry || !selectedDossier) {
    return (
      <section className="mt-8 rounded-2xl border border-dashed border-gray-300 bg-white/70 p-6 dark:border-gray-700 dark:bg-[#0F172A]">
        <p className="text-[11px] font-black uppercase tracking-[0.22em] text-[#16A34A]">Dossier source desk</p>
        <h3 className="mt-2 text-xl font-black font-outfit text-[#0F172A] dark:text-white">
          Select a transfer entry to manage external links
        </h3>
        <p className="mt-3 text-sm leading-6 text-[#64748B] dark:text-gray-400">
          Edit an existing transfer watch item first. Once a dossier is selected, you can preview a BBC, ESPN, Athletic, or club-site URL and attach it to the saga.
        </p>
      </section>
    );
  }

  return (
    <section className="mt-8 rounded-2xl border border-gray-100 bg-white p-6 dark:border-gray-800 dark:bg-[#1E293B]">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-[11px] font-black uppercase tracking-[0.22em] text-[#16A34A]">Dossier source desk</p>
          <h3 className="mt-2 text-2xl font-black font-outfit text-[#0F172A] dark:text-white">
            {selectedEntry.player} to {selectedEntry.club}
          </h3>
          <p className="mt-2 text-sm leading-6 text-[#64748B] dark:text-gray-400">
            Build the linked-coverage layer for this dossier. Preview the URL, edit the claim summary, then save it to the dossier source stack.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-xl bg-[#0F172A]/5 px-4 py-3 dark:bg-white/5">
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#64748B] dark:text-gray-400">Coverage</p>
            <p className="mt-1 text-2xl font-black text-[#0F172A] dark:text-white">{snapshot.coverageCount}</p>
          </div>
          <div className="rounded-xl bg-[#16A34A]/10 px-4 py-3">
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#16A34A]">Consensus</p>
            <p className="mt-1 text-2xl font-black text-[#0F172A] dark:text-white">{snapshot.consensusLabel}</p>
          </div>
          <div className="rounded-xl bg-amber-500/10 px-4 py-3">
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-amber-600 dark:text-amber-300">Tier</p>
            <p className="mt-1 text-sm font-black text-[#0F172A] dark:text-white">{getTransferTierLabel(selectedEntry.tier, selectedEntry.status)}</p>
          </div>
        </div>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.05fr_1fr]">
        <div className="space-y-4 rounded-2xl bg-gray-50 p-5 dark:bg-[#0F172A]">
          <label className="block">
            <span className="block text-sm font-medium text-[#0F172A] dark:text-white mb-2">Source URL</span>
            <div className="flex gap-2">
              <input
                type="url"
                value={draft.url}
                onChange={(event) => setDraft((prev) => ({ ...prev, url: event.target.value }))}
                placeholder="https://www.bbc.com/sport/football/..."
                className="flex-1 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#16A34A] dark:border-gray-700 dark:bg-[#1E293B] dark:text-white"
              />
              <button
                type="button"
                onClick={handlePreview}
                disabled={previewing}
                className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-[#0F172A] hover:bg-gray-50 disabled:opacity-50 dark:border-gray-700 dark:bg-[#1E293B] dark:text-white"
              >
                {previewing ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Link2 className="h-4 w-4" />}
                Preview
              </button>
            </div>
          </label>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="block md:col-span-2">
              <span className="block text-sm font-medium text-[#0F172A] dark:text-white mb-2">Headline</span>
              <input
                type="text"
                value={draft.title}
                onChange={(event) => setDraft((prev) => ({ ...prev, title: event.target.value }))}
                className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#16A34A] dark:border-gray-700 dark:bg-[#1E293B] dark:text-white"
              />
            </label>

            <label className="block">
              <span className="block text-sm font-medium text-[#0F172A] dark:text-white mb-2">Source Label</span>
              <input
                type="text"
                value={draft.sourceLabel}
                onChange={(event) => setDraft((prev) => ({ ...prev, sourceLabel: event.target.value }))}
                className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#16A34A] dark:border-gray-700 dark:bg-[#1E293B] dark:text-white"
              />
            </label>

            <label className="block">
              <span className="block text-sm font-medium text-[#0F172A] dark:text-white mb-2">Reporter</span>
              <input
                type="text"
                value={draft.reporter}
                onChange={(event) => setDraft((prev) => ({ ...prev, reporter: event.target.value }))}
                className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#16A34A] dark:border-gray-700 dark:bg-[#1E293B] dark:text-white"
              />
            </label>

            <label className="block">
              <span className="block text-sm font-medium text-[#0F172A] dark:text-white mb-2">Published At</span>
              <input
                type="datetime-local"
                value={draft.publishedAt}
                onChange={(event) => setDraft((prev) => ({ ...prev, publishedAt: event.target.value }))}
                className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#16A34A] dark:border-gray-700 dark:bg-[#1E293B] dark:text-white"
              />
            </label>

            <label className="block">
              <span className="block text-sm font-medium text-[#0F172A] dark:text-white mb-2">Stance</span>
              <select
                value={draft.stance}
                onChange={(event) => setDraft((prev) => ({ ...prev, stance: event.target.value as TransferSourceStance }))}
                className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#16A34A] dark:border-gray-700 dark:bg-[#1E293B] dark:text-white"
              >
                {(["advances", "confirms", "analysis", "contradicts", "official"] as TransferSourceStance[]).map((stance) => (
                  <option key={stance} value={stance}>{getTransferSourceStanceLabel(stance)}</option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="block text-sm font-medium text-[#0F172A] dark:text-white mb-2">Source Tier</span>
              <select
                value={draft.sourceTier}
                onChange={(event) => setDraft((prev) => ({ ...prev, sourceTier: event.target.value ? Number(event.target.value) : "" }))}
                className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#16A34A] dark:border-gray-700 dark:bg-[#1E293B] dark:text-white"
              >
                <option value="">Not set</option>
                <option value={1}>Tier 1</option>
                <option value={2}>Tier 2</option>
                <option value={3}>Tier 3</option>
                <option value={4}>Tier 4</option>
                <option value={5}>Tier 5</option>
              </select>
            </label>

            <label className="block md:col-span-2">
              <span className="block text-sm font-medium text-[#0F172A] dark:text-white mb-2">Claim Summary</span>
              <textarea
                value={draft.claimSummary}
                onChange={(event) => setDraft((prev) => ({ ...prev, claimSummary: event.target.value }))}
                rows={4}
                className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#16A34A] dark:border-gray-700 dark:bg-[#1E293B] dark:text-white"
              />
            </label>

            <label className="block md:col-span-2">
              <span className="block text-sm font-medium text-[#0F172A] dark:text-white mb-2">Internal Notes</span>
              <textarea
                value={draft.notes}
                onChange={(event) => setDraft((prev) => ({ ...prev, notes: event.target.value }))}
                rows={2}
                className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#16A34A] dark:border-gray-700 dark:bg-[#1E293B] dark:text-white"
              />
            </label>
          </div>

          <div className="flex flex-wrap gap-4">
            <label className="inline-flex items-center gap-2 text-sm text-[#475569] dark:text-gray-300">
              <input
                type="checkbox"
                checked={draft.paywalled}
                onChange={(event) => setDraft((prev) => ({ ...prev, paywalled: event.target.checked }))}
              />
              Paywalled
            </label>
            <label className="inline-flex items-center gap-2 text-sm text-[#475569] dark:text-gray-300">
              <input
                type="checkbox"
                checked={draft.isPrimaryReport}
                onChange={(event) => setDraft((prev) => ({ ...prev, isPrimaryReport: event.target.checked }))}
              />
              Primary signal
            </label>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-xl bg-[#16A34A] px-4 py-2.5 text-sm font-medium text-white hover:bg-[#15803d] disabled:opacity-50"
            >
              {saving ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              {editingId ? "Update linked source" : "Add linked source"}
            </button>
            {(editingId || draft.title || draft.url) && (
              <button
                type="button"
                onClick={resetDraft}
                className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-medium text-[#0F172A] hover:bg-gray-50 dark:border-gray-700 dark:text-white dark:hover:bg-[#0F172A]"
              >
                Clear form
              </button>
            )}
          </div>
        </div>

        <div className="rounded-2xl bg-gray-50 p-5 dark:bg-[#0F172A]">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.22em] text-[#16A34A]">Saved sources</p>
              <h4 className="mt-1 text-lg font-bold text-[#0F172A] dark:text-white">Coverage stack</h4>
            </div>
            {snapshot.lastExternalUpdateAt && (
              <p className="text-xs font-semibold text-[#64748B] dark:text-gray-400">
                {formatTransferSourceDate(snapshot.lastExternalUpdateAt)}
              </p>
            )}
          </div>

          <div className="mt-4 space-y-3">
            {dossierSources.length === 0 ? (
              <div className="rounded-xl border border-dashed border-gray-300 bg-white/70 p-4 text-sm leading-6 text-[#64748B] dark:border-gray-700 dark:bg-[#1E293B] dark:text-gray-400">
                No source links saved yet for this dossier.
              </div>
            ) : (
              dossierSources.map((source) => (
                <div key={source.id} className="rounded-xl border border-gray-100 bg-white p-4 dark:border-gray-800 dark:bg-[#1E293B]">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-full bg-[#16A34A]/10 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-[#16A34A]">
                          {source.sourceLabel}
                        </span>
                        <span className="rounded-full bg-[#0F172A]/5 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-[#64748B] dark:bg-white/5 dark:text-gray-300">
                          {getTransferSourceStanceLabel(source.stance)}
                        </span>
                        {source.paywalled && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-amber-600 dark:text-amber-300">
                            <Lock className="h-3 w-3" />
                            Paywalled
                          </span>
                        )}
                      </div>
                      <h5 className="mt-3 text-base font-black text-[#0F172A] dark:text-white">{source.title}</h5>
                      <p className="mt-2 text-sm leading-6 text-[#64748B] dark:text-gray-400">{source.claimSummary}</p>
                      <p className="mt-3 text-xs font-semibold text-[#64748B] dark:text-gray-400">
                        {formatTransferSourceDate(source.publishedAt || source.discoveredAt)}
                        {source.reporter ? ` · ${source.reporter}` : ""}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <a
                        href={source.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="rounded-lg p-1.5 text-[#64748B] transition-colors hover:bg-emerald-50 hover:text-emerald-600 dark:text-gray-400 dark:hover:bg-emerald-500/10"
                        title="Open source"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </a>
                      <button
                        type="button"
                        onClick={() => {
                          setEditingId(source.id);
                          setDraft({
                            url: source.url,
                            canonicalUrl: source.canonicalUrl,
                            title: source.title,
                            sourceLabel: source.sourceLabel,
                            reporter: source.reporter || "",
                            publishedAt: toDatetimeLocal(source.publishedAt),
                            stance: source.stance,
                            claimSummary: source.claimSummary,
                            sourceTier: source.sourceTier ?? "",
                            paywalled: source.paywalled === true,
                            isPrimaryReport: source.isPrimaryReport === true,
                            notes: source.notes || "",
                          });
                        }}
                        className="rounded-lg p-1.5 text-[#64748B] transition-colors hover:bg-blue-50 hover:text-blue-600 dark:text-gray-400 dark:hover:bg-blue-500/10"
                        title="Edit source"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(source.id)}
                        className="rounded-lg p-1.5 text-[#64748B] transition-colors hover:bg-red-50 hover:text-red-600 dark:text-gray-400 dark:hover:bg-red-500/10"
                        title="Delete source"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
