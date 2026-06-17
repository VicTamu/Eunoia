import React, { useState } from 'react';
import { Check, MessageCircle, Send, X } from 'lucide-react';
import { journalApi } from '../../services/api';

interface FeedbackModalProps {
  page?: string;
  onClose: () => void;
}

type SubmitState = 'idle' | 'sending' | 'sent' | 'error';

const RATINGS = [1, 2, 3, 4, 5];

const FeedbackModal: React.FC<FeedbackModalProps> = ({ page, onClose }) => {
  const [message, setMessage] = useState('');
  const [rating, setRating] = useState<number | null>(null);
  const [submitState, setSubmitState] = useState<SubmitState>('idle');

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!message.trim() || submitState === 'sending') {
      return;
    }

    setSubmitState('sending');
    try {
      await journalApi.submitFeedback({ message: message.trim(), rating, page });
      setSubmitState('sent');
    } catch (error) {
      console.error('Error submitting feedback:', error);
      setSubmitState('error');
    }
  };

  return (
    <div className="preferences-overlay" onClick={onClose}>
      <div
        className="panel-card feedback-modal"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="feedback-title"
      >
        <button
          type="button"
          className="preferences-close"
          onClick={onClose}
          aria-label="Close feedback"
        >
          <X className="h-5 w-5" />
        </button>

        {submitState === 'sent' ? (
          <div className="feedback-success">
            <span className="feedback-success-mark" aria-hidden>
              <Check className="h-5 w-5" />
            </span>
            <h2 id="feedback-title" className="feedback-title">
              Thank you for shaping Eunoia.
            </h2>
            <p className="feedback-lead">
              Your note is in. It genuinely helps decide what comes next.
            </p>
            <button type="button" className="primary-action" onClick={onClose}>
              Close
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="eyebrow">
              <MessageCircle className="h-4 w-4" />
              Share feedback
            </div>
            <h2 id="feedback-title" className="feedback-title">
              Help shape Eunoia
            </h2>
            <p className="feedback-lead">
              What is working, what is missing, what felt off? Even a sentence helps. This goes
              privately to the person building Eunoia.
            </p>

            <div className="feedback-rating" role="group" aria-label="Optional rating">
              <span className="feedback-rating-label">How is it feeling so far? (optional)</span>
              <div className="feedback-rating-options">
                {RATINGS.map((value) => (
                  <button
                    key={value}
                    type="button"
                    className={`feedback-rating-pill ${
                      rating === value ? 'feedback-rating-pill-active' : ''
                    }`}
                    onClick={() => setRating((current) => (current === value ? null : value))}
                    aria-pressed={rating === value}
                  >
                    {value}
                  </button>
                ))}
              </div>
            </div>

            <label className="sr-only" htmlFor="feedback-message">
              Your feedback
            </label>
            <textarea
              id="feedback-message"
              className="feedback-textarea"
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              placeholder="Write as much or as little as you like."
              rows={5}
              maxLength={4000}
              autoFocus
            />

            {submitState === 'error' ? (
              <div className="status-banner status-banner-error" role="alert">
                That didn&apos;t send. Please try again in a moment.
              </div>
            ) : null}

            <div className="feedback-actions">
              <button type="button" className="onboarding-secondary" onClick={onClose}>
                Cancel
              </button>
              <button
                type="submit"
                className="primary-action"
                disabled={!message.trim() || submitState === 'sending'}
              >
                <Send className="h-4 w-4" />
                {submitState === 'sending' ? 'Sending...' : 'Send feedback'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default FeedbackModal;
