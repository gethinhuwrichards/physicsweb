import React, { useState, useRef, useMemo } from 'react';
import { renderLatex } from '../../utils/renderLatex';

const EMPTY_LINKS = {};

const LINK_COLORS = [
  { bg: 'rgba(59, 130, 246, 0.18)', border: '#3b82f6' },   // blue
  { bg: 'rgba(34, 197, 94, 0.18)', border: '#22c55e' },    // green
  { bg: 'rgba(234, 179, 8, 0.18)', border: '#eab308' },    // yellow
  { bg: 'rgba(249, 115, 22, 0.18)', border: '#f97316' },   // orange
  { bg: 'rgba(168, 85, 247, 0.18)', border: '#a855f7' },   // purple
  { bg: 'rgba(236, 72, 153, 0.18)', border: '#ec4899' },   // pink
];

export default function MatchUpInput({ part, value, onChange, disabled, autoMarkResult }) {
  const links = value || EMPTY_LINKS;
  const [selectedLeft, setSelectedLeft] = useState(null);
  const colorMapRef = useRef({});

  const renderedLeft = useMemo(
    () => part.leftItems.map(item => renderLatex(item)),
    [part.leftItems]
  );

  const renderedRight = useMemo(
    () => part.rightItems.map(item =>
      typeof item === 'string' ? renderLatex(item) : null
    ),
    [part.rightItems]
  );

  // Build reverse map: rightIdx → leftIdx
  const rightToLeft = useMemo(() => {
    const map = {};
    Object.entries(links).forEach(([l, r]) => { map[r] = Number(l); });
    return map;
  }, [links]);

  // Stable color assignments — once a pair gets a color, it keeps it
  const colorAssignments = useMemo(() => {
    const prev = colorMapRef.current;
    const next = {};
    const usedColors = new Set();

    // Preserve colors for links that still exist
    Object.keys(links).forEach(leftIdx => {
      if (prev[leftIdx] !== undefined) {
        next[leftIdx] = prev[leftIdx];
        usedColors.add(prev[leftIdx]);
      }
    });

    // Assign new colors for new links (pick first unused color)
    Object.keys(links).forEach(leftIdx => {
      if (next[leftIdx] === undefined) {
        let ci = 0;
        while (usedColors.has(ci) && ci < LINK_COLORS.length) ci++;
        next[leftIdx] = ci % LINK_COLORS.length;
        usedColors.add(ci % LINK_COLORS.length);
      }
    });

    colorMapRef.current = next;
    return next;
  }, [links]);

  function handleLeftClick(i) {
    if (disabled) return;
    if (links[i] !== undefined) return;
    setSelectedLeft(i === selectedLeft ? null : i);
  }

  function handleRightClick(j) {
    if (disabled || selectedLeft === null) return;
    if (rightToLeft[j] !== undefined) return;
    const next = { ...links, [selectedLeft]: j };
    onChange(next);
    setSelectedLeft(null);
  }

  function handleCancel(leftIdx) {
    if (disabled) return;
    const next = { ...links };
    delete next[leftIdx];
    onChange(next);
  }

  function handleContainerClick(e) {
    if (!e.target.closest('.matchup-box')) {
      setSelectedLeft(null);
    }
  }

  function getLeftBoxStyle(i) {
    if (autoMarkResult) return {};
    if (links[i] !== undefined) {
      const color = LINK_COLORS[colorAssignments[i]];
      return { borderColor: color.border, background: color.bg };
    }
    return {};
  }

  function getRightBoxStyle(j) {
    if (autoMarkResult) return {};
    const linkedLeft = rightToLeft[j];
    if (linkedLeft !== undefined) {
      const color = LINK_COLORS[colorAssignments[linkedLeft]];
      return { borderColor: color.border, background: color.bg };
    }
    return {};
  }

  function getLeftBoxClass(i) {
    let cls = 'matchup-box';
    if (disabled) cls += ' disabled';
    if (selectedLeft === i) cls += ' selected';
    if (links[i] !== undefined) cls += ' linked';
    if (autoMarkResult) {
      const correctLink = autoMarkResult.results.find(r => r.leftIdx === i);
      if (correctLink) {
        cls += correctLink.isCorrect ? ' correct' : '';
      }
    }
    return cls;
  }

  function getRightBoxClass(j) {
    let cls = 'matchup-box';
    if (disabled) cls += ' disabled';
    if (rightToLeft[j] !== undefined) cls += ' linked';
    if (autoMarkResult) {
      const linkedLeft = rightToLeft[j];
      if (linkedLeft !== undefined) {
        const correctLink = autoMarkResult.results.find(r => r.leftIdx === linkedLeft && r.rightIdx === j);
        if (correctLink) {
          cls += correctLink.isCorrect ? ' correct' : ' incorrect';
        } else {
          cls += ' incorrect';
        }
      }
    }
    return cls;
  }

  return (
    <div className="matchup-container" onClick={handleContainerClick}>
      <div className="matchup-columns">
        <div className="matchup-column-left">
          {part.leftItems.map((item, i) => (
            <div
              key={i}
              className={getLeftBoxClass(i)}
              style={getLeftBoxStyle(i)}
              onClick={(e) => { e.stopPropagation(); handleLeftClick(i); }}
            >
              <span dangerouslySetInnerHTML={{ __html: renderedLeft[i] }} />
            </div>
          ))}
        </div>

        <div className="matchup-column-right">
          {part.rightItems.map((item, j) => (
            <div key={j} className="matchup-right-row">
              <div
                className={getRightBoxClass(j)}
                style={getRightBoxStyle(j)}
                onClick={(e) => { e.stopPropagation(); handleRightClick(j); }}
              >
                {typeof item === 'object' && item.image ? (
                  <img
                    src={`images/${item.image}`}
                    alt={`Option ${j + 1}`}
                    className="matchup-box-image"
                  />
                ) : (
                  <span dangerouslySetInnerHTML={{ __html: renderedRight[j] }} />
                )}
              </div>
              {!disabled && (
                <button
                  className="matchup-cancel-btn"
                  style={rightToLeft[j] !== undefined ? undefined : { visibility: 'hidden' }}
                  onClick={(e) => { e.stopPropagation(); handleCancel(rightToLeft[j]); }}
                  title="Remove link"
                >
                  ✕
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
