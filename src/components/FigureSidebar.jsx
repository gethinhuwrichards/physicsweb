import React, { useState, useEffect } from 'react';

export default function FigureSidebar({
  figures,
  tables,
  onFigureClick,
  onTableClick,
  activeFigure,
  activeTable,
}) {
  const [drawerOpen, setDrawerOpen] = useState(false);

  const handleFigClick = (index) => {
    onFigureClick(index);
    setDrawerOpen(false);
  };

  const handleTblClick = (index) => {
    onTableClick(index);
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

  const totalAssets = figures.length + tables.length;
  const triggerLabel = figures.length > 0 && tables.length > 0
    ? `Figures & Tables (${totalAssets})`
    : figures.length > 0
      ? `Figures (${figures.length})`
      : `Tables (${tables.length})`;

  return (
    <div className={`figure-sidebar ${drawerOpen ? 'drawer-open' : ''}`}>
      <div
        className="figure-sidebar-mobile-trigger"
        onClick={() => setDrawerOpen(prev => !prev)}
      >
        <span>{triggerLabel}</span>
        <span className="figure-sidebar-mobile-arrow">{drawerOpen ? '\u25BC' : '\u25B2'}</span>
      </div>

      <div className="figure-sidebar-thumbs">
        {figures.length > 0 && (
          <>
            <div className="figure-sidebar-title">Figures</div>
            {figures.map((fig) => (
              <button
                key={fig.src}
                className={`figure-thumb ${activeFigure === fig.index ? 'active' : ''}`}
                onClick={() => handleFigClick(fig.index)}
                aria-label={`View ${fig.label}`}
              >
                <img src={`images/${fig.src}`} alt={fig.label} loading="lazy" />
                <div className="figure-thumb-label">{fig.label}</div>
              </button>
            ))}
          </>
        )}

        {tables.length > 0 && (
          <>
            <div className="figure-sidebar-title sidebar-title-tables">Tables</div>
            {tables.map((tbl) => (
              <button
                key={tbl.index}
                className={`table-thumb ${activeTable === tbl.index ? 'active' : ''}`}
                onClick={() => handleTblClick(tbl.index)}
                aria-label={`View ${tbl.label}`}
              >
                <span className="table-thumb-icon">&#9638;</span>
                <span className="table-thumb-label">{tbl.label}</span>
              </button>
            ))}
          </>
        )}
      </div>
    </div>
  );
}
