import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  const { name, args = {}, return_prompt = false } = req.body || {};
  if (!name) return res.status(400).json({ error: "Missing workflow name" });

  const base = process.env.LF_BASE;
  if (!base) return res.status(500).json({ error: "Server misconfigured: LF_BASE missing" });

  const url = `${base}${encodeURIComponent(name)}`;
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  const token = process.env.LF_BEARER;
  if (token) headers.Authorization = `Bearer ${token}`;

  const upstream = await fetch(url, { method: "POST", headers, body: JSON.stringify({ args, return_prompt }) });
  const text = await upstream.text();
  if (!upstream.ok) return res.status(upstream.status).send(text);

  try { return res.status(200).json(JSON.parse(text)); }
  catch { return res.status(200).send(text); }
}
