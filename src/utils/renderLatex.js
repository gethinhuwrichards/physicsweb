/**
 * Pre-renders LaTeX math in an HTML string.
 * Uses KaTeX's auto-render on a detached temp element for robust parsing,
 * then returns the resulting HTML for use with dangerouslySetInnerHTML.
 */
export function renderLatex(html) {
  if (!html || typeof html !== 'string') return html || '';

  // Fix orphaned superscripts/subscripts after \, spacing —
  // KaTeX needs a base atom, so insert an empty group {} before ^ or _
  html = html.replace(/\\,(\^|_)\{/g, '\\,{}$1{');

  // Preferred: use renderMathInElement on a detached element
  if (window.renderMathInElement) {
    const temp = document.createElement('div');
    temp.innerHTML = html;
    window.renderMathInElement(temp, {
      delimiters: [
        { left: '$$', right: '$$', display: true },
        { left: '$', right: '$', display: false },
      ],
      throwOnError: false,
    });
    return temp.innerHTML;
  }

  // Fallback: use katex.renderToString with regex matching
  const katex = window.katex;
  if (!katex) return html;

  let result = html.replace(/\$\$([\s\S]+?)\$\$/g, (match, tex) => {
    try {
      return katex.renderToString(tex.trim(), { displayMode: true, throwOnError: false });
    } catch {
      return match;
    }
  });

  result = result.replace(/\$([^\$]+?)\$/g, (match, tex) => {
    try {
      return katex.renderToString(tex.trim(), { displayMode: false, throwOnError: false });
    } catch {
      return match;
    }
  });

  return result;
}
