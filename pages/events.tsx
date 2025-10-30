import { useState } from "react";
import Layout from "@/components/Layout";

type EventItem = {
  name?: string;
  date?: string;
  description?: string;
  relevantVerticals?: string;
  relevanceExplanation?: string;
  bestPractices?: string;
  contentSuggestions?: Record<string, string>;
};

export default function Events() {
  const [month, setMonth] = useState<number>(new Date().getMonth() + 1);
  const [loading, setLoading] = useState(false);
  const [events, setEvents] = useState<EventItem[]>([]);
  const [error, setError] = useState("");

  async function load() {
    setLoading(true); setError("");
    try {
      const r = await fetch("/api/lf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "content_events_discovery", args: { month }, return_prompt: false })
      });
      const isJson = r.headers.get("content-type")?.includes("application/json");
      const data = await (isJson ? r.json() : r.text());
      if (!r.ok) throw new Error(typeof data === "string" ? data : JSON.stringify(data));

      let list: EventItem[] = [];
      if (data?.content?.holidays) {
        data.content.holidays.forEach((h: any) => {
          if (Array.isArray(h?.relevantHolidays)) list = list.concat(h.relevantHolidays);
        });
      } else if (Array.isArray(data?.events)) list = data.events;
      else if (Array.isArray(data?.result)) list = data.result;
      else if (Array.isArray(data)) list = data;
      setEvents(list);
    } catch (e: any) {
      setError(e.message || "Failed to load");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Layout>
      <div className="bg-white border border-slate-200 rounded-2xl shadow p-6">
        <div className="flex items-center gap-3">
          <label className="font-semibold">Month (1–12)</label>
          <input
            className="border rounded-md px-3 py-2 w-28"
            type="number"
            min={1}
            max={12}
            value={month}
            onChange={(e)=>setMonth(parseInt(e.target.value || "1",10))}
          />
          <button className="px-3 py-2 rounded-md bg-indigo-600 text-white font-semibold" onClick={load} disabled={loading}>
            Load events
          </button>
        </div>

        {loading && <div className="text-slate-500 mt-4">Loading…</div>}
        {error && <div className="mt-4 text-red-700 bg-red-50 border border-red-200 rounded-md p-3">{error}</div>}

        {!loading && !error && (
          <>
            {events.length === 0 ? (
              <div className="text-slate-500 mt-4">No events.</div>
            ) : (
              <div className="grid mt-4 gap-4 grid-cols-1 md:grid-cols-2">
                {events.map((ev, i) => (
                  <div key={i} className="border rounded-xl p-4 shadow-sm bg-white">
                    <div className="flex items-baseline justify-between">
                      <div className="font-bold">{ev.name || "Untitled event"}</div>
                      <div className="text-xs px-2 py-1 rounded-full bg-indigo-100 text-indigo-800">
                        {ev.date ? new Date(ev.date).toLocaleDateString() : ""}
                      </div>
                    </div>
                    {ev.description && <p className="text-slate-600 mt-2">{ev.description}</p>}
                    {ev.relevanceExplanation && <p className="mt-2"><b>Relevance:</b> {ev.relevanceExplanation}</p>}
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </Layout>
  );
}
