import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Calendar, Save, Loader2 } from 'lucide-react';
import { journalApi } from '../services/api';
import { JournalEntry as JournalEntryType } from '../types';

interface JournalEntryProps {
  onEntrySaved: (entry: JournalEntryType) => void;
}

const JournalEntry: React.FC<JournalEntryProps> = ({ onEntrySaved }) => {
  const getLocalDateKey = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = `${now.getMonth() + 1}`.padStart(2, '0');
    const day = `${now.getDate()}`.padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const [content, setContent] = useState('');
  const [selectedDate, setSelectedDate] = useState(getLocalDateKey());
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [showDateEditor, setShowDateEditor] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.style.height = '0px';
    textarea.style.height = `${Math.max(textarea.scrollHeight, 260)}px`;
  }, [content]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!content.trim()) {
      setMessage('Please write something before saving your entry.');
      return;
    }

    setIsLoading(true);
    setMessage('');

    try {
      // Convert selectedDate (YYYY-MM-DD) to ISO datetime string to satisfy FastAPI datetime
      const entry = await journalApi.createEntry({
        content: content.trim(),
        date: new Date(selectedDate + 'T00:00:00').toISOString(),
      });

      onEntrySaved(entry);
      setContent('');
      setMessage('Entry saved successfully.');

      // Clear success message after 3 seconds
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error('Error saving entry:', error);
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
  const todayPrompt = useMemo(() => {
    const daySeed = new Date().getDate() + new Date().getMonth() * 31 + new Date().getHours();
    return promptPool[daySeed % promptPool.length];
  }, [promptPool]);

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

          <div className="field-shell">
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
            {content.trim() ? (
              <div className="journal-toolbar journal-toolbar-soft">
                <span>{content.length} characters</span>
                <span>{wordCount} words</span>
              </div>
            ) : null}
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
