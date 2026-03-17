const fs = require('fs');

const panelCode = `import { useCallback, useEffect, useState } from "react";
import { BarChart3, RefreshCw } from "lucide-react";
import { PollWidget } from "./PollWidget";
import type { PollOption, PollDocument } from "../../server/endpoints/polls";

// Adapt our DB type to the generic PollWidget props
function adaptPollToWidget(dbPoll: PollDocument | null) {
  if (!dbPoll) return null;
  return {
    question: dbPoll.question,
    options: dbPoll.options.map(opt => ({
       id: opt.id,
       text: opt.text,
       votes: opt.votes || 0
    }))
  };
}

export function PollOfTheWeekPanel() {
  const [dbPoll, setDbPoll] = useState<PollDocument | null>(null);
  const [loading, setLoading] = useState(true);

  const loadPoll = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/polls?active=true");
      if (res.ok) {
         const data = await res.json();
         setDbPoll(data);
      } else {
         setDbPoll(null);
      }
    } catch {
      setDbPoll(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadPoll();
  }, [loadPoll]);

  const handleVote = useCallback(async (optionId: string) => {
    if (!dbPoll || !dbPoll._id) return null;

    const response = await fetch(\`/api/polls/\${dbPoll._id}/vote\`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ optionId }),
    });

    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(payload.error || "Could not save vote.");
    }

    // Returns the updated PollDocument from MongoDB
    const nextPollWidgetFormat = adaptPollToWidget(payload.value || payload); 
    if (payload.value || payload) {
        setDbPoll(payload.value || payload);
    }
    return nextPollWidgetFormat;
  }, [dbPoll]);

  const widgetData = adaptPollToWidget(dbPoll);

  return (
    <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#0F172A] p-5 shadow-sm">
      <div className="flex items-center justify-between gap-3 mb-4">
        <div>
          <p className="text-[11px] font-black uppercase tracking-[0.22em] text-[#16A34A] mb-2">
            Weekly Interaction
          </p>
          <h3 className="text-lg font-black font-outfit text-[#0F172A] dark:text-white flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-[#16A34A]" />
            Poll Of The Week
          </h3>
        </div>
        <button
          type="button"
          onClick={() => { void loadPoll(); }}
          className="p-2 rounded-lg border border-gray-200 dark:border-gray-700 text-[#64748B] dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800"
          title="Refresh poll"
        >
          <RefreshCw className={\`w-4 h-4 \${loading ? "animate-spin" : ""}\`} />
        </button>
      </div>

      {widgetData && dbPoll ? (
        <PollWidget
          pollId={dbPoll._id?.toString() || "active-poll"}
          poll={widgetData}
          title={"Poll of the Week"}
          description={""}
          className="my-0 border-0 shadow-none !bg-transparent p-0"
          voteMode="remote"
          onVote={handleVote}
        />
      ) : loading ? (
        <div className="rounded-xl border border-dashed border-gray-300 dark:border-gray-700 px-4 py-8 text-center text-sm text-[#64748B] dark:text-gray-400">
          Loading the latest weekly poll...
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-gray-300 dark:border-gray-700 px-4 py-8 text-center text-sm text-[#64748B] dark:text-gray-400">
          No weekly poll is live right now.
        </div>
      )}
    </div>
  );
}
`;

fs.writeFileSync('src/app/components/PollOfTheWeekPanel.tsx', panelCode);
console.log("Updated PollOfTheWeekPanel to use MongoDB endpoint");
