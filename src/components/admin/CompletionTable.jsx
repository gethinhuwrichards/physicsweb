import React, { useState } from 'react';

export default function CompletionTable({ data }) {
  const [sortAsc, setSortAsc] = useState(true);

  if (!data || data.length === 0) {
    return <p className="admin-empty">No question data recorded yet.</p>;
  }

  const sorted = [...data].sort((a, b) =>
    sortAsc ? a.completion_pct - b.completion_pct : b.completion_pct - a.completion_pct
  );

  return (
    <div className="admin-table-wrapper">
      <table className="admin-table">
        <thead>
          <tr>
            <th>Question ID</th>
            <th>Views</th>
            <th>Answers</th>
            <th>Skips</th>
            <th
              className="admin-sortable"
              onClick={() => setSortAsc((v) => !v)}
            >
              Completion % {sortAsc ? '\u25B2' : '\u25BC'}
            </th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((row) => (
            <tr key={row.question_id}>
              <td className="admin-cell-mono">{row.question_id}</td>
              <td>{row.views}</td>
              <td>{row.answers}</td>
              <td>{row.skips}</td>
              <td>{row.completion_pct}%</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
