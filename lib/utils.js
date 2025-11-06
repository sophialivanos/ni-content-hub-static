/**
 * Lightweight classnames combiner (no external deps).
 * Accepts strings, arrays, and objects of {className: boolean}.
 * @param  {...any} inputs
 */
export function cn(...inputs) {
  const out = [];
  for (const x of inputs) {
    if (!x) continue;
    if (typeof x === 'string') out.push(x);
    else if (Array.isArray(x)) out.push(cn(...x));
    else if (typeof x === 'object') {
      for (const [k, v] of Object.entries(x)) if (v) out.push(k);
    }
  }
  // de-duplicate while preserving order
  return Array.from(new Set(out.join(' ').trim().split(/\s+/))).join(' ');
}


