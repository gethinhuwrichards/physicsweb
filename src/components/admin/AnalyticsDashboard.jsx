import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../lib/supabase';
import SummaryCards from './SummaryCards';
import DailyChart from './DailyChart';
import SkippedTable from './SkippedTable';
import CompletionTable from './CompletionTable';

const RANGE_OPTIONS = [
  { label: '7 days', value: 7 },
  { label: '14 days', value: 14 },
  { label: '30 days', value: 30 },
  { label: '90 days', value: 90 },
];

export default function AnalyticsDashboard() {
  const [summary, setSummary] = useState(null);
  const [daily, setDaily] = useState([]);
  const [skipped, setSkipped] = useState([]);
  const [completion, setCompletion] = useState([]);
  const [daysBack, setDaysBack] = useState(30);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async (days) => {
    if (!supabase) {
      setError('Supabase not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const [summaryRes, dailyRes, skippedRes, completionRes] = await Promise.all([
        supabase.rpc('analytics_summary'),
        supabase.rpc('analytics_daily', { days_back: days }),
        supabase.rpc('analytics_most_skipped', { lim: 20 }),
        supabase.rpc('analytics_question_completion'),
      ]);

      if (summaryRes.error) throw summaryRes.error;
      if (dailyRes.error) throw dailyRes.error;
      if (skippedRes.error) throw skippedRes.error;
      if (completionRes.error) throw completionRes.error;

      setSummary(summaryRes.data);
      setDaily(dailyRes.data || []);
      setSkipped(skippedRes.data || []);
      setCompletion(completionRes.data || []);
    } catch (err) {
      console.error('Analytics fetch error:', err);
      setError(err.message || 'Failed to load analytics data.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData(daysBack);
  }, [daysBack, fetchData]);

  const handleRangeChange = (days) => {
    setDaysBack(days);
  };

  if (error) {
    return (
      <div className="admin-dashboard">
        <h1 className="admin-title">Analytics Dashboard</h1>
        <div className="admin-error">{error}</div>
      </div>
    );
  }

  return (
    <div className="admin-dashboard">
      <h1 className="admin-title">Analytics Dashboard</h1>

      {loading ? (
        <div className="admin-loading">Loading analytics...</div>
      ) : (
        <>
          <section className="admin-section">
            <h2>Overview</h2>
            <SummaryCards data={summary} />
          </section>

          <section className="admin-section">
            <div className="admin-section-header">
              <h2>Daily Trends</h2>
              <div className="admin-range-picker">
                {RANGE_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    className={`admin-range-btn${daysBack === opt.value ? ' active' : ''}`}
                    onClick={() => handleRangeChange(opt.value)}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
            <DailyChart data={daily} />
          </section>

          <section className="admin-section">
            <h2>Most Skipped Questions</h2>
            <SkippedTable data={skipped} />
          </section>

          <section className="admin-section">
            <h2>Question Completion Rates</h2>
            <CompletionTable data={completion} />
          </section>
        </>
      )}
    </div>
  );
}
