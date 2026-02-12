import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

export default function DailyChart({ data }) {
  if (!data || data.length === 0) {
    return <p className="admin-empty">No daily data yet.</p>;
  }

  const formatted = data.map((row) => ({
    ...row,
    day: new Date(row.day).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }),
  }));

  return (
    <div className="admin-chart-wrapper">
      <ResponsiveContainer width="100%" height={320}>
        <LineChart data={formatted} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--edge-light)" />
          <XAxis dataKey="day" tick={{ fontSize: 12, fill: 'var(--text-secondary)' }} />
          <YAxis tick={{ fontSize: 12, fill: 'var(--text-secondary)' }} />
          <Tooltip
            contentStyle={{
              background: 'var(--bg-surface)',
              border: '1.5px solid var(--edge)',
              borderRadius: 'var(--press-radius-sm)',
              boxShadow: 'var(--press-shadow-sm)',
            }}
            labelStyle={{ color: 'var(--text-primary)', fontWeight: 600 }}
          />
          <Legend />
          <Line type="monotone" dataKey="unique_users" name="Users" stroke="var(--accent-blue)" strokeWidth={2} dot={false} />
          <Line type="monotone" dataKey="total_sessions" name="Sessions" stroke="var(--color-correct)" strokeWidth={2} dot={false} />
          <Line type="monotone" dataKey="total_answers" name="Answers" stroke="#8b5cf6" strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
