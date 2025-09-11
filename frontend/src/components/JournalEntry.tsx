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
    <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
      <div className="flex items-center gap-2 mb-4">
        <Calendar className="h-5 w-5 text-blue-600" />
        <h2 className="text-xl font-semibold text-gray-800">Today&apos;s Journal Entry</h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-2">
            Date
          </label>
          <input
            type="date"
            id="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            max={new Date().toISOString().split('T')[0]}
          />
        </div>

        <div>
          <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-2">
            How are you feeling today?
          </label>
          <textarea
            id="content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={getPlaceholderText()}
            className="w-full px-3 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            rows={6}
            disabled={isLoading}
          />
          <div className="flex justify-between items-center mt-2">
            <span className="text-sm text-gray-500">{content.length} characters</span>
            <span className="text-sm text-gray-500">
              {content.split(/\s+/).filter((word) => word.length > 0).length} words
            </span>
          </div>
        </div>

        {message && (
          <div
            className={`p-3 rounded-md ${
              message.includes('Error') || message.includes('Please')
                ? 'bg-red-50 text-red-700 border border-red-200'
                : 'bg-green-50 text-green-700 border border-green-200'
            }`}
          >
            {message}
          </div>
        )}

        <button
          type="submit"
          disabled={isLoading || !content.trim()}
          className="w-full bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-colors"
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Analyzing and saving...
            </>
          ) : (
            <>
              <Save className="h-4 w-4" />
              Save Entry
            </>
          )}
        </button>
      </form>

      <div className="mt-4 p-4 bg-blue-50 rounded-md">
        <p className="text-sm text-blue-800">
          <strong>Privacy Note:</strong> Your journal entries are analyzed by AI to provide insights
          about your mood and stress levels. This is a prototype - please don&apos;t share sensitive
          personal information.
        </p>
      </div>
    </div>
  );
};

export default JournalEntry;
