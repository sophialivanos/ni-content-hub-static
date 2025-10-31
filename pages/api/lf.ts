import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { name, args, return_prompt } = req.body || {};
  const base = process.env.LF_BASE;             // e.g. https://chat-gpt-staging.naturalint.com/lf/workflow
  const bearer = process.env.LF_BEARER || "";   // optional

  if (!base || !name) {
    return res.status(400).json({ error: "LF_BASE or name missing" });
  }

  try {
    const url = `${base.replace(/\/$/, "")}/${encodeURIComponent(name)}`;
    const upstream = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(bearer ? { Authorization: `Bearer ${bearer}` } : {}),
      },
      body: JSON.stringify({ args: args || {}, return_prompt: !!return_prompt }),
    });

    const ct = upstream.headers.get("content-type") || "";
    const payload = ct.includes("application/json") ? await upstream.json() : await upstream.text();

    if (!upstream.ok) {
      return res.status(upstream.status).send(payload);
    }
    if (typeof payload === "string") {
      res.setHeader("Content-Type", "text/plain; charset=utf-8");
      return res.status(200).send(payload);
    }
    return res.status(200).json(payload);
  } catch (err: any) {
    return res.status(500).json({ error: err?.message || "Proxy request failed" });
  }
}