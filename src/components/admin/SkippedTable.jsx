import React from 'react';

export default function SkippedTable({ data }) {
  if (!data || data.length === 0) {
    return <p className="admin-empty">No skipped questions recorded yet.</p>;
  }

  return (
    <div className="admin-table-wrapper">
      <table className="admin-table">
        <thead>
          <tr>
            <th>Question ID</th>
            <th>Subtopic</th>
            <th>Skips</th>
            <th>Views</th>
            <th>Skip Rate</th>
          </tr>
        </thead>
        <tbody>
          {data.map((row) => (
            <tr key={row.question_id}>
              <td className="admin-cell-mono">{row.question_id}</td>
              <td>{row.subtopic_id || '—'}</td>
              <td>{row.skips}</td>
              <td>{row.views}</td>
              <td>{row.skip_rate}%</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
