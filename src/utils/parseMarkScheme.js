const MARK_PREFIX_RE = /^(\d+)\s+marks?\s*:\s*/i;
const SCORE_INFO_RE = /scores?\s+\d+\s+marks?/i;

export function parseMarkScheme(markSchemeArray) {
  return markSchemeArray
    .filter(entry => !SCORE_INFO_RE.test(entry))
    .map(entry => {
      const match = entry.match(MARK_PREFIX_RE);
      if (match) {
        return { marks: parseInt(match[1], 10), text: entry.slice(match[0].length) };
      }
      return { marks: 1, text: entry };
    });
}
