/** A Finding's place in the field text, in UTF-16 units. */
interface Placed {
  start: number;
  end: number;
}

/**
 * The Findings that are not inside an accepted rewrite (docs/spec.md §3, Rephrase). The Engine
 * already checked each rewrite, so its general words ("noen", "en helseutfordring") are not
 * flagged again. A rewrite is found by its text, so it is trusted only while the user leaves
 * it as it was; once they type inside it, it is scanned like any other text.
 */
export function outsideRephrased<F extends Placed>(findings: F[], text: string, rewrites: Iterable<string>): F[] {
  const spans: Placed[] = [];
  for (const rewrite of rewrites) {
    if (!rewrite) continue;
    for (let at = text.indexOf(rewrite); at >= 0; at = text.indexOf(rewrite, at + 1)) {
      spans.push({ start: at, end: at + rewrite.length });
    }
  }
  return findings.filter((f) => !spans.some((s) => s.start <= f.start && f.end <= s.end));
}
