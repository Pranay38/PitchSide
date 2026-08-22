import { useState, useEffect } from "react";
import { Save, LoaderCircle, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import type { SiteSettings } from "../../lib/siteSettingsStorage";
import type { TransferReportCards } from "../../lib/transferReportCards";

interface AdminReportCardTabProps {
  siteSettings: SiteSettings;
  updateSiteSettingsAsync: (updates: Partial<SiteSettings>) => Promise<SiteSettings>;
  setSiteSettings: React.Dispatch<React.SetStateAction<SiteSettings>>;
}

export function AdminReportCardTab({
  siteSettings,
  updateSiteSettingsAsync,
  setSiteSettings,
}: AdminReportCardTabProps) {
  const [saving, setSaving] = useState(false);
  const [reportCards, setReportCards] = useState<TransferReportCards>(siteSettings.transferReportCards);
  const [clubsJson, setClubsJson] = useState("");

  useEffect(() => {
    setReportCards(siteSettings.transferReportCards);
    setClubsJson(JSON.stringify(siteSettings.transferReportCards.clubs, null, 2));
  }, [siteSettings.transferReportCards]);

  const handleSave = async () => {
    try {
      setSaving(true);
      
      let parsedClubs;
      try {
        parsedClubs = JSON.parse(clubsJson);
      } catch (e) {
        toast.error("Invalid JSON format in the Clubs Editor. Please fix before saving.");
        return;
      }

      const updatedReportCards = {
        ...reportCards,
        clubs: parsedClubs,
        lastUpdated: new Date().toISOString().split("T")[0]
      };

      const newSettings = await updateSiteSettingsAsync({
        transferReportCards: updatedReportCards
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

  return (
    <div className="space-y-8 animate-fade-in max-w-4xl">
      <div className="flex items-center justify-between">
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
          className="flex items-center gap-2 px-4 py-2 bg-[#16A34A] text-white rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50"
        >
          {saving ? <LoaderCircle className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {saving ? "Saving..." : "Save Changes"}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="tinted-panel rounded-xl border border-gray-200 dark:border-gray-800 p-6 space-y-6">
          <h3 className="font-bold text-gray-900 dark:text-white border-b border-gray-100 dark:border-gray-800 pb-2">
            General Settings
          </h3>
          
          <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
            <div>
              <p className="font-semibold text-gray-900 dark:text-white">Widget Visibility</p>
              <p className="text-sm text-gray-500">Toggle whether the carousel appears on the homepage.</p>
            </div>
            <button
              onClick={() => setReportCards(prev => ({ ...prev, enabled: !prev.enabled }))}
              className={`flex items-center gap-2 px-4 py-2 rounded-full font-medium transition-colors ${
                reportCards.enabled 
                  ? "bg-[#16A34A] text-white" 
                  : "bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300"
              }`}
            >
              {reportCards.enabled ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
              {reportCards.enabled ? "Live" : "Hidden"}
            </button>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
              Window Name
            </label>
            <input
              type="text"
              value={reportCards.window}
              onChange={(e) => setReportCards(prev => ({ ...prev, window: e.target.value }))}
              className="w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg px-4 py-2 focus:ring-2 focus:ring-[#16A34A]"
              placeholder="e.g. Summer 2025"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
              Season
            </label>
            <input
              type="text"
              value={reportCards.season}
              onChange={(e) => setReportCards(prev => ({ ...prev, season: e.target.value }))}
              className="w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg px-4 py-2 focus:ring-2 focus:ring-[#16A34A]"
              placeholder="e.g. 2025-26"
            />
          </div>
        </div>

        <div className="tinted-panel rounded-xl border border-gray-200 dark:border-gray-800 p-6 flex flex-col h-[600px]">
          <h3 className="font-bold text-gray-900 dark:text-white border-b border-gray-100 dark:border-gray-800 pb-2 mb-4">
            Clubs Data (JSON)
          </h3>
          <p className="text-sm text-gray-500 mb-4">
            Edit the raw JSON array to update clubs, grades, and comments. 
          </p>
          <textarea
            value={clubsJson}
            onChange={(e) => setClubsJson(e.target.value)}
            className="flex-1 w-full font-mono text-xs bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-4 focus:ring-2 focus:ring-[#16A34A] resize-none overflow-y-auto"
            spellCheck={false}
          />
        </div>
      </div>
    </div>
  );
}
