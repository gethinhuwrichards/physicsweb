import React, { useState, useEffect } from 'react';

export default function FigureSidebar({
  figures,
  tables,
  onFigureClick,
  onTableClick,
  onEquationsClick,
  activeFigure,
  activeTable,
  activeEquations,
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

  const handleEqClick = () => {
    if (onEquationsClick) onEquationsClick();
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

  const totalAssets = figures.length + tables.length + (onEquationsClick ? 1 : 0);
  const parts = [];
  if (figures.length > 0) parts.push(`Figures`);
  if (tables.length > 0) parts.push(`Tables`);
  if (onEquationsClick) parts.push(`Equations`);
  const triggerLabel = `${parts.join(' & ')} (${totalAssets})`;

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
        {onEquationsClick && (
          <>
            <div className="figure-sidebar-title">Equations</div>
            <button
              className={`table-thumb ${activeEquations ? 'active' : ''}`}
              onClick={handleEqClick}
              aria-label="View Equations Sheet"
            >
              <span className="table-thumb-icon">
                <svg viewBox="0 0 16 16" fill="currentColor" width="14" height="14">
                  <path d="M2 1.5A1.5 1.5 0 0 1 3.5 0h9A1.5 1.5 0 0 1 14 1.5v13a1.5 1.5 0 0 1-1.5 1.5h-9A1.5 1.5 0 0 1 2 14.5v-13zM4 4h8v1H4V4zm0 3h8v1H4V7zm0 3h5v1H4v-1z"/>
                </svg>
              </span>
              <span className="table-thumb-label">Equation Sheet</span>
            </button>
          </>
        )}

        {figures.length > 0 && (
          <>
            <div className={`figure-sidebar-title${onEquationsClick ? ' sidebar-title-tables' : ''}`}>Figures</div>
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
            <div className={`figure-sidebar-title${figures.length > 0 || onEquationsClick ? ' sidebar-title-tables' : ''}`}>Tables</div>
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
