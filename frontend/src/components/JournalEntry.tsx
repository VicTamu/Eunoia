import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Calendar, Loader2, Save, Sparkles } from 'lucide-react';
import { journalApi } from '../services/api';
import { JournalEntry as JournalEntryType } from '../types';
import { useAuth } from '../contexts/AuthContext';

interface JournalEntryProps {
  entries: JournalEntryType[];
  onEntrySaved: (entry: JournalEntryType) => void;
}

type EntryStatusTone = 'success' | 'error' | 'note';

interface EntryStatus {
  tone: EntryStatusTone;
  message: string;
}

interface DraftSnapshot {
  content: string;
  updatedAt: number;
}

type ReflectionMatch = {
  label: string;
  entry: JournalEntryType;
};

const getLocalDateKey = (value = new Date()) => {
  const year = value.getFullYear();
  const month = `${value.getMonth() + 1}`.padStart(2, '0');
  const day = `${value.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const parseLocalDate = (dateKey: string) => {
  const [year, month, day] = dateKey.split('-').map(Number);
  return new Date(year, month - 1, day);
};

const getPromptPool = (hour: number) => {
  if (hour < 12) {
    return [
      'What does your body need from you this morning?',
      'What are you carrying into today that needs gentleness?',
      'What feels hopeful, even if only a little?',
      'What would make today feel steady instead of rushed?',
      'What part of you needs a softer beginning today?',
    ];
  }

  if (hour < 18) {
    return [
      'What has stayed with you so far today?',
      'Where have you felt stretched, and where have you felt steady?',
      'What is asking for a little more gentleness this afternoon?',
      'What is your mind circling back to this afternoon?',
      'What deserves a pause before the day keeps moving?',
    ];
  }

  return [
    'What felt most alive today?',
    'What is something your body is telling you right now?',
    'What felt heavy today, and what helped you carry it?',
    'What are you grateful for, even if the day felt complicated?',
    'What do you want tomorrow to protect a little better?',
  ];
};

const JournalEntry: React.FC<JournalEntryProps> = ({ entries, onEntrySaved }) => {
  const { user } = useAuth();
  const [currentMoment, setCurrentMoment] = useState(() => new Date());
  const currentLocalDateKey = getLocalDateKey(currentMoment);

  const [content, setContent] = useState('');
  const [selectedDate, setSelectedDate] = useState(currentLocalDateKey);
  const [isUsingAutoDate, setIsUsingAutoDate] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<EntryStatus | null>(null);
  const [showDateEditor, setShowDateEditor] = useState(false);
  const [draftRestoredAt, setDraftRestoredAt] = useState<number | null>(null);
  const [draftSavedAt, setDraftSavedAt] = useState<number | null>(null);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const statusTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const draftIndicatorTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const activeDraftKey = useMemo(
    () => `eunoia-journal-draft:${user?.id ?? 'guest'}:${selectedDate}`,
    [selectedDate, user?.id],
  );

  const formatSavedMoment = (timestamp: number | null) => {
    if (!timestamp) {
      return null;
    }

    return new Intl.DateTimeFormat('en-US', {
      hour: 'numeric',
      minute: '2-digit',
    }).format(new Date(timestamp));
  };

  const getEntryDateKey = useCallback(
    (entry: JournalEntryType) => {
      const rawDate = entry.date || entry.created_at || entry.updated_at;
      if (!rawDate) {
        return currentLocalDateKey;
      }

      const parsed = new Date(rawDate);
      if (Number.isNaN(parsed.getTime())) {
        return rawDate.split('T')[0];
      }

      return getLocalDateKey(parsed);
    },
    [currentLocalDateKey],
  );

  const sortedEntryDays = useMemo(
    () =>
      Array.from(new Set(entries.map(getEntryDateKey)))
        .sort()
        .reverse(),
    [entries, getEntryDateKey],
  );

  const streakLength = useMemo(() => {
    if (sortedEntryDays.length === 0) {
      return 0;
    }

    let streak = 1;
    let cursor = parseLocalDate(sortedEntryDays[0]);

    for (let index = 1; index < sortedEntryDays.length; index += 1) {
      const previousDay = new Date(cursor);
      previousDay.setDate(cursor.getDate() - 1);

      if (getLocalDateKey(previousDay) !== sortedEntryDays[index]) {
        break;
      }

      streak += 1;
      cursor = previousDay;
    }

    return streak;
  }, [sortedEntryDays]);

  const hasActiveStreak =
    streakLength >= 2 && sortedEntryDays.length > 0 && sortedEntryDays[0] === currentLocalDateKey;

  const onThisDayReflection = useMemo<ReflectionMatch | null>(() => {
    if (!entries.length) {
      return null;
    }

    const baseDate = parseLocalDate(selectedDate);
    const oneWeekAgo = new Date(baseDate);
    oneWeekAgo.setDate(baseDate.getDate() - 7);

    const oneMonthAgo = new Date(baseDate);
    oneMonthAgo.setMonth(baseDate.getMonth() - 1);

    const oneYearAgo = new Date(baseDate);
    oneYearAgo.setFullYear(baseDate.getFullYear() - 1);

    const comparisons: Array<{ label: string; dateKey: string }> = [
      { label: 'A year ago today', dateKey: getLocalDateKey(oneYearAgo) },
      { label: 'A month ago today', dateKey: getLocalDateKey(oneMonthAgo) },
      { label: 'A week ago today', dateKey: getLocalDateKey(oneWeekAgo) },
    ];

    for (const comparison of comparisons) {
      const match = entries.find((entry) => getEntryDateKey(entry) === comparison.dateKey);
      if (match) {
        return { label: comparison.label, entry: match };
      }
    }

    return null;
  }, [entries, getEntryDateKey, selectedDate]);

  useEffect(
    () => () => {
      if (statusTimeoutRef.current) {
        clearTimeout(statusTimeoutRef.current);
      }

      if (draftIndicatorTimeoutRef.current) {
        clearTimeout(draftIndicatorTimeoutRef.current);
      }
    },
    [],
  );

  useEffect(() => {
    const interval = window.setInterval(() => {
      setCurrentMoment(new Date());
    }, 60000);

    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    if (isUsingAutoDate && !content.trim()) {
      setSelectedDate(currentLocalDateKey);
    }
  }, [content, currentLocalDateKey, isUsingAutoDate]);

  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) {
      return;
    }

    textarea.style.height = '0px';
    textarea.style.height = `${Math.max(textarea.scrollHeight, 260)}px`;
  }, [content]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    try {
      const rawDraft = window.localStorage.getItem(activeDraftKey);

      if (!rawDraft) {
        setDraftRestoredAt(null);
        setDraftSavedAt(null);
        return;
      }

      const parsedDraft = JSON.parse(rawDraft) as DraftSnapshot;
      const restoredContent = typeof parsedDraft.content === 'string' ? parsedDraft.content : '';
      const restoredTimestamp =
        typeof parsedDraft.updatedAt === 'number' ? parsedDraft.updatedAt : Date.now();

      setContent(restoredContent);

      if (restoredContent.trim()) {
        setDraftRestoredAt(restoredTimestamp);
        setDraftSavedAt(restoredTimestamp);
        setStatus({
          tone: 'note',
          message: 'Your saved draft is back here for you.',
        });
      } else {
        setDraftRestoredAt(null);
        setDraftSavedAt(null);
      }
    } catch (error) {
      console.error('Error restoring saved draft:', error);
      setContent('');
      setDraftRestoredAt(null);
      setDraftSavedAt(null);
    }
  }, [activeDraftKey]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    try {
      if (!content.trim()) {
        window.localStorage.removeItem(activeDraftKey);
        setDraftSavedAt(null);
        return;
      }

      const snapshot: DraftSnapshot = {
        content,
        updatedAt: Date.now(),
      };

      window.localStorage.setItem(activeDraftKey, JSON.stringify(snapshot));

      if (draftIndicatorTimeoutRef.current) {
        clearTimeout(draftIndicatorTimeoutRef.current);
      }

      draftIndicatorTimeoutRef.current = setTimeout(() => {
        setDraftSavedAt(snapshot.updatedAt);
      }, 700);
    } catch (error) {
      console.error('Error saving draft locally:', error);
    }
  }, [activeDraftKey, content]);

  const handleSubmit = async (event?: React.FormEvent) => {
    event?.preventDefault();

    if (!content.trim()) {
      setStatus({
        tone: 'note',
        message: 'Start with a few honest words before saving.',
      });
      return;
    }

    setIsLoading(true);
    setStatus(null);

    try {
      const entry = await journalApi.createEntry({
        content: content.trim(),
        date: new Date(`${selectedDate}T00:00:00`).toISOString(),
      });

      onEntrySaved(entry);
      setContent('');
      setSelectedDate(currentLocalDateKey);
      setIsUsingAutoDate(true);
      setDraftSavedAt(null);
      setDraftRestoredAt(null);
      window.localStorage.removeItem(activeDraftKey);
      setStatus({
        tone: 'success',
        message: 'Saved. Your words are here when you want to return.',
      });

      if (statusTimeoutRef.current) {
        clearTimeout(statusTimeoutRef.current);
      }

      statusTimeoutRef.current = setTimeout(() => setStatus(null), 3200);
    } catch (error) {
      console.error('Error saving entry:', error);
      setStatus({
        tone: 'error',
        message: "That didn't save - your words are still here. Try again in a moment.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const promptPool = useMemo(() => getPromptPool(currentMoment.getHours()), [currentMoment]);
  const todayPrompt = useMemo(() => {
    const daySeed =
      currentMoment.getDate() + currentMoment.getMonth() * 31 + currentMoment.getHours();
    return promptPool[daySeed % promptPool.length];
  }, [currentMoment, promptPool]);

  const wordCount = content.split(/\s+/).filter((word) => word.length > 0).length;
  const journalNudge =
    wordCount >= 200
      ? 'That is a lot to carry. Well done for writing it down.'
      : wordCount >= 50
        ? 'Keep going... there may be more here than you thought.'
        : '';

  const formattedEntryDate = new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }).format(parseLocalDate(selectedDate));

  const restoredTime = formatSavedMoment(draftRestoredAt);
  const savedTime = formatSavedMoment(draftSavedAt);
  const isFirstEntry = entries.length === 0;
  const reflectionPreview = onThisDayReflection?.entry.content.trim();
  const reflectionSnippet =
    reflectionPreview && reflectionPreview.length > 180
      ? `${reflectionPreview.slice(0, 180).trim()}...`
      : reflectionPreview;

  return (
    <div className="journal-layout">
      <div className="panel-card journal-card">
        <div className="section-heading">
          <div className="section-heading-top">
            <div className="eyebrow">
              <Calendar className="h-4 w-4" />
              Daily reflection
            </div>
            <div className="field-date-display">
              <span className="field-date-label">Writing for</span>
              <span>{formattedEntryDate}</span>
              <button
                type="button"
                className="field-inline-link"
                onClick={() => setShowDateEditor((current) => !current)}
              >
                {showDateEditor ? 'Hide' : 'Edit'}
              </button>
            </div>
          </div>
          <p className="journal-guidance">
            Start where you are, a few honest sentences are enough.
          </p>
        </div>

        {isFirstEntry ? (
          <div className="journal-context-card">
            <div className="eyebrow journal-context-eyebrow">
              <Sparkles className="h-4 w-4" />
              First steps
            </div>
            <h3 className="journal-context-title">This is your space.</h3>
            <p className="journal-context-copy">
              Write whenever, however much. Eunoia notices patterns so you do not have to force
              meaning out of every day all at once.
            </p>
          </div>
        ) : null}

        {!isFirstEntry && hasActiveStreak ? (
          <div className="journal-context-card journal-context-card-soft">
            <div className="eyebrow journal-context-eyebrow">
              <Calendar className="h-4 w-4" />
              Gentle rhythm
            </div>
            <h3 className="journal-context-title">
              You&apos;ve written {streakLength} days in a row.
            </h3>
            <p className="journal-context-copy">
              That steady rhythm makes your patterns easier to notice without turning journaling
              into pressure.
            </p>
          </div>
        ) : null}

        {!isFirstEntry && onThisDayReflection && reflectionSnippet ? (
          <div className="journal-context-card journal-context-card-memory">
            <div className="eyebrow journal-context-eyebrow">
              <Calendar className="h-4 w-4" />
              {onThisDayReflection.label}
            </div>
            <p className="journal-memory-quote">&ldquo;{reflectionSnippet}&rdquo;</p>
          </div>
        ) : null}

        <form
          onSubmit={(event) => {
            void handleSubmit(event);
          }}
          className="space-y-4"
        >
          {showDateEditor ? (
            <div className="field-shell">
              <input
                type="date"
                id="date"
                value={selectedDate}
                onChange={(event) => {
                  const nextDate = event.target.value;
                  setSelectedDate(nextDate);
                  setIsUsingAutoDate(nextDate === currentLocalDateKey);
                }}
                className="field-input"
                max={currentLocalDateKey}
              />
            </div>
          ) : null}

          <div className="field-shell">
            <textarea
              ref={textareaRef}
              id="content"
              value={content}
              onChange={(event) => {
                setContent(event.target.value);
                if (draftRestoredAt) {
                  setDraftRestoredAt(null);
                }
                if (status?.tone === 'note') {
                  setStatus(null);
                }
              }}
              onKeyDown={(event) => {
                if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') {
                  event.preventDefault();
                  void handleSubmit();
                }
              }}
              placeholder={todayPrompt}
              className="field-textarea journal-textarea"
              rows={6}
              disabled={isLoading}
            />
            {content.trim() ? (
              <div className="journal-toolbar journal-toolbar-soft">
                <span>{content.length} characters</span>
                <span>{wordCount} words</span>
                <span>Press Cmd/Ctrl+Enter to save</span>
              </div>
            ) : (
              <div className="journal-toolbar journal-toolbar-soft">
                <span>Press Cmd/Ctrl+Enter to save</span>
              </div>
            )}
            {restoredTime || savedTime ? (
              <div className="journal-draft-note" aria-live="polite">
                {restoredTime
                  ? `Draft restored from ${restoredTime}.`
                  : `Draft saved locally at ${savedTime}.`}
              </div>
            ) : null}
            {journalNudge ? <div className="journal-nudge">{journalNudge}</div> : null}
          </div>

          {status ? (
            <div
              className={`status-banner ${
                status.tone === 'success'
                  ? 'status-banner-success'
                  : status.tone === 'error'
                    ? 'status-banner-error'
                    : 'status-banner-note'
              }`}
            >
              {status.message}
            </div>
          ) : null}

          <button type="submit" disabled={isLoading || !content.trim()} className="primary-action">
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Analyzing and saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                Save today&apos;s entry
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default JournalEntry;
