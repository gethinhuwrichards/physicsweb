import React, { useState, useEffect } from 'react';

export default function FigureSidebar({ figures, onFigureClick, activeFigure }) {
  const [drawerOpen, setDrawerOpen] = useState(false);

  const handleClick = (index) => {
    onFigureClick(index);
    setDrawerOpen(false);
  };

  useEffect(() => {
    if (!drawerOpen) return;
    const handleKey = (e) => {
      if (e.key === 'Escape') setDrawerOpen(false);
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [drawerOpen]);

  return (
    <div className={`figure-sidebar ${drawerOpen ? 'drawer-open' : ''}`}>
      <div
        className="figure-sidebar-mobile-trigger"
        onClick={() => setDrawerOpen(prev => !prev)}
      >
        <span>Figures ({figures.length})</span>
        <span className="figure-sidebar-mobile-arrow">{drawerOpen ? '\u25BC' : '\u25B2'}</span>
      </div>

      <div className="figure-sidebar-thumbs">
        <div className="figure-sidebar-title">Figures</div>
        {figures.map((fig) => (
          <button
            key={fig.src}
            className={`figure-thumb ${activeFigure === fig.index ? 'active' : ''}`}
            onClick={() => handleClick(fig.index)}
            aria-label={`View ${fig.label}`}
          >
            <img src={`images/${fig.src}`} alt={fig.label} loading="lazy" />
            <div className="figure-thumb-label">{fig.label}</div>
          </button>
        ))}
      </div>
    </div>
  );
}
