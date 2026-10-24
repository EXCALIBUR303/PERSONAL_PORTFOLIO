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
const STOP = new Set("the a an and of for to is are at in on what when how much should i be left every with".split(" "));
export const words = (s: string) =>
  s.toLowerCase().replace(/[^a-z\s]/g, " ").split(/\s+/).filter((w) => w && !STOP.has(w));

/** BM25 keyword score over the sample passages. */
export function bm25(query: string[]) {
  const docs = passages.map((p) => words(p.text));
  const avg = docs.reduce((n, d) => n + d.length, 0) / docs.length;
  return docs.map((doc) =>
    query.reduce((score, term) => {
      const df = docs.filter((d) => d.includes(term)).length;
      if (!df) return score;
      const tf = doc.filter((w) => w === term).length;
      const idf = Math.log(1 + (docs.length - df + 0.5) / (df + 0.5));
      return score + (idf * tf * 2.2) / (tf + 1.2 * (0.25 + (0.75 * doc.length) / avg));
    }, 0),
  );
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


export type Scored = { source: string; text: string; keyword: number; dense: number; total: number };
/** Every passage scored for one question, in the original order. */
export function scoreQuestion(q: number): Scored[] {
  const query = words(questions[q]);
  const k = normalise(bm25(query));
  const d = normalise(overlap(query));
  return passages.map((p, i) => ({ ...p, keyword: k[i], dense: d[i], total: (k[i] + d[i]) / 2 }));
}
