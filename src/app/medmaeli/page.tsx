'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Image from 'next/image';
import { Loader } from 'lucide-react';
import Link from 'next/link';
import { useBook } from '../context/BookContext';
import { motion } from 'framer-motion';

type Recommendation = {
  id: string;
  book_id: string;
  metadata: {
    title: string;
    description: string;
    image_filename: string;
    url: string;
  };
  reasoning: string;
};

const MotionLink = motion(Link);

export default function RecommendationsPage() {
  const {
    searchResults,
    readBooks,
    sessionId,
    surveyResponses,
    recommendations,
    setRecommendations,
  } = useBook();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedDescriptions, setExpandedDescriptions] = useState<
    Record<string, boolean>
  >({});
  const [selectedBooks, setSelectedBooks] = useState<Set<string>>(new Set());
  const apiCallInProgressRef = useRef(false);

  const toggleDescription = (bookId: string) => {
    setExpandedDescriptions(prev => ({
      ...prev,
      [bookId]: !prev[bookId],
    }));
  };

  const toggleBookSelection = useCallback(
    async (bookId: string, recommendationId: string) => {
      if (!sessionId) {
        console.error('No session ID available');
        return;
      }

      // Check if the book is already selected
      const willBeSelected = !selectedBooks.has(bookId);

      // First update the UI state
      setSelectedBooks(prev => {
        const newSet = new Set(prev);
        if (willBeSelected) {
          newSet.add(bookId);
        } else {
          newSet.delete(bookId);
        }
        return newSet;
      });

      // Then submit feedback in a separate step
      try {
        const response = await fetch('/api/recommendations/feedback', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            sessionId,
            recommendationId,
            isRelevant: willBeSelected,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => null);
          console.error('Feedback submission error response:', {
            status: response.status,
            statusText: response.statusText,
            errorData,
          });
          throw new Error(
            `Server error: ${response.status} ${response.statusText}`
          );
        }

        await response.json();
      } catch (error) {
        console.error('Error submitting feedback:', error);
        // Revert the UI state if the API call fails
        setSelectedBooks(prev => {
          const revertedSet = new Set(prev);
          if (willBeSelected) {
            revertedSet.delete(bookId);
          } else {
            revertedSet.add(bookId);
          }
          return revertedSet;
        });
      }
    },
    [sessionId, selectedBooks]
  );

  useEffect(() => {
    const getRecommendations = async () => {
      // If already loading or API call in progress, don't start another one
      if (apiCallInProgressRef.current) return;

      // Set loading state to true at the beginning
      setIsLoading(true);

      try {
        // If we already have recommendations, just filter them and return
        if (recommendations && recommendations.length > 0) {
          setIsLoading(false);
          return;
        }

        // If we don't have search results, we can't get recommendations
        if (!sessionId || !searchResults) {
          setError('Vinsamlegast farðu fyrst í gegnum leitarsíðuna');
          setIsLoading(false);
          return;
        }

        // Check if recommendations are already being generated
        const inProgress = await fetch('/api/recommend/status', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ sessionId }),
        });

        if (inProgress.ok) {
          const { isProcessing } = await inProgress.json();
          if (isProcessing) {
            // If recommendations are being generated, wait for them
            let attempts = 0;
            const maxAttempts = 30; // Wait up to 30 seconds
            while (attempts < maxAttempts) {
              const result = await fetch('/api/recommend/status', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({ sessionId }),
              });

              if (result.ok) {
                const {
                  isProcessing: stillProcessing,
                  recommendations: existingRecs,
                } = await result.json();
                if (!stillProcessing && existingRecs) {
                  // Filter out any books that have been marked as read
                  const filteredRecommendations = existingRecs.filter(
                    (rec: Recommendation) => !readBooks.has(rec.book_id)
                  );
                  setRecommendations(filteredRecommendations);
                  setIsLoading(false);
                  return;
                }
              }
              await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
              attempts++;
            }
          }
        }

        // Mark API call as in progress
        apiCallInProgressRef.current = true;
        const requestTimestamp = Date.now();

        // Get recommendations using the search results from the search page
        const response = await fetch('/api/recommend', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            searchResults,
            readBooks: Array.from(readBooks),
            surveyResponses,
            sessionId,
            requestTimestamp, // Add timestamp to prevent caching
          }),
          // Add cache: 'no-store' to prevent duplicate requests
          cache: 'no-store',
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error('Failed to get recommendations:', errorText);
          throw new Error('Failed to get recommendations');
        }

        const data = await response.json();

        // Check if recommendations exist in the response data
        if (!data.recommendations || !Array.isArray(data.recommendations)) {
          console.error('Invalid recommendations format:', data);
          throw new Error(
            'Received invalid recommendations format from server'
          );
        }

        // Only update if we don't already have recommendations now
        // This prevents overwriting if another request completed while this one was in progress
        if (!recommendations || recommendations.length === 0) {
          // Filter out any books that have been marked as read
          const filteredRecommendations = data.recommendations.filter(
            (rec: Recommendation) => !readBooks.has(rec.book_id)
          );
          setRecommendations(filteredRecommendations);
        }
      } catch (error) {
        console.error('Error in getRecommendations:', {
          error,
          message: error instanceof Error ? error.message : 'Unknown error',
          stack: error instanceof Error ? error.stack : undefined,
        });
        setError(
          error instanceof Error
            ? error.message
            : 'Failed to get recommendations'
        );
      } finally {
        apiCallInProgressRef.current = false;
        setIsLoading(false);
      }
    };

    // Only call getRecommendations if we don't already have recommendations
    // or if we are showing loading state
    if (
      (!recommendations || !recommendations.length) &&
      !apiCallInProgressRef.current
    ) {
      getRecommendations();
    } else if (recommendations && recommendations.length > 0) {
      setIsLoading(false);
    }
  }, [
    sessionId,
    searchResults,
    readBooks,
    recommendations,
    surveyResponses,
    setRecommendations,
    setIsLoading,
    setError,
  ]); // Add proper dependencies

  // Filter recommendations to exclude read books
  const filteredRecommendations =
    recommendations?.filter(rec => !readBooks.has(rec.book_id)) || [];

  return (
    <div className='mx-auto max-w-4xl'>
      <div className='mb-2 flex items-center justify-between'>
        <h1 className='mb-4 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-4xl font-bold text-transparent'>
          Bókavélin
        </h1>
        {!isLoading && (
          <Link
            href='/'
            className='inline-flex items-center justify-center rounded-full border-2 border-purple-400 px-6 py-3 font-medium text-purple-500 shadow-md transition-all hover:bg-purple-50 hover:shadow-lg active:bg-purple-100 active:shadow-inner'
          >
            <span className='text-center'>Aftur á forsíðu</span>
          </Link>
        )}
      </div>
      <div className='mb-8 transform rounded-3xl border-4 border-purple-200 bg-white p-8 shadow-xl'>
        {error && (
          <div className='mb-4 rounded-lg bg-red-100 p-4 text-red-700'>
            Villa kom upp: {error}
          </div>
        )}

        {isLoading || apiCallInProgressRef.current ? (
          <div className='inset-0 z-50 flex flex-col items-center justify-center bg-white/80 backdrop-blur-sm'>
            <Image
              src='/robot-girl.png'
              alt='Bókavélin og barnið'
              width={300}
              height={300}
              className='mx-auto mb-10'
            />
            <Loader className='h-8 w-8 animate-spin text-purple-600' />
            <p className='mt-4 text-center text-lg text-gray-600'>
              Bókavélin er að vinna úr þínu vali og býr nú til persónuleg
              bókameðmæli. Þetta gæti tekið smá tíma.
            </p>
          </div>
        ) : (
          <>
            {filteredRecommendations.length > 0 ? (
              <div>
                <div className='mb-4 flex items-center justify-between'>
                  <h2 className='text-4xl font-bold text-purple-800'>
                    Bækur fyrir þig!
                  </h2>
                </div>
                <p className='mb-4 text-gray-600'>
                  Hér getur þú valið bækur sem þú vilt lesa. Þú getur líka
                  fundið þær á bókasafni með fjólubláu tökkunum. Að lokum væri
                  frábært ef þú gætir svarað stuttri könnun um vefsíðuna.
                </p>
                <div className='space-y-6'>
                  {filteredRecommendations.map((recommendation, index) => (
                    <div
                      key={index}
                      onClick={() =>
                        toggleBookSelection(
                          recommendation.book_id,
                          recommendation.id
                        )
                      }
                      className={`flex transform cursor-pointer flex-col rounded-xl border-2 ${
                        selectedBooks.has(recommendation.book_id)
                          ? 'border-green-400 bg-green-50'
                          : 'border-purple-100 bg-white'
                      } p-4 shadow-md transition-all hover:scale-[1.02] hover:shadow-xl md:flex-row md:gap-8`}
                    >
                      <div className='mx-auto w-64 flex-shrink-0 md:mx-0'>
                        {recommendation.metadata.image_filename && (
                          <Image
                            src={`https://c8relzaanv7wdgxi.public.blob.vercel-storage.com/${recommendation.metadata.image_filename}`}
                            alt={recommendation.metadata.title}
                            width={300}
                            height={480}
                            className='h-80 w-full rounded-lg object-cover shadow-md'
                          />
                        )}
                      </div>
                      <div className='mt-4 flex-grow md:mt-0'>
                        <h2 className='mb-2 text-xl font-semibold text-purple-800'>
                          {recommendation.metadata.title}
                        </h2>
                        <p
                          className={`mb-4 text-gray-600 ${!expandedDescriptions[recommendation.id] ? 'line-clamp-3' : ''}`}
                        >
                          {recommendation.metadata.description}
                        </p>

                        {recommendation.metadata.description.length > 150 && (
                          <button
                            onClick={e => {
                              e.stopPropagation(); // Prevent card click when clicking "show more"
                              toggleDescription(recommendation.id);
                            }}
                            className='text-sm text-purple-600 hover:text-purple-800'
                          >
                            {expandedDescriptions[recommendation.id]
                              ? 'Sýna minna'
                              : 'Sýna meira'}
                          </button>
                        )}

                        {recommendation.reasoning && (
                          <div className='mt-4 rounded-lg bg-purple-50 p-3 text-sm text-purple-700'>
                            <p className='text-md mb-2 bg-gradient-to-r from-pink-600 to-blue-600 bg-clip-text font-bold text-transparent'>
                              Hvað segir bókavélin?
                            </p>
                            {recommendation.reasoning}
                          </div>
                        )}

                        <div className='mt-4 flex flex-wrap gap-4'>
                          <Link
                            href={`https://leitir.is/discovery/search?query=any,contains,${encodeURIComponent(recommendation.metadata.title)}&tab=MyLibrary&search_scope=10000_MYLIB&vid=354ILC_NETWORK:10000_UNION&offset=0`}
                            target='_blank'
                            rel='noopener noreferrer'
                            onClick={e => e.stopPropagation()} // Prevent card click when clicking the link
                            className='rounded-lg bg-purple-600 px-6 py-3 text-white transition-colors hover:bg-purple-700'
                          >
                            <span className='inline-flex items-center justify-center gap-2'>
                              <span className='text-xl'>🔍</span>
                              <span>Finna á bókasafni</span>
                            </span>
                          </Link>
                          <div
                            className={`inline-flex items-center justify-center gap-2 rounded-lg px-6 py-3 transition-all ${
                              selectedBooks.has(recommendation.book_id)
                                ? 'bg-green-600 text-white'
                                : 'bg-purple-100 text-purple-700'
                            }`}
                          >
                            {selectedBooks.has(recommendation.book_id) ? (
                              <>
                                <span className='text-xl'>✨</span>
                                <span>Þessi er valin!</span>
                              </>
                            ) : (
                              <>
                                <span className='text-xl'>📚</span>
                                <span>Ég vil þessa!</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className='text-center'>
                <h2 className='mb-4 text-2xl font-bold text-purple-800'>
                  Engar bækur fundust
                </h2>
                <p className='text-gray-600'>
                  Því miður fundust engar bækur sem passa við þín áhugamál og
                  eru ólesnar. Prófaðu að fara til baka og velja færri bækur sem
                  þú hefur lesið.
                </p>
              </div>
            )}
          </>
        )}
      </div>
      {recommendations && recommendations.length > 0 && (
        <MotionLink
          href='/spurningar/konnun'
          animate={{
            background: [
              'linear-gradient(to right, #f97316, #2563eb, #9333ea)',
              'linear-gradient(to right, #2563eb, #9333ea, #f97316)',
              'linear-gradient(to right, #9333ea, #f97316, #2563eb)',
              'linear-gradient(to right, #f97316, #2563eb, #9333ea)',
            ],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: 'easeInOut',
            repeatType: 'loop',
          }}
          className='fixed bottom-8 right-8 z-50 ml-8 flex items-center gap-2 rounded-full px-6 py-4 text-lg font-bold text-white shadow-xl transition-all hover:scale-110 hover:shadow-2xl'
        >
          <span className='text-center'>Ljúka og svara könnun</span>
        </MotionLink>
      )}
    </div>
  );
}
