/**
 * Local query expansion + ranking helpers for Explore search (no ML API — fast, deterministic).
 * Handles common abbreviations: "Gen AI" → Generative AI, etc.
 */

const PHRASE_RULES: { re: RegExp; inject: string[] }[] = [
  {
    re: /\bgen\s*ai\b/gi,
    inject: ['generative ai', 'generative artificial intelligence', 'gen ai', 'gen-ai', 'genai', 'generation ai'],
  },
  { re: /\bllm\b/gi, inject: ['large language model', 'language model', 'transformer llm'] },
  { re: /\bml\b(?![a-z])/gi, inject: ['machine learning'] },
  { re: /\bdl\b(?![a-z])/gi, inject: ['deep learning'] },
  { re: /\bnlp\b/gi, inject: ['natural language processing'] },
  {
    re: /\brag\b/gi,
    inject: ['retrieval augmented', 'retrieval-augmented', 'vector search', 'knowledge augmentation'],
  },
  {
    re: /\bxai\b|\bexplainable\b/gi,
    inject: ['explainable ai', 'interpretability', 'model explanations'],
  },
  {
    re: /\bgan\b(?:s)?\b/gi,
    inject: ['generative adversarial', 'gan ', 'deepfake'],
  },
  {
    re: /\bvlm\b|\bvision[\s\-]+language\b/gi,
    inject: ['vision language model', 'multimodal vision', 'clip'],
  },
  { re: /\bmoe\b/gi, inject: ['mixture of experts', 'mixture-of-experts'] },
  { re: /\bpeft\b|\blora\b/gi, inject: ['parameter efficient', 'fine-tuning adapters', 'lora'] },
  {
    re: /\bai[\s\-]+agents?\b|\bagent(ic)?[\s\-]+ai\b/gi,
    inject: ['agentic ai', 'autonomous agents', 'tool use', 'orchestration'],
  },
];

/** Escape Postgres ILIKE specials for PostgREST filter values. */
export function escapeIlike(term: string): string {
  return term.replace(/\\/g, '\\\\').replace(/%/g, '\\%').replace(/_/g, '\\_');
}

/** Expand shorthand / aliases into lowercase search needles (bounded). */
export function expandSearchNeedles(raw: string): string[] {
  const trimmed = raw.trim();
  if (!trimmed) return [];

  const out = new Set<string>();
  out.add(trimmed);
  const lower = trimmed.toLowerCase();
  out.add(lower);

  for (const { re, inject } of PHRASE_RULES) {
    re.lastIndex = 0;
    if (!re.test(lower)) continue;
    for (const s of inject) {
      const v = s.toLowerCase().trim();
      if (v.length >= 2) out.add(v);
    }
  }

  // Normalized phrase for corpus rows that spell out "generative …"
  if (/\bgen\s*ai\b/i.test(lower)) {
    const aug = lower.replace(/\bgen\s*ai\b/gi, 'generative ai').trim();
    out.add(aug);
  }

  const tokens = lower.split(/[^a-z0-9]+/i).filter((w) => w.length >= 3);
  tokens.forEach((w) => out.add(w));

  const list = [...out].filter((s) => {
    const t = s.trim();
    return t.length >= 2 && t !== 'the' && t !== 'for' && t !== 'and' && t !== 'not';
  });

  list.sort((a, b) => b.length - a.length);
  return list.slice(0, 14);
}

export function uniqByKey<T extends { id?: string | null }>(rows: T[] | null | undefined, keyFn: (r: T) => string): T[] {
  const seen = new Set<string>();
  const out: T[] = [];
  for (const r of rows ?? []) {
    const k = keyFn(r);
    if (seen.has(k)) continue;
    seen.add(k);
    out.push(r);
  }
  return out;
}

export function rankExploreTopic<
  R extends {
    title?: string | null;
    short_desc?: string | null;
    description?: string | null;
    field?: string | null;
    id?: string | null;
  },
>(row: R, needles: string[], rawLower: string): number {
  const title = row.title?.toLowerCase() ?? '';
  const shortD = row.short_desc?.toLowerCase() ?? '';
  const desc = row.description?.toLowerCase() ?? '';
  const field = row.field?.toLowerCase() ?? '';
  const id = row.id?.toLowerCase() ?? '';
  const hay = `${title}\n${shortD}\n${desc}\n${field}\n${id}`;

  let score = 0;
  if (rawLower.length >= 2) {
    if (title.includes(rawLower)) score += 12;
    if (title.startsWith(rawLower)) score += 6;
    if (hay.includes(rawLower)) score += 4;
  }
  for (const n of needles) {
    if (!n || n === rawLower) continue;
    if (title.includes(n)) score += 6;
    if (shortD.includes(n) || desc.includes(n)) score += 3;
    if (field.includes(n) || id.includes(n)) score += 2;
  }
  return score;
}

export function rankContentRow<
  R extends {
    title?: string | null;
    summary?: string | null;
    source_name?: string | null;
  },
>(row: R, needles: string[], rawLower: string): number {
  const title = row.title?.toLowerCase() ?? '';
  const sum = row.summary?.toLowerCase() ?? '';
  const src = row.source_name?.toLowerCase() ?? '';
  const hay = `${title}\n${sum}\n${src}`;
  let score = 0;
  if (rawLower.length >= 2) {
    if (title.includes(rawLower)) score += 12;
    if (hay.includes(rawLower)) score += 4;
  }
  for (const n of needles) {
    if (!n || n === rawLower) continue;
    if (title.includes(n)) score += 6;
    if (sum.includes(n)) score += 3;
    if (src.includes(n)) score += 2;
  }
  return score;
}

export function buildIlikeOrClause(columns: string[], needles: string[], maxPairs = 80): string {
  const parts: string[] = [];
  for (const col of columns) {
    for (const n of needles) {
      if (!n?.trim()) continue;
      parts.push(`${col}.ilike.%${escapeIlike(n)}%`);
      if (parts.length >= maxPairs) return parts.join(',');
    }
  }
  return parts.join(',');
}
