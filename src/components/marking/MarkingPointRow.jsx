import React, { useMemo } from 'react';
import { renderLatex } from '../../utils/renderLatex';
import { renderMarkdownBold } from '../../utils/renderMarkdownBold';

export default function MarkingPointRow({ point, decision, onDecide, locked, pointNumber, dependencyNote }) {
  const renderedText = useMemo(
    () => renderLatex(renderMarkdownBold(point.text)),
    [point.text]
  );

  const isLocked = locked === true;
  const decided = decision !== null && decision !== undefined;

  const label = isLocked && decided
    ? <>Marking Point {pointNumber} &mdash; <span className={decision ? 'marking-point-awarded' : 'marking-point-not-awarded'}>{decision ? 'Awarded' : 'Not awarded'}</span></>
    : `Marking Point ${pointNumber}`;

  return (
    <div className={`marking-point-row${decided ? ' decided' : ''}${isLocked ? ' locked' : ''}`}>
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
          <button
            className={`mark-tick${decision === true ? ' selected' : ''}`}
            onClick={() => onDecide(decision === true ? null : true)}
            disabled={isLocked}
            aria-label="Award"
          >&#10003;</button>
          <button
            className={`mark-cross${decision === false ? ' selected' : ''}`}
            onClick={() => onDecide(decision === false ? null : false)}
            disabled={isLocked}
            aria-label="Deny"
          >&#10007;</button>
        </div>
      </div>
      {isLocked && decision === false && <div className="marking-point-locked-note">Marking point not earned</div>}
    </div>
  );
}
