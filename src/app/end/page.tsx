'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useBook } from '../context/BookContext';

export default function EndPage() {
  const router = useRouter();
  const { sessionId } = useBook();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!sessionId) {
      console.error('No session ID found');
      return;
    }

    setIsSubmitting(true);
    const formData = new FormData(e.currentTarget);
    const responses = Object.fromEntries(formData.entries());

    try {
      const response = await fetch('/api/survey/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionId,
          responses,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to submit survey');
      }

      router.push('/thank-you');
    } catch (error) {
      console.error('Error submitting survey:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className='min-h-screen bg-gray-50 px-4 py-12 sm:px-6 lg:px-8'>
      <div className='mx-auto max-w-3xl'>
        <div className='text-center'>
          <h1 className='text-3xl font-extrabold text-gray-900 sm:text-4xl'>
            Thank you for using our service!
          </h1>
          <p className='mt-4 text-lg text-gray-600'>
            We&apos;d love to hear your feedback about your experience.
          </p>
        </div>

        <form onSubmit={handleSubmit} className='mt-8 space-y-6'>
          <div className='-space-y-px rounded-md shadow-sm'>
            <div>
              <label htmlFor='satisfaction' className='sr-only'>
                How satisfied were you with the recommendations?
              </label>
              <select
                id='satisfaction'
                name='satisfaction'
                required
                className='relative block w-full appearance-none rounded-none rounded-t-md border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-500 focus:z-10 focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm'
              >
                <option value=''>Select satisfaction level</option>
                <option value='very_satisfied'>Very Satisfied</option>
                <option value='satisfied'>Satisfied</option>
                <option value='neutral'>Neutral</option>
                <option value='dissatisfied'>Dissatisfied</option>
              </select>
            </div>
            <div>
              <label htmlFor='feedback' className='sr-only'>
                Additional feedback
              </label>
              <textarea
                id='feedback'
                name='feedback'
                rows={4}
                className='relative block w-full appearance-none rounded-none rounded-b-md border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-500 focus:z-10 focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm'
                placeholder='Any additional feedback?'
              />
            </div>
          </div>

          <div>
            <button
              type='submit'
              disabled={isSubmitting}
              className='group relative flex w-full justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50'
            >
              {isSubmitting ? 'Submitting...' : 'Submit Feedback'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
