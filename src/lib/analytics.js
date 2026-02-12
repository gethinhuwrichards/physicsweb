import { supabase } from './supabase';

// --- Anonymous ID management ---
function getAnonId() {
  try {
    let id = localStorage.getItem('anon_id');
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem('anon_id', id);
    }
    return id;
  } catch {
    return crypto.randomUUID();
  }
}

// --- Module state ---
let anonId = null;
let sessionId = null;
let eventQueue = [];
let flushTimer = null;
let heartbeatTimer = null;
let sessionStart = null;
let lastActivity = null;

const SESSION_GAP_MS = 30 * 60 * 1000; // 30 minutes
const FLUSH_INTERVAL_MS = 5000;
const HEARTBEAT_INTERVAL_MS = 60000;

// --- Helpers ---
function isEnabled() {
  return supabase !== null;
}

async function safeRpc(fn, params) {
  if (!isEnabled()) return;
  try {
    await supabase.rpc(fn, params);
  } catch {
    // Analytics must never break the quiz
  }
}

async function safeInsert(table, rows) {
  if (!isEnabled() || rows.length === 0) return;
  try {
    await supabase.from(table).insert(rows);
  } catch {
    // Silently swallow
  }
}

async function safeUpdate(table, data, match) {
  if (!isEnabled()) return;
  try {
    await supabase.from(table).update(data).match(match);
  } catch {
    // Silently swallow
  }
}

// --- Session management ---
async function startSession() {
  anonId = getAnonId();
  sessionStart = Date.now();
  lastActivity = Date.now();

  if (!isEnabled()) return;

  try {
    // Upsert visitor
    await safeRpc('upsert_anon_visitor', { p_anon_id: anonId });

    // Create session row
    const { data } = await supabase
      .from('anon_sessions')
      .insert({ anon_id: anonId })
      .select('id')
      .single();
    if (data) sessionId = data.id;
  } catch {
    // Continue without session tracking
  }
}

async function updateSessionDuration() {
  if (!sessionId || !sessionStart) return;
  const duration = Math.round((Date.now() - sessionStart) / 1000);
  await safeUpdate('anon_sessions', {
    ended_at: new Date().toISOString(),
    duration_seconds: duration,
  }, { id: sessionId });
}

// --- Event batching ---
function queueEvent(event) {
  eventQueue.push({
    ...event,
    anon_id: anonId,
    session_id: sessionId,
  });
  lastActivity = Date.now();
}

async function flushEvents() {
  if (eventQueue.length === 0) return;
  const batch = eventQueue.splice(0);

  // Separate counter increments
  let views = 0, answers = 0, skips = 0;
  for (const e of batch) {
    if (e.event_type === 'view') views++;
    else if (e.event_type === 'answer') answers++;
    else if (e.event_type === 'skip') skips++;
  }

  await safeInsert('anon_question_events', batch);

  if (sessionId && (views || answers || skips)) {
    await safeRpc('increment_session_counters', {
      p_session_id: sessionId,
      p_views: views,
      p_answers: answers,
      p_skips: skips,
    });
  }
}

function flushBeacon() {
  if (!isEnabled() || eventQueue.length === 0) return;
  try {
    const batch = eventQueue.splice(0);
    const url = `${supabase.supabaseUrl}/rest/v1/anon_question_events`;
    const body = JSON.stringify(batch);
    fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': supabase.supabaseKey,
        'Authorization': `Bearer ${supabase.supabaseKey}`,
        'Prefer': 'return=minimal',
      },
      body,
      keepalive: true,
    });
  } catch {
    // Best effort
  }
}

// --- Lifecycle ---
function onVisibilityChange() {
  if (document.hidden) {
    flushEvents();
    updateSessionDuration();
  } else {
    // Check for session gap
    if (lastActivity && (Date.now() - lastActivity > SESSION_GAP_MS)) {
      startSession();
    }
  }
}

function onBeforeUnload() {
  flushBeacon();
  // Update session duration with keepalive
  if (sessionId && sessionStart && isEnabled()) {
    try {
      const duration = Math.round((Date.now() - sessionStart) / 1000);
      const url = `${supabase.supabaseUrl}/rest/v1/anon_sessions?id=eq.${sessionId}`;
      fetch(url, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'apikey': supabase.supabaseKey,
          'Authorization': `Bearer ${supabase.supabaseKey}`,
          'Prefer': 'return=minimal',
        },
        body: JSON.stringify({
          ended_at: new Date().toISOString(),
          duration_seconds: duration,
        }),
        keepalive: true,
      });
    } catch {
      // Best effort
    }
  }
}

// --- Public API ---

export async function initAnalytics() {
  if (!isEnabled()) return;

  await startSession();

  // Flush events every 5s
  flushTimer = setInterval(flushEvents, FLUSH_INTERVAL_MS);

  // Heartbeat: update session duration every 60s
  heartbeatTimer = setInterval(updateSessionDuration, HEARTBEAT_INTERVAL_MS);

  document.addEventListener('visibilitychange', onVisibilityChange);
  window.addEventListener('beforeunload', onBeforeUnload);
}

export function trackQuestionView(questionId, subtopicId, mainTopicId, partsTotal) {
  if (!anonId) return;
  queueEvent({
    question_id: questionId,
    subtopic_id: subtopicId || null,
    main_topic_id: mainTopicId || null,
    event_type: 'view',
    parts_total: partsTotal || null,
  });
}

export function trackQuestionAnswer({ questionId, subtopicId, mainTopicId, score, maxScore, partsAnswered, partsTotal, partsBlank, timeSpentSeconds }) {
  if (!anonId) return;
  queueEvent({
    question_id: questionId,
    subtopic_id: subtopicId || null,
    main_topic_id: mainTopicId || null,
    event_type: 'answer',
    score: score ?? null,
    max_score: maxScore ?? null,
    parts_answered: partsAnswered ?? null,
    parts_total: partsTotal ?? null,
    parts_blank: partsBlank ?? null,
    time_spent_seconds: timeSpentSeconds ?? null,
  });
}

export function trackQuestionSkip(questionId, subtopicId, mainTopicId, partsTotal, timeSpentSeconds) {
  if (!anonId) return;
  queueEvent({
    question_id: questionId,
    subtopic_id: subtopicId || null,
    main_topic_id: mainTopicId || null,
    event_type: 'skip',
    parts_total: partsTotal || null,
    time_spent_seconds: timeSpentSeconds ?? null,
  });
}
