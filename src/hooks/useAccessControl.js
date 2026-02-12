import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

const DEFAULT_FREE_LIMIT = 3;

// Cache content_access rules to avoid repeated fetches
let accessCache = null;
let cachePromise = null;

async function fetchAccessRules() {
  if (accessCache) return accessCache;
  if (cachePromise) return cachePromise;
  if (!supabase) { accessCache = {}; return accessCache; }

  cachePromise = supabase
    .from('content_access')
    .select('subtopic_id, free_question_limit, tier_required')
    .then(({ data, error }) => {
      if (error || !data) {
        accessCache = {};
      } else {
        accessCache = {};
        data.forEach((row) => {
          accessCache[row.subtopic_id] = {
            freeLimit: row.free_question_limit,
            tierRequired: row.tier_required,
          };
        });
      }
      return accessCache;
    })
    .catch(() => {
      accessCache = {};
      return accessCache;
    });

  return cachePromise;
}

/**
 * Returns { isLocked, reason } for a given question index within a subtopic.
 * Questions are sorted by difficulty (easy → hard), and the first N are free.
 */
export function useAccessControl(subtopicId, questionIndex, user, profile) {
  const [rules, setRules] = useState(accessCache);

  useEffect(() => {
    fetchAccessRules().then(setRules);
  }, []);

  if (!rules) {
    // Still loading rules - default to unlocked to avoid flash of locks
    return { isLocked: false, reason: null };
  }

  // Any logged-in user gets full access
  if (user) {
    return { isLocked: false, reason: null };
  }

  const subtopicRules = rules[subtopicId];
  const freeLimit = subtopicRules?.freeLimit ?? DEFAULT_FREE_LIMIT;

  if (questionIndex < freeLimit) {
    return { isLocked: false, reason: null };
  }

  return {
    isLocked: true,
    reason: 'Sign in to unlock more questions',
  };
}
