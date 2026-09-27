import type { BlogPost } from "../../data/posts";
import { isExplainer, publishedPosts } from "../../lib/matchdayContent";
interface Props {
  kind: BlogPost["contentKind"];
  setKind: (value: BlogPost["contentKind"]) => void;
  editorial: NonNullable<BlogPost["editorial"]>;
  setEditorial: (value: NonNullable<BlogPost["editorial"]>) => void;
  posts: BlogPost[];
  currentId?: string;
}
export function EditorialSettings({
  kind,
  setKind,
  editorial,
  setEditorial,
  posts,
  currentId,
}: Props) {
  const inputClass =
    "mt-2 w-full rounded-xl border border-gray-200 bg-white p-3 text-sm text-slate-900 dark:border-gray-700 dark:bg-slate-900 dark:text-white";
  return (
    <section className="space-y-5 rounded-2xl border border-gray-200 p-5 dark:border-gray-800">
      <h3 className="font-bold">Opinion & knowledge</h3>
      <label className="block text-sm font-semibold">
        Reading type
        <select
          value={kind || ""}
          onChange={(e) =>
            setKind((e.target.value || undefined) as Props["kind"])
          }
          className={inputClass}
        >
          <option value="">Unclassified</option>
          <option value="opinion">Opinion</option>
          <option value="explainer">Explainer</option>
        </select>
      </label>
      <p className="text-xs text-muted-foreground">
        Explainers appear in Learn and are eligible for the 30′ section.
        Existing posts can stay unclassified.
      </p>
      <label className="block text-sm font-semibold">
        Our verdict
        <textarea
          maxLength={400}
          value={editorial.verdict || ""}
          onChange={(e) =>
            setEditorial({ ...editorial, verdict: e.target.value })
          }
          className={inputClass}
          rows={2}
        />
      </label>
      <div className="space-y-3">
        <p className="text-sm font-semibold">Evidence (up to three points)</p>
        {[0, 1, 2].map((index) => (
          <div key={index}>
            <label className="block text-xs">
              Evidence {index + 1}
              <textarea
                maxLength={1200}
                rows={2}
                value={editorial.evidence?.[index]?.text || ""}
                className={inputClass}
                onChange={(e) => {
                  const evidence = [...(editorial.evidence || [])];
                  while (evidence.length <= index) evidence.push({ text: "" });
                  evidence[index] = {
                    ...evidence[index],
                    text: e.target.value,
                  };
                  setEditorial({ ...editorial, evidence });
                }}
              />
            </label>
            <label className="block text-xs mt-2">
              Source URL
              <input
                type="url"
                placeholder="https://…"
                value={editorial.evidence?.[index]?.sourceUrl || ""}
                className={inputClass}
                onChange={(e) => {
                  const evidence = [...(editorial.evidence || [])];
                  while (evidence.length <= index) evidence.push({ text: "" });
                  evidence[index] = {
                    ...evidence[index],
                    sourceUrl: e.target.value,
                  };
                  setEditorial({ ...editorial, evidence });
                }}
              />
            </label>
          </div>
        ))}
      </div>
      <label className="block text-sm font-semibold">
        Strongest counterargument
        <textarea
          rows={3}
          maxLength={2000}
          value={editorial.counterargument || ""}
          onChange={(e) =>
            setEditorial({ ...editorial, counterargument: e.target.value })
          }
          className={inputClass}
        />
      </label>
      <label className="block text-sm font-semibold">
        Background explainer
        <select
          value={editorial.backgroundPostId || ""}
          onChange={(e) =>
            setEditorial({ ...editorial, backgroundPostId: e.target.value })
          }
          className={inputClass}
        >
          <option value="">None selected</option>
          {publishedPosts(posts)
            .filter((p) => p.id !== currentId && isExplainer(p))
            .map((p) => (
              <option key={p.id} value={p.id}>
                {p.title}
              </option>
            ))}
        </select>
      </label>
      <label className="block text-sm font-semibold">
        Approved sharing quote
        <textarea
          rows={2}
          maxLength={280}
          value={editorial.shareQuote || ""}
          onChange={(e) =>
            setEditorial({ ...editorial, shareQuote: e.target.value })
          }
          className={inputClass}
        />
      </label>
    </section>
  );
}
