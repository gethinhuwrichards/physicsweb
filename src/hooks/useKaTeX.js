import { useRef, useEffect } from 'react';

export function useKaTeX(deps = []) {
  const ref = useRef(null);
  useEffect(() => {
    if (ref.current && window.renderMathInElement) {
      window.renderMathInElement(ref.current, {
        delimiters: [
          { left: '$$', right: '$$', display: true },
          { left: '$', right: '$', display: false },
        ],
        throwOnError: false,
      });
    }
  }, deps);
  return ref;
}
