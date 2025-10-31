import * as React from "react";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

type EventItem = {
  name?: string;
  date?: string;
  description?: string;
  relevantVerticals?: string;
  relevanceExplanation?: string;
  bestPractices?: string;
  contentSuggestions?: Record<string, string>;
};

const MONTHS = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December"
];

export default function Events() {
  const [month, setMonth] = useState<number>(new Date().getMonth() + 1); // 1..12
  const [loading, setLoading] = useState(false);
  const [events, setEvents] = useState<EventItem[]>([]);
  const [error, setError] = useState<string>("");

  async function load() {
    setLoading(true);
    setError("");
    try {
      const r = await fetch("/api/lf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "content_events_discovery",
          args: { month },
          return_prompt: false,
        }),
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
    <div className="mx-auto max-w-6xl space-y-6">
      <Card className="border-slate-200 shadow-soft">
        <CardHeader className="pb-3">
          <CardTitle className="text-2xl">Seasonal Events</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap items-end gap-3">
          <div className="flex flex-col">
            <label htmlFor="month" className="text-sm font-medium text-slate-700">
              Month
            </label>
            <select
              id="month"
              className="mt-1 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
              value={month}
              onChange={(e)=>setMonth(parseInt(e.target.value,10))}
            >
              {MONTHS.map((m, idx) => (
                <option key={m} value={idx + 1}>{m}</option>
              ))}
            </select>
          </div>

          <Button onClick={load} disabled={loading}>
            {loading ? "Loading…" : "Load events"}
          </Button>

          <div className="text-sm text-slate-500">
            Data for <span className="font-medium">{MONTHS[month - 1]}</span>
          </div>
        </CardContent>
      </Card>

      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 p-3 text-red-800">
          {error}
        </div>
      )}

      {/* Loading skeletons */}
      {loading && (
        <div className="grid gap-4 sm:grid-cols-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4 space-y-3">
                <div className="flex justify-between">
                  <Skeleton className="h-5 w-40" />
                  <Skeleton className="h-6 w-24 rounded-full" />
                </div>
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-2/3" />
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {!loading && !error && (
        <>
          {events.length === 0 ? (
            <div className="text-slate-500">No events.</div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {events.map((ev, i) => {
                const dateLabel = ev.date
                  ? new Date(ev.date).toLocaleDateString("en-GB", {
                      weekday: "long", day: "numeric", month: "long", year: "numeric",
                    })
                  : "";

                const verticals =
                  ev.relevantVerticals
                    ?.split(",")
                    .map(v => v.trim())
                    .filter(Boolean) || [];

                return (
                  <Card key={i} className="border-slate-200">
                    <CardHeader className="pb-3">
                      <div className="flex items-baseline justify-between gap-3">
                        <CardTitle className="text-lg leading-6">
                          {ev.name || "Untitled event"}
                        </CardTitle>
                        {dateLabel && (
                          <Badge variant="secondary" className="text-xs">
                            {dateLabel}
                          </Badge>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {verticals.length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                          {verticals.map((v) => (
                            <Badge key={v} variant="outline">{v}</Badge>
                          ))}
                        </div>
                      )}
                      {ev.description && (
                        <p className="text-slate-600">{ev.description}</p>
                      )}
                      {ev.relevanceExplanation && (
                        <p className="text-slate-700">
                          <span className="font-semibold">Relevance:&nbsp;</span>
                          {ev.relevanceExplanation}
                        </p>
                      )}
                      {ev.bestPractices && (
                        <p className="text-emerald-700">
                          <span className="font-semibold">Best practices:&nbsp;</span>
                          {ev.bestPractices}
                        </p>
                      )}
                      {ev.contentSuggestions && (
                        <div className="space-y-1">
                          {Object.entries(ev.contentSuggestions).map(([k, v]) => (
                            <div key={k} className="flex gap-2">
                              <Badge className="shrink-0">{k}</Badge>
                              <span className="text-slate-700">{v}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}