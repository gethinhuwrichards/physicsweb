import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

export default function ProfilePage({ onBack }) {
  const { profile, updateProfile, signOut } = useAuth();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [stats, setStats] = useState(null);

  // Editable fields
  const [displayName, setDisplayName] = useState(profile?.display_name || '');
  const [yearGroup, setYearGroup] = useState(profile?.year_group || '');
  const [examBoard, setExamBoard] = useState(profile?.exam_board || '');
  const [schoolName, setSchoolName] = useState(profile?.school_name || '');
  const [targetGrade, setTargetGrade] = useState(profile?.target_grade || '');

  // Load stats
  useEffect(() => {
    if (!profile) return;
    loadStats();
  }, [profile]);

  const loadStats = async () => {
    try {
      // Total questions attempted
      const { count: totalAttempts } = await supabase
        .from('question_attempts')
        .select('*', { count: 'exact', head: true });

      // Unique questions
      const { data: scores } = await supabase
        .from('user_scores')
        .select('score, max_score');

      const uniqueQuestions = scores?.length || 0;
      const totalScore = scores?.reduce((s, r) => s + r.score, 0) || 0;
      const totalMax = scores?.reduce((s, r) => s + r.max_score, 0) || 0;
      const avgPct = totalMax > 0 ? Math.round((totalScore / totalMax) * 100) : 0;

      // Time spent
      const { data: sessions } = await supabase
        .from('session_logs')
        .select('duration_seconds');

      const totalSeconds = sessions?.reduce((s, r) => s + (r.duration_seconds || 0), 0) || 0;
      const totalMinutes = Math.round(totalSeconds / 60);

      setStats({ totalAttempts: totalAttempts || 0, uniqueQuestions, avgPct, totalMinutes });
    } catch {
      // Stats are non-critical
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateProfile({
        display_name: displayName || null,
        year_group: yearGroup ? parseInt(yearGroup) : null,
        exam_board: examBoard || null,
        school_name: schoolName || null,
        target_grade: targetGrade || null,
      });
      setEditing(false);
    } catch (err) {
      alert('Failed to save: ' + (err.message || 'Unknown error'));
    } finally {
      setSaving(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    onBack();
  };

  if (!profile) return null;

  return (
    <section className="profile-page">
      <h2>Your Profile</h2>

      <div className="profile-card">
        <div className="profile-field">
          <span className="profile-label">Email</span>
          <span className="profile-value">{profile.email}</span>
        </div>

        {editing ? (
          <>
            <div className="profile-field">
              <label className="profile-label">Display Name</label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
              />
            </div>
            <div className="profile-field">
              <label className="profile-label">Year Group</label>
              <select value={yearGroup} onChange={(e) => setYearGroup(e.target.value)}>
                <option value="">Select...</option>
                {[7, 8, 9, 10, 11, 12, 13].map((y) => (
                  <option key={y} value={y}>Year {y}</option>
                ))}
              </select>
            </div>
            <div className="profile-field">
              <label className="profile-label">Exam Board</label>
              <select value={examBoard} onChange={(e) => setExamBoard(e.target.value)}>
                <option value="">Select...</option>
                {['AQA', 'Edexcel', 'OCR', 'WJEC', 'SQA', 'Other'].map((b) => (
                  <option key={b} value={b}>{b}</option>
                ))}
              </select>
            </div>
            <div className="profile-field">
              <label className="profile-label">School Name</label>
              <input
                type="text"
                value={schoolName}
                onChange={(e) => setSchoolName(e.target.value)}
              />
            </div>
            <div className="profile-field">
              <label className="profile-label">Target Grade</label>
              <input
                type="text"
                value={targetGrade}
                onChange={(e) => setTargetGrade(e.target.value)}
              />
            </div>
            <div className="profile-actions">
              <button className="profile-save-btn" onClick={handleSave} disabled={saving}>
                {saving ? 'Saving...' : 'Save'}
              </button>
              <button className="profile-cancel-btn" onClick={() => setEditing(false)}>
                Cancel
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="profile-field">
              <span className="profile-label">Display Name</span>
              <span className="profile-value">{profile.display_name || '–'}</span>
            </div>
            <div className="profile-field">
              <span className="profile-label">Year Group</span>
              <span className="profile-value">{profile.year_group ? `Year ${profile.year_group}` : '–'}</span>
            </div>
            <div className="profile-field">
              <span className="profile-label">Exam Board</span>
              <span className="profile-value">{profile.exam_board || '–'}</span>
            </div>
            <div className="profile-field">
              <span className="profile-label">School</span>
              <span className="profile-value">{profile.school_name || '–'}</span>
            </div>
            <div className="profile-field">
              <span className="profile-label">Target Grade</span>
              <span className="profile-value">{profile.target_grade || '–'}</span>
            </div>
            <div className="profile-field">
              <span className="profile-label">Account Tier</span>
              <span className="profile-value profile-tier">{profile.tier}</span>
            </div>
            <div className="profile-actions">
              <button className="profile-edit-btn" onClick={() => setEditing(true)}>
                Edit Profile
              </button>
            </div>
          </>
        )}
      </div>

      {stats && (
        <div className="profile-stats">
          <h3>Your Stats</h3>
          <div className="profile-stats-grid">
            <div className="profile-stat-card">
              <span className="profile-stat-number">{stats.uniqueQuestions}</span>
              <span className="profile-stat-label">Questions Completed</span>
            </div>
            <div className="profile-stat-card">
              <span className="profile-stat-number">{stats.totalAttempts}</span>
              <span className="profile-stat-label">Total Attempts</span>
            </div>
            <div className="profile-stat-card">
              <span className="profile-stat-number">{stats.avgPct}%</span>
              <span className="profile-stat-label">Average Score</span>
            </div>
            <div className="profile-stat-card">
              <span className="profile-stat-number">{stats.totalMinutes}</span>
              <span className="profile-stat-label">Minutes Practiced</span>
            </div>
          </div>
        </div>
      )}

      <div className="profile-actions profile-bottom-actions">
        <button className="profile-back-btn" onClick={onBack}>&larr; Back</button>
        <button className="profile-signout-btn" onClick={handleSignOut}>Sign Out</button>
      </div>
    </section>
  );
}
