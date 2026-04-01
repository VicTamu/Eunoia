import React, { useState } from 'react';
import { Calendar, Save, Loader2 } from 'lucide-react';
import { journalApi } from '../services/api';
import { JournalEntry as JournalEntryType } from '../types';

interface JournalEntryProps {
  onEntrySaved: (entry: JournalEntryType) => void;
}

const JournalEntry: React.FC<JournalEntryProps> = ({ onEntrySaved }) => {
  const [content, setContent] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');

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
      setMessage('Entry saved successfully! 🎉');

      // Clear success message after 3 seconds
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error('Error saving entry:', error);
      setMessage('Error saving entry. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const getPlaceholderText = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning! How are you feeling today? What are your plans?';
    if (hour < 18) return 'Good afternoon! How has your day been so far?';
    return 'Good evening! How was your day? What are you grateful for?';
  };

  return (
    <div className="journal-layout">
      <div className="panel-card journal-card">
        <div className="section-heading">
          <div>
            <div className="eyebrow">
              <Calendar className="h-4 w-4" />
              Daily reflection
            </div>
            <h2 className="section-title mt-4">What felt most alive today?</h2>
            <p className="section-copy mt-2">
              Write freely. Eunoia will help you notice the emotional shape of the day without
              interrupting the writing itself.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="field-shell">
            <label htmlFor="date" className="field-label">
              Entry date
            </label>
            <input
              type="date"
              id="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="field-input"
              max={new Date().toISOString().split('T')[0]}
            />
          </div>

          <div className="field-shell">
            <label htmlFor="content" className="field-label">
              Your journal entry
            </label>
            <textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={getPlaceholderText()}
              className="field-textarea resize-none"
              rows={6}
              disabled={isLoading}
            />
            <div className="journal-toolbar">
              <span>{content.length} characters</span>
              <span>{content.split(/\s+/).filter((word) => word.length > 0).length} words</span>
            </div>
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

        <div className="minimal-note">
          <p>
            Start simple: what stayed with you today, where you felt stretched or steady, and what
            you might need a little more of tomorrow.
          </p>
        </div>
      </div>
    </div>
  );
};

export default JournalEntry;
