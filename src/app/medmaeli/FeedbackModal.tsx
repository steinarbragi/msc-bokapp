import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';

interface FeedbackModalProps {
  isOpen: boolean;
  title: string;
  reasoning: string | null;
  imageUrl: string | null;
  recommendationId: string | null;
  sessionId: string;
  onClose: () => void;
  onSubmit: (feedbackType: 'yes' | 'maybe' | 'no') => Promise<void>;
}

interface FeedbackData {
  rating: number | null;
  feedbackText: string;
  feedbackType: 'yes' | 'maybe' | 'no' | null;
}

export default function FeedbackModal({
  isOpen,
  title,
  reasoning,
  imageUrl,
  recommendationId,
  sessionId,
  onClose,
  onSubmit,
}: FeedbackModalProps) {
  const [feedback, setFeedback] = useState<FeedbackData>({
    rating: null,
    feedbackText: '',
    feedbackType: null,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const fetchExistingFeedback = useCallback(async () => {
    try {
      const response = await fetch(
        `/api/recommendations/feedback/${recommendationId}?sessionId=${sessionId}`
      );
      if (response.ok) {
        const data = await response.json();
        if (data.feedback) {
          setFeedback({
            rating: data.feedback.rating,
            feedbackText: data.feedback.feedback_text || '',
            feedbackType: data.feedback.feedback_type,
          });
        }
      }
    } catch (error) {
      console.error('Error fetching existing feedback:', error);
    }
  }, [recommendationId, sessionId]);

  useEffect(() => {
    if (isOpen && recommendationId) {
      fetchExistingFeedback();
    }
  }, [isOpen, recommendationId, fetchExistingFeedback]);

  const handleRatingSubmit = async (rating: number) => {
    try {
      const response = await fetch('/api/recommendations/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionId,
          recommendationId,
          rating,
          feedbackType: feedback.feedbackType,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to submit rating');
      }

      setFeedback(prev => ({ ...prev, rating }));
    } catch (error) {
      console.error('Error submitting rating:', error);
      setSubmitError('Failed to submit rating');
    }
  };

  const handleCommentSubmit = async () => {
    if (!feedback.feedbackText.trim()) return;

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const response = await fetch('/api/recommendations/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionId,
          recommendationId,
          feedbackText: feedback.feedbackText,
          feedbackType: feedback.feedbackType,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to submit comment');
      }

      setSubmitError(null);
    } catch (error) {
      console.error('Error submitting comment:', error);
      setSubmitError('Failed to submit comment');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async (feedbackType: 'yes' | 'maybe' | 'no') => {
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      await onSubmit(feedbackType);
      setFeedback(prev => ({ ...prev, feedbackType }));
    } catch (error) {
      console.error('Error submitting feedback:', error);
      setSubmitError(
        error instanceof Error ? error.message : 'Failed to submit feedback'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/50'>
      <div className='w-full max-w-xl rounded-2xl bg-white p-6 shadow-xl'>
        <h3 className='mb-4 text-xl font-bold text-purple-800'>Gefa álit</h3>
        {submitError && (
          <div className='mb-4 rounded-lg bg-red-100 p-3 text-sm text-red-700'>
            {submitError}
          </div>
        )}
        <p className='mb-4 text-gray-600'>
          Hvað finnst þér um þessa bók? Þú getur gefið okkur álit á því hversu
          vel bókin hentar þér.
        </p>
        <h2 className='mb-4 text-xl font-bold text-purple-800'>{title}</h2>

        <div className='mb-4 flex flex-row gap-4'>
          {imageUrl && (
            <div className='flex justify-center'>
              <Image
                src={imageUrl}
                alt={title}
                width={200}
                height={300}
                className='h-64 w-auto rounded-lg object-cover shadow-md'
              />
            </div>
          )}

          {reasoning && (
            <div className='flex-1 rounded-lg bg-purple-50 p-3 text-sm text-purple-700'>
              <p className='text-md mb-2 bg-gradient-to-r from-pink-600 to-blue-600 bg-clip-text font-bold text-transparent'>
                Hvað segir bókavélin?
              </p>
              {reasoning}
            </div>
          )}
        </div>

        <div className='mb-4'>
          <label className='mb-2 block text-sm font-medium text-gray-700'>
            Einkunn
          </label>
          <div className='flex gap-2'>
            {[1, 2, 3, 4, 5].map(star => (
              <button
                key={star}
                onClick={() => handleRatingSubmit(star)}
                className={`h-8 w-8 rounded-full transition-colors ${
                  feedback.rating && star <= feedback.rating
                    ? 'bg-yellow-400 text-white'
                    : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                }`}
              >
                ★
              </button>
            ))}
          </div>
        </div>

        <div className='mb-4'>
          <label className='mb-2 block text-sm font-medium text-gray-700'>
            Athugasemd
          </label>
          <div className='flex gap-2'>
            <textarea
              value={feedback.feedbackText}
              onChange={e =>
                setFeedback(prev => ({ ...prev, feedbackText: e.target.value }))
              }
              className='flex-1 rounded-lg border border-gray-300 p-2 focus:border-purple-500 focus:outline-none'
              rows={3}
              placeholder='Skrifaðu athugasemd ef þú vilt...'
            />
            <button
              onClick={handleCommentSubmit}
              disabled={isSubmitting || !feedback.feedbackText.trim()}
              className={`rounded-lg px-4 py-2 transition-colors ${
                feedback.feedbackText
                  ? 'bg-purple-600 text-white hover:bg-purple-700'
                  : 'bg-purple-100 text-purple-700'
              } disabled:opacity-50`}
            >
              Senda
            </button>
          </div>
        </div>

        <p className='mb-4 text-gray-600'>Myndir þú lesa þessa bók?</p>
        <div className='mb-4 flex justify-center gap-4'>
          <button
            onClick={() => handleSubmit('yes')}
            disabled={isSubmitting}
            className={`rounded-lg px-4 py-2 transition-colors ${
              feedback.feedbackType === 'yes'
                ? 'bg-green-600 text-white hover:bg-green-700'
                : 'bg-green-100 text-green-700 hover:bg-green-200'
            }`}
          >
            Já!
          </button>
          <button
            onClick={() => handleSubmit('maybe')}
            disabled={isSubmitting}
            className={`rounded-lg px-4 py-2 transition-colors ${
              feedback.feedbackType === 'maybe'
                ? 'bg-yellow-600 text-white hover:bg-yellow-700'
                : 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
            }`}
          >
            Kannski
          </button>
          <button
            onClick={() => handleSubmit('no')}
            disabled={isSubmitting}
            className={`rounded-lg px-4 py-2 transition-colors ${
              feedback.feedbackType === 'no'
                ? 'bg-red-600 text-white hover:bg-red-700'
                : 'bg-red-100 text-red-700 hover:bg-red-200'
            }`}
          >
            Nei
          </button>
        </div>
        <div className='flex justify-end gap-4'>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className='rounded-lg bg-gray-100 px-4 py-2 text-gray-700 transition-colors hover:bg-gray-200 disabled:opacity-50'
          >
            Loka
          </button>
        </div>
      </div>
    </div>
  );
}
