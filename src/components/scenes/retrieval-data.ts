/**
 * Sample notes and the scoring the retrieval scenes share. The flat walkthrough
 * and the 3D vault both read this file, so the numbers always agree.
 */
/** Made-up notes. Nothing here comes from Private Local AI or anyone's files. */
export const passages = [
  { source: "travel-notes.md § Visa", text: "The visa appointment is booked for the second week of March at the consulate." },
  { source: "travel-notes.md § Packing", text: "Pack the laptop charger, the adapter and printed copies of the hotel booking." },
  { source: "lab-handbook.pdf · p. 2", text: "Lab doors lock at nine in the evening; ask the technician for weekend access." },
  { source: "lab-handbook.pdf · p. 4", text: "Soldering stations must be switched off and the fume extractor left running for five minutes." },
  { source: "budget.csv · row 7", text: "Monthly budget for groceries is set to four thousand rupees, reviewed every Sunday." },
];
export const questions = [
  "When do the lab doors lock?",
  "What should I pack for the trip?",
  "How much is the grocery budget?",
];
/*
 * Retrieval as Private Local AI does it: BM25 over discriminative terms and a
 * meaning match, fused by weighted Reciprocal Rank Fusion. The constants and
 * rules below are those of the project's app/vectorstore.py (audited commit
 * 091da75). The meaning match is the one stand-in: the project ranks passages
 * by embedding similarity; here a word-prefix overlap plays that part, because
 * no embedding model runs in the browser.
 */
const DENSE_WEIGHT = 1.0;
const LEXICAL_WEIGHT = 0.5;
const RRF_K = 20;
/** Lexical candidates below this share of the best BM25 score are dropped. */
const LEXICAL_FLOOR = 0.35;
/** A term in more than this share of the passages carries little signal... */
const MAX_DF_RATIO = 0.5;
/** ...but only once there are enough passages for document frequency to mean something. */
const MIN_DOCS_FOR_DF_GUARD = 5;
const BM25_K1 = 1.5;
const BM25_B = 0.75;

const STOPWORDS = new Set(
  `a an and any are as at be been being but by can could did do does doing done
for from had has have having he her hers him his how i if in into is it its
me my no nor not of off on or our ours out over own she should so some such
than that the their theirs them then there these they this those to too us
was we were what when where which while who whom why will with would you your
about after again all also am because before below between during each few
more most other same through under until up very via what's don't isn't`
    .split(/\s+/)
    .filter(Boolean),
);

/** Very light plural folding, as in the project ("wrenches" meets "wrench"). */
function singularise(word: string) {
  if (word.length > 4 && word.endsWith("ies")) return `${word.slice(0, -3)}y`;
  if (word.length > 4 && /(ches|shes|sses|xes|zes)$/.test(word)) return word.slice(0, -2);
  if (word.length > 3 && word.endsWith("s") && !/(ss|us|is)$/.test(word)) return word.slice(0, -1);
  return word;
}
export function words(text: string) {
  const out: string[] = [];
  for (const raw of text.toLowerCase().match(/[a-z0-9_]+/g) ?? []) {
    if (raw.length < 2 || STOPWORDS.has(raw)) continue;
    const token = singularise(raw);
    if (token && !STOPWORDS.has(token)) out.push(token);
  }
  return out;
}

/** BM25 over discriminative query terms only (project: _bm25_scores, k1 1.5, b 0.75). */
export function bm25(query: string[]) {
  const docs = passages.map((p) => words(p.text));
  const n = docs.length;
  const avg = docs.reduce((total, d) => total + d.length, 0) / n || 1;
  const df = new Map<string, number>();
  for (const d of docs) for (const t of new Set(d)) df.set(t, (df.get(t) ?? 0) + 1);
  const scores = docs.map(() => 0);
  for (const term of new Set(query)) {
    const c = df.get(term);
    if (!c) continue;
    if (n >= MIN_DOCS_FOR_DF_GUARD && c > MAX_DF_RATIO * n) continue;
    const idf = Math.log(1 + (n - c + 0.5) / (c + 0.5));
    docs.forEach((doc, i) => {
      const f = doc.filter((w) => w === term).length;
      if (!f) return;
      const dl = doc.length || 1;
      scores[i] += (idf * (f * (BM25_K1 + 1))) / (f + BM25_K1 * (1 - BM25_B + (BM25_B * dl) / avg));
    });
  }
  return scores;
}
/** Stand-in for embedding similarity: cosine over word prefixes, so "lock" meets "locks". */
export function overlap(query: string[]) {
  const stem = (w: string) => w.slice(0, 4);
  const q = new Set(query.map(stem));
  return passages.map((p) => {
    const d = new Set(words(p.text).map(stem));
    const shared = [...q].filter((w) => d.has(w)).length;
    return shared / Math.sqrt(q.size * d.size || 1);
  });
}
export const normalise = (xs: number[]) => {
  const max = Math.max(...xs) || 1;
  return xs.map((x) => x / max);
};

export const steps = ["Split", "Score", "Combine", "Fence", "Cite"] as const;


export type Scored = {
  source: string;
  text: string;
  /** BM25 score, shown as a share of the best passage. */
  keyword: number;
  /** The word-overlap stand-in for the meaning match, shown as a share of the best passage. */
  dense: number;
  /** Fused score as a share of the best passage (best = 1). */
  total: number;
  /** Raw weighted Reciprocal Rank Fusion score. */
  fused: number;
  /** Zero-based rank in the meaning list, and in the keyword list (null when dropped by the floor). */
  denseRank: number;
  lexicalRank: number | null;
  /** Final position after fusion, 0 = best. */
  place: number;
};
/** Ranks by score, best first; equal scores keep the original order (stable). */
function ranks(scores: number[]) {
  const order = scores.map((_, i) => i).sort((a, b) => scores[b] - scores[a] || a - b);
  return order;
}
/**
 * Every passage scored for one question, in the original order. Fusion follows
 * the project: fused = 1.0 / (20 + denseRank) + 0.5 / (20 + lexicalRank), with
 * lexical candidates below 0.35 of the best BM25 score dropped.
 */
export function scoreQuestion(q: number): Scored[] {
  const query = words(questions[q]);
  const lex = bm25(query);
  const meaning = overlap(query);
  const denseOrder = ranks(meaning);
  const denseRank: number[] = [];
  denseOrder.forEach((idx, r) => (denseRank[idx] = r));
  const lexicalRank: (number | null)[] = passages.map(() => null);
  const best = Math.max(...lex);
  if (best > 0) {
    const floor = best * LEXICAL_FLOOR;
    ranks(lex).forEach((idx, r) => {
      if (lex[idx] >= floor) lexicalRank[idx] = r;
    });
  }
  const fused = passages.map(
    (_, i) =>
      DENSE_WEIGHT / (RRF_K + denseRank[i]) +
      (lexicalRank[i] === null ? 0 : LEXICAL_WEIGHT / (RRF_K + (lexicalRank[i] as number))),
  );
  // Equal fused scores keep the meaning-list order, as in the project.
  const final = fused
    .map((_, i) => i)
    .sort((a, b) => fused[b] - fused[a] || denseRank[a] - denseRank[b]);
  const place: number[] = [];
  final.forEach((idx, r) => (place[idx] = r));
  const top = Math.max(...fused) || 1;
  const k = normalise(lex);
  const d = normalise(meaning);
  return passages.map((p, i) => ({
    ...p,
    keyword: k[i],
    dense: d[i],
    total: fused[i] / top,
    fused: fused[i],
    denseRank: denseRank[i],
    lexicalRank: lexicalRank[i],
    place: place[i],
  }));
}
