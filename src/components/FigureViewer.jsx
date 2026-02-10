import React, { useEffect, useMemo, useRef, useState } from 'react';
import { renderLatex } from '../utils/renderLatex';
import * as pdfjsLib from 'pdfjs-dist';

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url
).toString();

function PdfPage({ src, page }) {
  const canvasRef = useRef(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    (async () => {
      try {
        const pdf = await pdfjsLib.getDocument(src).promise;
        const pg = await pdf.getPage(page);
        const scale = 2;
        const viewport = pg.getViewport({ scale });
        const canvas = canvasRef.current;
        if (!canvas || cancelled) return;
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        const ctx = canvas.getContext('2d');
        await pg.render({ canvasContext: ctx, viewport }).promise;
        if (!cancelled) setLoading(false);
      } catch (err) {
        console.error('PDF render error:', err);
        if (!cancelled) setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [src, page]);

  return (
    <div className="pdf-page-container">
      {loading && <div className="pdf-loading">Loading page...</div>}
      <canvas ref={canvasRef} className="pdf-page-canvas" style={{ display: loading ? 'none' : 'block' }} />
    </div>
  );
}

export default function FigureViewer({ src, label, onClose, onPrev, onNext, tableData, pdfSrc, pdfPage }) {
  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft' && onPrev) onPrev();
      if (e.key === 'ArrowRight' && onNext) onNext();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose, onPrev, onNext]);

  const renderedTable = useMemo(() => {
    if (!tableData) return null;
    return (
      <table className="viewer-table">
        <thead>
          <tr>
            {tableData.headers.map((h, i) => (
              <th key={i} dangerouslySetInnerHTML={{ __html: renderLatex(h) }} />
            ))}
          </tr>
        </thead>
        <tbody>
          {tableData.rows.map((row, ri) => (
            <tr key={ri}>
              {row.map((cell, ci) => (
                <td key={ci} dangerouslySetInnerHTML={{ __html: renderLatex(cell) }} />
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    );
  }, [tableData]);

  const isPdf = !!pdfSrc;
  const contentClass = tableData
    ? 'figure-viewer-content figure-viewer-content-table'
    : isPdf
      ? 'figure-viewer-content figure-viewer-content-pdf'
      : 'figure-viewer-content';

  return (
    <div className="figure-viewer-overlay" onClick={onClose}>
      <div
        className={contentClass}
        onClick={(e) => e.stopPropagation()}
      >
        <button className="figure-viewer-close" onClick={onClose} aria-label="Close viewer">
          &times;
        </button>

        {onPrev && (
          <button
            className="figure-viewer-nav figure-viewer-prev"
            onClick={onPrev}
            aria-label="Previous"
          >
            &#8249;
          </button>
        )}

        {isPdf ? (
          <PdfPage src={pdfSrc} page={pdfPage} />
        ) : tableData ? (
          renderedTable
        ) : (
          <img src={src} alt={label} />
        )}
        <div className="figure-viewer-caption">{label}{tableData && tableData.caption ? `: ${tableData.caption}` : ''}</div>

        {onNext && (
          <button
            className="figure-viewer-nav figure-viewer-next"
            onClick={onNext}
            aria-label="Next"
          >
            &#8250;
          </button>
        )}
      </div>
    </div>
  );
}
