import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { useAuth } from './AuthContext';
import { supabase } from '../lib/supabase';
import {
  getQuestionScores as getLocalScores,
  saveQuestionScore as saveLocalScore,
  clearQuestionScore as clearLocalScore,
  clearQuestionAnswers as clearLocalAnswers,
  saveQuestionAnswers as saveLocalAnswers,
  loadQuestionAnswers as loadLocalAnswers,
  setCookie,
  clearScoresForSubtopic as clearLocalSubtopic,
  clearAllScoresAndAnswers as clearLocalAll,
} from '../utils/storage';

const ProgressContext = createContext(null);

export function useProgress() {
  const ctx = useContext(ProgressContext);
  if (!ctx) throw new Error('useProgress must be used within ProgressProvider');
  return ctx;
}

export function ProgressProvider({ children }) {
  const { user, profile } = useAuth();
  const [scores, setScores] = useState(getLocalScores);
  const [migrated, setMigrated] = useState(false);
  const [migrationMessage, setMigrationMessage] = useState('');
  const migrationDone = useRef(false);

  // Load scores from Supabase when user logs in
  useEffect(() => {
    if (user && supabase) {
      loadCloudScores();
    } else {
      // When logged out or no Supabase, use local scores
      setScores(getLocalScores());
    }
  }, [user]);

  // One-time migration: local scores -> Supabase on first login
  useEffect(() => {
    if (!user || !supabase || migrationDone.current) return;
    migrationDone.current = true;
    migrateLocalToCloud();
  }, [user]);

  // Clear migration message after 4 seconds
  useEffect(() => {
    if (!migrationMessage) return;
    const t = setTimeout(() => setMigrationMessage(''), 4000);
    return () => clearTimeout(t);
  }, [migrationMessage]);

  const loadCloudScores = async () => {
    if (!supabase) return;
    try {
      const { data, error } = await supabase
        .from('user_scores')
        .select('question_id, subtopic_id, score, max_score, attempts');
      if (error) throw error;
      const cloudScores = {};
      (data || []).forEach((row) => {
        cloudScores[row.question_id] = {
          score: row.score,
          max: row.max_score,
          subtopic: row.subtopic_id,
          attempts: row.attempts,
        };
      });
      setScores(cloudScores);
    } catch {
      // Fallback to local
      setScores(getLocalScores());
    }
  };

  const migrateLocalToCloud = async () => {
    if (!supabase) return;
    const localScores = getLocalScores();
    const localKeys = Object.keys(localScores);
    if (localKeys.length === 0) return;

    let migratedCount = 0;
    try {
      for (const questionId of localKeys) {
        const s = localScores[questionId];
        await supabase.from('user_scores').upsert({
          user_id: user.id,
          question_id: questionId,
          subtopic_id: s.subtopic || '',
          score: s.score,
          max_score: s.max,
          attempts: 1,
          last_attempt_at: new Date().toISOString(),
        }, { onConflict: 'user_id,question_id' });
        migratedCount++;
      }

      // Migrate saved answers
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('answers_')) {
          const questionId = key.replace('answers_', '');
          const state = loadLocalAnswers(questionId);
          if (state) {
            await supabase.from('saved_answers').upsert({
              user_id: user.id,
              question_id: questionId,
              state,
              updated_at: new Date().toISOString(),
            }, { onConflict: 'user_id,question_id' });
          }
        }
      }

      if (migratedCount > 0) {
        setMigrationMessage(`Progress synced to your account (${migratedCount} question${migratedCount > 1 ? 's' : ''})`);
        // Clear local data after successful migration
        clearLocalAll();
      }

      // Reload from cloud
      await loadCloudScores();
    } catch {
      // Migration is best-effort
    }
  };

  // ---- Public API (same interface as old storage.js) ----

  const refreshScores = useCallback(async () => {
    if (user && supabase) {
      await loadCloudScores();
    } else {
      setScores(getLocalScores());
    }
  }, [user]);

  const saveQuestionScore = useCallback(async (questionId, score, maxScore, subtopicId) => {
    // Always write to local (write-through cache)
    saveLocalScore(questionId, score, maxScore, subtopicId);

    if (user && supabase) {
      try {
        // Check existing to increment attempts
        const { data: existing } = await supabase
          .from('user_scores')
          .select('attempts')
          .eq('user_id', user.id)
          .eq('question_id', questionId)
          .single();

        await supabase.from('user_scores').upsert({
          user_id: user.id,
          question_id: questionId,
          subtopic_id: subtopicId,
          score,
          max_score: maxScore,
          attempts: (existing?.attempts || 0) + 1,
          last_attempt_at: new Date().toISOString(),
        }, { onConflict: 'user_id,question_id' });

        await loadCloudScores();
      } catch {
        // Local write succeeded, cloud failed silently
        setScores(getLocalScores());
      }
    } else {
      setScores(getLocalScores());
    }
  }, [user]);

  const clearQuestionScore = useCallback(async (questionId) => {
    clearLocalScore(questionId);

    if (user && supabase) {
      try {
        await supabase
          .from('user_scores')
          .delete()
          .eq('user_id', user.id)
          .eq('question_id', questionId);
        await loadCloudScores();
      } catch {
        setScores(getLocalScores());
      }
    } else {
      setScores(getLocalScores());
    }
  }, [user]);

  const saveQuestionAnswers = useCallback(async (questionId, stateToSave) => {
    saveLocalAnswers(questionId, stateToSave);

    if (user && supabase) {
      try {
        await supabase.from('saved_answers').upsert({
          user_id: user.id,
          question_id: questionId,
          state: stateToSave,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'user_id,question_id' });
      } catch {
        // Local write succeeded
      }
    }
  }, [user]);

  const loadQuestionAnswers = useCallback(async (questionId) => {
    if (user && supabase) {
      try {
        const { data, error } = await supabase
          .from('saved_answers')
          .select('state')
          .eq('user_id', user.id)
          .eq('question_id', questionId)
          .single();
        if (!error && data) return data.state;
      } catch {
        // Fall through to local
      }
    }
    return loadLocalAnswers(questionId);
  }, [user]);

  const clearQuestionAnswers = useCallback(async (questionId) => {
    clearLocalAnswers(questionId);

    if (user && supabase) {
      try {
        await supabase
          .from('saved_answers')
          .delete()
          .eq('user_id', user.id)
          .eq('question_id', questionId);
      } catch {
        // Local clear succeeded
      }
    }
  }, [user]);

  const clearScoresForSubtopic = useCallback(async (subtopicId) => {
    clearLocalSubtopic(subtopicId);

    if (user && supabase) {
      try {
        await supabase
          .from('user_scores')
          .delete()
          .eq('user_id', user.id)
          .eq('subtopic_id', subtopicId);

        // Also clear saved answers for questions in this subtopic
        const { data: scoreRows } = await supabase
          .from('user_scores')
          .select('question_id')
          .eq('user_id', user.id)
          .eq('subtopic_id', subtopicId);

        if (scoreRows) {
          for (const row of scoreRows) {
            await supabase
              .from('saved_answers')
              .delete()
              .eq('user_id', user.id)
              .eq('question_id', row.question_id);
          }
        }

        await loadCloudScores();
      } catch {
        setScores(getLocalScores());
      }
    } else {
      setScores(getLocalScores());
    }
  }, [user]);

  const clearAllScoresAndAnswers = useCallback(async () => {
    clearLocalAll();

    if (user && supabase) {
      try {
        await supabase.from('user_scores').delete().eq('user_id', user.id);
        await supabase.from('saved_answers').delete().eq('user_id', user.id);
        await loadCloudScores();
      } catch {
        setScores(getLocalScores());
      }
    } else {
      setScores(getLocalScores());
    }
  }, [user]);

  // Record an attempt (analytics)
  const recordAttempt = useCallback(async ({
    questionId, subtopicId, mainTopicId, score, maxScore,
    difficulty, timeSpentSeconds, partScores,
  }) => {
    if (!user || !supabase) return;

    try {
      // Count existing attempts
      const { count } = await supabase
        .from('question_attempts')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('question_id', questionId);

      await supabase.from('question_attempts').insert({
        user_id: user.id,
        question_id: questionId,
        subtopic_id: subtopicId,
        main_topic_id: mainTopicId,
        score,
        max_score: maxScore,
        difficulty,
        time_spent_seconds: timeSpentSeconds,
        attempt_number: (count || 0) + 1,
        part_scores: partScores,
      });
    } catch {
      // Analytics are non-critical
    }
  }, [user]);

  const value = {
    scores,
    refreshScores,
    saveQuestionScore,
    clearQuestionScore,
    saveQuestionAnswers,
    loadQuestionAnswers,
    clearQuestionAnswers,
    clearScoresForSubtopic,
    clearAllScoresAndAnswers,
    recordAttempt,
    migrationMessage,
  };

  return (
    <ProgressContext.Provider value={value}>
      {children}
    </ProgressContext.Provider>
  );
}
