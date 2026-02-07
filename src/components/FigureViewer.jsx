import React, { useEffect, useMemo } from 'react';
import { renderLatex } from '../utils/renderLatex';

export default function FigureViewer({ src, label, onClose, onPrev, onNext, tableData }) {
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

  return (
    <div className="figure-viewer-overlay" onClick={onClose}>
      <div
        className={`figure-viewer-content${tableData ? ' figure-viewer-content-table' : ''}`}
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

        {tableData ? renderedTable : <img src={src} alt={label} />}
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
