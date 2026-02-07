import React, { useEffect } from 'react';

export default function FigureViewer({ src, label, onClose, onPrev, onNext }) {
  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft' && onPrev) onPrev();
      if (e.key === 'ArrowRight' && onNext) onNext();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose, onPrev, onNext]);

  return (
    <div className="figure-viewer-overlay" onClick={onClose}>
      <div className="figure-viewer-content" onClick={(e) => e.stopPropagation()}>
        <button className="figure-viewer-close" onClick={onClose} aria-label="Close viewer">
          &times;
        </button>

        {onPrev && (
          <button
            className="figure-viewer-nav figure-viewer-prev"
            onClick={onPrev}
            aria-label="Previous figure"
          >
            &#8249;
          </button>
        )}

        <img src={src} alt={label} />
        <div className="figure-viewer-caption">{label}</div>

        {onNext && (
          <button
            className="figure-viewer-nav figure-viewer-next"
            onClick={onNext}
            aria-label="Next figure"
          >
            &#8250;
          </button>
        )}
      </div>
    </div>
  );
}
