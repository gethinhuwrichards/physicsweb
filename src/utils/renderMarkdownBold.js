export function renderMarkdownBold(text) {
  // Split on LaTeX delimiters to avoid converting ** inside math regions.
  // Odd-indexed segments are inside $...$ and should be left untouched.
  const parts = text.split(/(\$\$[\s\S]+?\$\$|\$[^$]+?\$)/g);
  return parts
    .map((part, i) =>
      i % 2 === 0 ? part.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>') : part
    )
    .join('');
}
