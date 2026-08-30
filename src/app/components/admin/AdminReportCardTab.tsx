import { useState, useEffect, useRef } from "react";
import { Save, LoaderCircle, Eye, EyeOff, ChevronDown, ChevronUp, Plus, Trash2, Download } from "lucide-react";
import { toast } from "sonner";
import html2canvas from "html2canvas";
import type { SiteSettings } from "../../lib/siteSettingsStorage";
import type { TransferReportCards } from "../../lib/transferReportCards";
import type { ClubReportCard, GradeEntry } from "../TransferReportCard";
import { InstagramTransferReportCard } from "../TransferReportCardCarousel";

interface AdminReportCardTabProps {
  siteSettings: SiteSettings;
  updateSiteSettingsAsync: (updates: Partial<SiteSettings>) => Promise<SiteSettings>;
  setSiteSettings: React.Dispatch<React.SetStateAction<SiteSettings>>;
}

const GRADES = ["A+", "A", "A-", "B+", "B", "B-", "C+", "C", "C-", "D+", "D", "D-", "F"];

export function AdminReportCardTab({
  siteSettings,
  updateSiteSettingsAsync,
  setSiteSettings,
}: AdminReportCardTabProps) {
  const [saving, setSaving] = useState(false);
  const [reportCards, setReportCards] = useState<TransferReportCards>(siteSettings.transferReportCards);
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);
  const previewRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    setReportCards(siteSettings.transferReportCards);
  }, [siteSettings.transferReportCards]);

  const handleSave = async () => {
    try {
      setSaving(true);
      const updatedReportCards = {
        ...reportCards,
        lastUpdated: new Date().toISOString().split("T")[0],
      };

      const newSettings = await updateSiteSettingsAsync({
        transferReportCards: updatedReportCards,
      });

      setSiteSettings(newSettings);
      toast.success("Transfer Report Cards saved successfully!");
    } catch (error) {
      toast.error("Failed to save report cards");
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  const updateClub = (index: number, updates: Partial<ClubReportCard>) => {
    const newClubs = [...reportCards.clubs];
    newClubs[index] = { ...newClubs[index], ...updates };
    setReportCards({ ...reportCards, clubs: newClubs });
  };

  const updateGrade = (
    clubIndex: number,
    subject: keyof ClubReportCard["grades"],
    field: keyof GradeEntry,
    value: any
  ) => {
    const newClubs = [...reportCards.clubs];
    const club = newClubs[clubIndex];
    club.grades = {
      ...club.grades,
      [subject]: {
        ...club.grades[subject],
        [field]: value,
      },
    };
    setReportCards({ ...reportCards, clubs: newClubs });
  };

  const addClub = () => {
    const newClub: ClubReportCard = {
      club: "New Club",
      league: "Premier League",
      teachersComment: "",
      totalSpend: "€0M",
      totalIncome: "€0M",
      netSpend: "€0M",
      grades: {
        incomings: { grade: "C", comment: "", names: [] },
        outgoings: { grade: "C", comment: "", names: [] },
        valueForMoney: { grade: "C", comment: "" },
        squadBalance: { grade: "C", comment: "" },
        overall: { grade: "C", comment: "" },
      },
    };
    setReportCards({ ...reportCards, clubs: [...reportCards.clubs, newClub] });
    setExpandedIndex(reportCards.clubs.length);
  };

  const removeClub = (index: number) => {
    if (confirm("Are you sure you want to remove this club?")) {
      const newClubs = [...reportCards.clubs];
      newClubs.splice(index, 1);
      setReportCards({ ...reportCards, clubs: newClubs });
      if (expandedIndex === index) setExpandedIndex(null);
    }
  };

  const downloadClubImage = async (clubIndex: number) => {
    const element = previewRefs.current[clubIndex];
    if (!element) return;
    try {
      const canvas = await html2canvas(element, {
        scale: 1080 / element.getBoundingClientRect().width,
        useCORS: true,
        backgroundColor: "#fffdf7",
        logging: false,
      });
      const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/png"));
      if (!blob) throw new Error("Image generation failed");
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${reportCards.clubs[clubIndex].club.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-transfer-report.png`;
      link.click();
      URL.revokeObjectURL(url);
      toast.success("1080 x 1350 Instagram PNG downloaded");
    } catch (error) {
      console.error(error);
      toast.error("Could not export this report image");
    }
  };

  // Helper for rendering a grade section
  const renderGradeEditor = (
    clubIndex: number,
    subject: keyof ClubReportCard["grades"],
    label: string,
    showNames: boolean = false
  ) => {
    const entry = reportCards.clubs[clubIndex].grades[subject];
    return (
      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700 space-y-4">
        <h5 className="font-bold text-[#1a365d] dark:text-[#93c5fd] text-sm">{label}</h5>
        
        <div className="grid grid-cols-[100px_1fr] gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">Grade</label>
            <select
              value={entry.grade}
              onChange={(e) => updateGrade(clubIndex, subject, "grade", e.target.value)}
              className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-md px-2 py-1.5 text-sm font-bold focus:ring-2 focus:ring-[#16A34A]"
            >
              {GRADES.map(g => <option key={g} value={g}>{g}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">Comment</label>
            <input
              type="text"
              value={entry.comment}
              onChange={(e) => updateGrade(clubIndex, subject, "comment", e.target.value)}
              className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-md px-3 py-1.5 text-sm focus:ring-2 focus:ring-[#16A34A]"
              placeholder={`Comment for ${label.toLowerCase()}...`}
            />
          </div>
        </div>

        {showNames && (
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">
              Key Signings/Departures (comma separated)
            </label>
            <input
              type="text"
              value={entry.names?.join(", ") || ""}
              onChange={(e) => {
                const arr = e.target.value.split(",").map(s => s.trim()).filter(Boolean);
                updateGrade(clubIndex, subject, "names", arr);
              }}
              className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-md px-3 py-1.5 text-sm focus:ring-2 focus:ring-[#16A34A]"
              placeholder="e.g. M. Salah (Free), V. Osimhen (€75M)"
            />
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-8 animate-fade-in max-w-5xl mx-auto pb-20">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black font-outfit text-gray-900 dark:text-white">
            Transfer Report Cards
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Manage the seasonal club grading widget.
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center justify-center gap-2 px-5 py-2.5 bg-[#16A34A] text-white font-bold rounded-lg hover:bg-green-600 transition-all shadow-md disabled:opacity-50"
        >
          {saving ? <LoaderCircle className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
          {saving ? "Saving..." : "Save Changes"}
        </button>
      </div>

      {/* GENERAL SETTINGS */}
      <div className="tinted-panel rounded-xl border border-gray-200 dark:border-gray-800 p-6">
        <h3 className="font-bold text-gray-900 dark:text-white border-b border-gray-100 dark:border-gray-800 pb-3 mb-5">
          General Settings
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="flex flex-col justify-between p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-100 dark:border-gray-700/50">
            <div>
              <p className="font-bold text-sm text-gray-900 dark:text-white">Widget Visibility</p>
              <p className="text-xs text-gray-500 mt-1">Toggle whether the carousel appears on the homepage.</p>
            </div>
            <button
              onClick={() => setReportCards(prev => ({ ...prev, enabled: !prev.enabled }))}
              className={`mt-4 flex items-center justify-center gap-2 w-full py-2 rounded-lg font-bold transition-colors ${
                reportCards.enabled 
                  ? "bg-[#16A34A] text-white" 
                  : "bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400"
              }`}
            >
              {reportCards.enabled ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
              {reportCards.enabled ? "Live on Homepage" : "Hidden"}
            </button>
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1.5">
              Window Name
            </label>
            <input
              type="text"
              value={reportCards.window}
              onChange={(e) => setReportCards(prev => ({ ...prev, window: e.target.value }))}
              className="w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-[#16A34A] font-medium"
              placeholder="e.g. Summer 2025"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1.5">
              Season
            </label>
            <input
              type="text"
              value={reportCards.season}
              onChange={(e) => setReportCards(prev => ({ ...prev, season: e.target.value }))}
              className="w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-[#16A34A] font-medium"
              placeholder="e.g. 2025-26"
            />
          </div>
        </div>
      </div>

      {/* CLUBS BUILDER */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">Clubs Data</h3>
          <button
            onClick={addClub}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 text-sm font-bold rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          >
            <Plus className="w-4 h-4" /> Add Club
          </button>
        </div>

        {reportCards.clubs.map((club, idx) => {
          const isExpanded = expandedIndex === idx;
          return (
            <div key={idx} className="tinted-panel rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden transition-all shadow-sm">
              {/* Accordion Header */}
              <button
                onClick={() => setExpandedIndex(isExpanded ? null : idx)}
                className="w-full flex items-center justify-between p-4 bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800/80 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-black text-sm shadow-sm
                    ${club.grades.overall.grade.startsWith("A") ? "bg-[#16A34A]" : 
                      club.grades.overall.grade.startsWith("B") ? "bg-[#65A30D]" : 
                      club.grades.overall.grade.startsWith("C") ? "bg-[#D97706]" : 
                      club.grades.overall.grade.startsWith("D") ? "bg-[#DC2626]" : "bg-[#991B1B]"}`}
                  >
                    {club.grades.overall.grade}
                  </div>
                  <div className="text-left">
                    <div className="font-bold text-gray-900 dark:text-white">{club.club}</div>
                    <div className="text-xs font-semibold text-gray-500">{club.league}</div>
                  </div>
                </div>
                {isExpanded ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
              </button>

              {/* Accordion Body */}
              {isExpanded && (
                <div className="p-5 border-t border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/50 space-y-8">
                  
                  {/* Basic Info & Financials */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <h4 className="font-bold text-sm text-gray-400 uppercase tracking-wider">Basic Info</h4>
                      <div>
                        <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">Club Name</label>
                        <input
                          type="text"
                          value={club.club}
                          onChange={(e) => updateClub(idx, { club: e.target.value })}
                          className="w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-[#16A34A]"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">League</label>
                        <input
                          type="text"
                          value={club.league}
                          onChange={(e) => updateClub(idx, { league: e.target.value })}
                          className="w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-[#16A34A]"
                        />
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h4 className="font-bold text-sm text-gray-400 uppercase tracking-wider">Financials</h4>
                      <div className="grid grid-cols-3 gap-3">
                        <div>
                          <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">Spend</label>
                          <input
                            type="text"
                            value={club.totalSpend}
                            onChange={(e) => updateClub(idx, { totalSpend: e.target.value })}
                            className="w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-[#16A34A]"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">Income</label>
                          <input
                            type="text"
                            value={club.totalIncome}
                            onChange={(e) => updateClub(idx, { totalIncome: e.target.value })}
                            className="w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-[#16A34A]"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">Net</label>
                          <input
                            type="text"
                            value={club.netSpend}
                            onChange={(e) => updateClub(idx, { netSpend: e.target.value })}
                            className="w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-[#16A34A]"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Grades */}
                  <div>
                    <h4 className="font-bold text-sm text-gray-400 uppercase tracking-wider mb-4">Subject Grades</h4>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      {renderGradeEditor(idx, "incomings", "Incomings", true)}
                      {renderGradeEditor(idx, "outgoings", "Outgoings", true)}
                      {renderGradeEditor(idx, "valueForMoney", "Value for Money")}
                      {renderGradeEditor(idx, "squadBalance", "Squad Balance")}
                    </div>
                  </div>

                  {/* Overall & Teacher's Comment */}
                  <div>
                    <h4 className="font-bold text-sm text-gray-400 uppercase tracking-wider mb-4">Final Assessment</h4>
                    <div className="bg-white dark:bg-gray-800 p-5 rounded-lg border-2 border-[#16A34A]/20 dark:border-[#16A34A]/10 space-y-5">
                      <div className="grid grid-cols-[120px_1fr] gap-4">
                        <div>
                          <label className="block text-xs font-bold text-[#16A34A] mb-1">Overall Grade</label>
                          <select
                            value={club.grades.overall.grade}
                            onChange={(e) => updateGrade(idx, "overall", "grade", e.target.value)}
                            className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-md px-3 py-2 text-lg font-black text-[#16A34A] focus:ring-2 focus:ring-[#16A34A]"
                          >
                            {GRADES.map(g => <option key={g} value={g}>{g}</option>)}
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">Overall Summary</label>
                          <input
                            type="text"
                            value={club.grades.overall.comment}
                            onChange={(e) => updateGrade(idx, "overall", "comment", e.target.value)}
                            className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-[#16A34A]"
                            placeholder="e.g. Title contenders"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">Teacher's Comment (Detailed)</label>
                        <textarea
                          value={club.teachersComment}
                          onChange={(e) => updateClub(idx, { teachersComment: e.target.value })}
                          rows={3}
                          maxLength={145}
                          className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-[#16A34A] resize-none"
                          placeholder="Longer summary paragraph explaining the grade..."
                        />
                        <p className="mt-1 text-right text-xs text-gray-400">{club.teachersComment.length}/145</p>
                      </div>
                    </div>
                  </div>

                  {/* Delete Button */}
                  <div className="border-t border-gray-200 pt-6 dark:border-gray-800">
                    <div className="mb-3 flex items-center justify-between gap-3">
                      <div>
                        <h4 className="font-bold text-sm text-gray-900 dark:text-white">Instagram export preview</h4>
                        <p className="mt-1 text-xs text-gray-500">Exports as a portrait 1080 x 1350 PNG.</p>
                      </div>
                      <button
                        onClick={() => downloadClubImage(idx)}
                        className="flex items-center gap-2 bg-[#16A34A] px-3 py-2 text-sm font-bold text-white transition-colors hover:bg-green-600"
                      >
                        <Download className="h-4 w-4" /> Download PNG
                      </button>
                    </div>
                    <div className="mx-auto max-w-[360px] overflow-hidden border border-gray-200 shadow-lg dark:border-gray-700">
                      <InstagramTransferReportCard
                        ref={(node) => { previewRefs.current[idx] = node; }}
                        card={club}
                        windowLabel={reportCards.window}
                        season={reportCards.season}
                        index={idx}
                      />
                    </div>
                  </div>

                  {/* Delete Button */}
                  <div className="flex justify-end pt-4 border-t border-gray-200 dark:border-gray-800">
                    <button
                      onClick={() => removeClub(idx)}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md text-sm font-semibold transition-colors"
                    >
                      <Trash2 className="w-4 h-4" /> Remove Club
                    </button>
                  </div>

                </div>
              )}
            </div>
          );
        })}

        {reportCards.clubs.length === 0 && (
          <div className="text-center py-12 border-2 border-dashed border-gray-200 dark:border-gray-800 rounded-xl">
            <p className="text-gray-500 mb-4">No clubs added yet.</p>
            <button
              onClick={addClub}
              className="px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 text-sm font-bold rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            >
              Add First Club
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
