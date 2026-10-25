import { test, expect } from "@playwright/test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { bm25, passages, questions, scoreQuestion, words } from "../src/components/scenes/retrieval-data";

/**
 * Parity of the Private Local AI scene's scoring with the project's own code.
 * tests/fixtures/retrieval-reference.json holds what the project's tokenize(),
 * _bm25_scores() and search() (private-local-ai at 091da75) returned for these
 * sample passages and questions, with a dense side that has the same ranking as
 * the scene's word-overlap stand-in. Fused scores and ranks must match exactly;
 * raw BM25 matches to float32 precision (the project computes it in float32).
 */
const reference = JSON.parse(
  readFileSync(join(__dirname, "fixtures", "retrieval-reference.json"), "utf8"),
) as {
  questions: {
    question: string;
    rows: {
      source: string;
      bm25: number;
      standin: number;
      fused: number;
      denseRank: number;
      lexicalRank: number | null;
      place: number;
    }[];
  }[];
};

test("the scene fuses keyword and meaning ranks exactly as the project does", () => {
  expect(reference.questions.map((q) => q.question)).toEqual(questions);
  questions.forEach((question, q) => {
    const scored = scoreQuestion(q);
    const raw = bm25(words(question));
    const expected = reference.questions[q].rows;
    expect(scored).toHaveLength(passages.length);
    scored.forEach((row, i) => {
      const ref = expected[i];
      expect(row.source).toBe(ref.source);
      expect(Math.abs(row.fused - ref.fused)).toBeLessThan(1e-9);
      expect(row.denseRank).toBe(ref.denseRank);
      expect(row.lexicalRank).toBe(ref.lexicalRank);
      expect(row.place).toBe(ref.place);
      expect(Math.abs(raw[i] - ref.bm25)).toBeLessThan(1e-5 * Math.max(1, ref.bm25));
    });
  });
});
