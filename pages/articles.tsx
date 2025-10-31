// pages/articles.tsx
import { useState } from "react";

export default function Articles() {
  const [industry, setIndustry] = useState("");
  const [vertical, setVertical] = useState("");
  const [keywords, setKeywords] = useState("");
  const [headline, setHeadline] = useState("");

  return (
      <div className="bg-white border border-slate-200 rounded-2xl shadow p-6">
        <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight mb-4">
          Article Creation
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input
            className="border rounded-md px-3 py-2"
            placeholder="Industry"
            value={industry}
            onChange={(e) => setIndustry(e.target.value)}
          />
          <input
            className="border rounded-md px-3 py-2"
            placeholder="Vertical"
            value={vertical}
            onChange={(e) => setVertical(e.target.value)}
          />
          <input
            className="border rounded-md px-3 py-2 md:col-span-2"
            placeholder="Keywords (comma separated)"
            value={keywords}
            onChange={(e) => setKeywords(e.target.value)}
          />
          <input
            className="border rounded-md px-3 py-2 md:col-span-2"
            placeholder="Headline"
            value={headline}
            onChange={(e) => setHeadline(e.target.value)}
          />
        </div>

        <div className="mt-4 flex gap-3">
          <button className="px-3 py-2 rounded-md bg-slate-200 text-slate-900 font-semibold">
            Get trends/headlines
          </button>
          <button className="px-3 py-2 rounded-md bg-indigo-600 text-white font-semibold">
            Generate article
          </button>
        </div>
      </div>
  );
}