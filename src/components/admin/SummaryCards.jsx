import React from 'react';

function formatDuration(seconds) {
  if (!seconds || seconds === 0) return '0s';
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  if (m === 0) return `${s}s`;
  return `${m}m ${s}s`;
}

const cards = [
  { key: 'unique_users', label: 'Unique Users', format: (v) => v.toLocaleString() },
  { key: 'total_visits', label: 'Total Visits', format: (v) => v.toLocaleString() },
  { key: 'avg_session_duration', label: 'Avg Session', format: (v) => formatDuration(Number(v)) },
  { key: 'avg_questions_per_session', label: 'Avg Questions / Session', format: (v) => v },
];

export default function SummaryCards({ data }) {
  if (!data) return null;

  return (
    <div className="admin-summary-grid">
      {cards.map((c) => (
        <div key={c.key} className="admin-stat-card">
          <div className="admin-stat-value">{c.format(data[c.key] ?? 0)}</div>
          <div className="admin-stat-label">{c.label}</div>
        </div>
      ))}
    </div>
  );
}
