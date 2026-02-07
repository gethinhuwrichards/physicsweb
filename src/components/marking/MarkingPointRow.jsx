import React, { useMemo, useRef, useState, useLayoutEffect } from 'react';
import { renderLatex } from '../../utils/renderLatex';
import { renderMarkdownBold } from '../../utils/renderMarkdownBold';

function buildTracePath(w, h, r) {
  // Rounded rect path starting from top-right corner, going clockwise
  return `M ${w - r} 0 A ${r} ${r} 0 0 1 ${w} ${r} V ${h - r} A ${r} ${r} 0 0 1 ${w - r} ${h} H ${r} A ${r} ${r} 0 0 1 0 ${h - r} V ${r} A ${r} ${r} 0 0 1 ${r} 0 Z`;
}

export default function MarkingPointRow({ point, decision, onDecide, locked, awardDisabled, pointNumber, dependencyNote, highlight }) {
  const renderedText = useMemo(
    () => renderLatex(renderMarkdownBold(point.text)),
    [point.text]
  );

  const isLocked = locked === true;
  const isAwardDisabled = isLocked || awardDisabled === true;
  const decided = decision !== null && decision !== undefined;

  const rowRef = useRef(null);
  const [tracePath, setTracePath] = useState('');

  useLayoutEffect(() => {
    if (highlight && rowRef.current) {
      const width = rowRef.current.offsetWidth;
      const height = rowRef.current.offsetHeight;
      setTracePath(buildTracePath(width, height, 10));
    } else {
      setTracePath('');
    }
  }, [highlight]);

  const label = isLocked && decided
    ? <>Marking Point {pointNumber} &mdash; <span className={decision ? 'marking-point-awarded' : 'marking-point-not-awarded'}>{decision ? 'Awarded' : 'Not awarded'}</span></>
    : `Marking Point ${pointNumber}`;

  return (
    <div ref={rowRef} className={`marking-point-row${decided ? ' decided' : ''}${isLocked ? ' locked' : ''}${highlight ? ' trace-border' : ''}`}>
      {tracePath && (
        <svg className="trace-border-svg" aria-hidden="true">
          <path d={tracePath} pathLength="1" />
        </svg>
      )}
      <div className="marking-point-label">
        {label}
        {dependencyNote && <em className="marking-point-dep-note"> {dependencyNote}</em>}
      </div>
      <div className="marking-point-content">
        <span
          className="marking-point-text"
          dangerouslySetInnerHTML={{
            __html: (point.marks > 1 ? `[${point.marks} marks] ` : '') + renderedText
          }}
        />
        <div className="marking-point-buttons">
          <div className="mark-btn-wrapper">
            <button
              className={`mark-tick${decision === true ? ' selected' : ''}${awardDisabled && !isLocked ? ' award-capped' : ''}`}
              onClick={() => onDecide(decision === true ? null : true)}
              disabled={isAwardDisabled}
              aria-label="Award"
            >&#10003;</button>
            <span className="mark-btn-label">Award</span>
          </div>
          <div className="mark-btn-wrapper">
            <button
              className={`mark-cross${decision === false ? ' selected' : ''}`}
              onClick={() => onDecide(decision === false ? null : false)}
              disabled={isLocked}
              aria-label="Deny"
            >&#10007;</button>
            <span className="mark-btn-label">Deny</span>
          </div>
        </div>
      </div>
    </div>
  );
}
