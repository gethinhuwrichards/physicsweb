import React, { useMemo } from 'react';
import { renderLatex } from '../../utils/renderLatex';
import { renderMarkdownBold } from '../../utils/renderMarkdownBold';

export default function MarkingPointRow({ point, decision, onDecide, locked }) {
  const renderedText = useMemo(
    () => renderLatex(renderMarkdownBold(point.text)),
    [point.text]
  );

  const isLocked = locked === true;
  const decided = decision !== null && decision !== undefined;

  return (
    <div className={`marking-point-row${decided ? ' decided' : ''}${isLocked ? ' locked' : ''}`}>
      <div className="marking-point-label">Award this marking point?</div>
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
            onClick={() => onDecide(true)}
            disabled={isLocked}
            aria-label="Award"
          >&#10003;</button>
          <button
            className={`mark-cross${decision === false ? ' selected' : ''}`}
            onClick={() => onDecide(false)}
            disabled={isLocked}
            aria-label="Deny"
          >&#10007;</button>
        </div>
      </div>
      {isLocked && <div className="marking-point-locked-note">Final answer incorrect</div>}
    </div>
  );
}
