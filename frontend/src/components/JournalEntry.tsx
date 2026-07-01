import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Sparkles, Save, Loader2, RefreshCw } from 'lucide-react';
import { journalApi } from '../services/api';
import { JournalEntry as JournalEntryType } from '../types';
import { trackEvent } from '../utils/analytics';
import { getEntryDateKey, getLocalDateKey } from '../utils/dateKeys';

interface JournalEntryProps {
  entries?: JournalEntryType[];
  onEntrySaved: (entry: JournalEntryType) => void;
}

const buildEntryTimestamp = (dateKey: string) => {
  const [year, month, day] = dateKey.split('-').map(Number);
  const now = new Date();

  return new Date(
    year,
    month - 1,
    day,
    now.getHours(),
    now.getMinutes(),
    now.getSeconds(),
    now.getMilliseconds(),
  ).toISOString();
};

const JournalEntry: React.FC<JournalEntryProps> = ({ entries = [], onEntrySaved }) => {
  const [content, setContent] = useState('');
  const [selectedDate, setSelectedDate] = useState(getLocalDateKey());
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [showDateEditor, setShowDateEditor] = useState(false);
  const [loadedEntryId, setLoadedEntryId] = useState<number | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const todayDateKey = getLocalDateKey();
  const todayEntry = useMemo(
    () => entries.find((entry) => getEntryDateKey(entry) === todayDateKey),
    [entries, todayDateKey],
  );
  const isEditingToday = Boolean(todayEntry && selectedDate === todayDateKey);

  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.style.height = '0px';
    textarea.style.height = `${Math.max(textarea.scrollHeight, 260)}px`;
  }, [content]);

  useEffect(() => {
    if (!todayEntry || loadedEntryId === todayEntry.id || content.trim()) {
      return;
    }

    setContent(todayEntry.content);
    setSelectedDate(todayDateKey);
    setLoadedEntryId(todayEntry.id);
  }, [content, loadedEntryId, todayDateKey, todayEntry]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!content.trim()) {
      trackEvent('journal_entry_save_blocked', { reason: 'empty' });
      setMessage('Please write something before saving your entry.');
      return;
    }

    setIsLoading(true);
    setMessage('');

    try {
      trackEvent('journal_entry_save_attempted', {
        entry_action: isEditingToday ? 'update' : 'create',
        word_count: wordCount,
      });

      const entryPayload = {
        content: content.trim(),
        date: buildEntryTimestamp(selectedDate),
      };
      const entry =
        todayEntry && selectedDate === todayDateKey
          ? await journalApi.updateEntry(todayEntry.id, entryPayload)
          : await journalApi.createEntry(entryPayload);

      onEntrySaved(entry);
      trackEvent('journal_entry_saved', {
        entry_action: isEditingToday ? 'update' : 'create',
        word_count: wordCount,
      });
      setLoadedEntryId(entry.id);
      if (selectedDate !== todayDateKey) {
        setContent('');
      }
      setMessage(isEditingToday ? 'Entry updated successfully.' : 'Entry saved successfully.');

      // Clear success message after 3 seconds
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error('Error saving entry:', error);
      trackEvent('journal_entry_save_failed', {
        entry_action: isEditingToday ? 'update' : 'create',
      });
      setMessage('Error saving entry. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const getPromptPool = () => {
    const hour = new Date().getHours();
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

  const promptPool = useMemo(getPromptPool, []);
  const [promptIndex, setPromptIndex] = useState(() =>
    Math.floor(Math.random() * promptPool.length),
  );
  const todayPrompt = useMemo(() => {
    return promptPool[promptIndex % promptPool.length];
  }, [promptIndex, promptPool]);

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
  }).format(new Date(`${selectedDate}T00:00:00`));
  const saveButtonLabel = isEditingToday ? "Update today's entry" : "Save today's entry";

  return (
    <div className="journal-layout">
      <div className="panel-card journal-card">
        <div className="section-heading">
          <div className="section-heading-top">
            <div className="eyebrow conversion-chip journal-conversion-chip">
              <Sparkles className="h-4 w-4" />
              Daily reflection
            </div>
            <div className="field-date-display">
              <span className="field-date-label">Writing for</span>
              <span>{formattedEntryDate}</span>
              <button
                type="button"
                className="field-inline-link"
                onClick={() => {
                  trackEvent('journal_date_editor_toggled', { expanded: !showDateEditor });
                  setShowDateEditor((current) => !current);
                }}
              >
                {showDateEditor ? 'Hide' : 'Edit'}
              </button>
            </div>
          </div>
          <p className="journal-guidance">
            Start where you are, a few honest sentences are enough.
          </p>
          {isEditingToday ? (
            <p className="journal-editing-note">Continuing from earlier today.</p>
          ) : null}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {showDateEditor ? (
            <div className="field-shell">
              <input
                type="date"
                id="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="field-input"
                max={getLocalDateKey()}
              />
            </div>
          ) : null}

          <div className="field-shell journal-field-shell">
            <div className="journal-textarea-shell">
              <textarea
                ref={textareaRef}
                id="content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder={todayPrompt}
                className="field-textarea journal-textarea"
                rows={6}
                disabled={isLoading}
              />
              <button
                type="button"
                className="journal-prompt-refresh"
                onClick={() => {
                  trackEvent('journal_prompt_refreshed');
                  setPromptIndex((current) => current + 1);
                }}
                title="Refresh prompt"
                aria-label="Refresh prompt"
                disabled={isLoading}
              >
                <RefreshCw className="h-4 w-4" />
              </button>
              <span className="journal-textarea-count" aria-live="polite">
                {wordCount} word{wordCount === 1 ? '' : 's'}
              </span>
            </div>
            {journalNudge ? <div className="journal-nudge">{journalNudge}</div> : null}
          </div>

          {message && (
            <div
              className={`status-banner ${
                message.includes('Error') || message.includes('Please')
                  ? 'status-banner-error'
                  : 'status-banner-success'
              }`}
            >
              {message}
            </div>
          )}

          <button type="submit" disabled={isLoading || !content.trim()} className="primary-action">
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Analyzing and saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                {saveButtonLabel}
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default JournalEntry;
