'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Loader } from 'lucide-react';
import Link from 'next/link';
import { useBook } from '../context/BookContext';
import { motion } from 'framer-motion';

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
  const toggleDescription = (bookId: string) => {
    setExpandedDescriptions(prev => ({
      ...prev,
      [bookId]: !prev[bookId],
    }));
  };

  const toggleBookSelection = async (
    bookId: string,
    recommendationId: string
  ) => {
    if (!sessionId) {
      console.error('No session ID available');
      return;
    }

    setSelectedBooks(prev => {
      const newSet = new Set(prev);
      const willBeSelected = !newSet.has(bookId);

      if (willBeSelected) {
        newSet.add(bookId);
      } else {
        newSet.delete(bookId);
      }

      // Submit simplified feedback
      fetch('/api/recommendations/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionId,
          recommendationId,
          isRelevant: willBeSelected,
          feedbackType: willBeSelected ? 'yes' : 'no',
        }),
      }).catch(error => {
        console.error('Error submitting feedback:', error);
      });

      return newSet;
    });
  };

  useEffect(() => {
    const getRecommendations = async () => {
      try {
        if (!sessionId || !searchResults) {
          throw new Error('Missing required data');
        }

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
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to get recommendations');
        }

        const data = await response.json();
        setRecommendations(data.recommendations);
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
        setIsLoading(false);
      }
    };

    getRecommendations();
  }, [
    searchResults,
    readBooks,
    sessionId,
    surveyResponses,
    setRecommendations,
  ]);

  return (
    <div className='mx-auto max-w-4xl'>
      <div className='mb-2 flex items-center justify-between'>
        <h1 className='mb-4 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-4xl font-bold text-transparent'>
          Bókavélin
        </h1>
      </div>
      <div className='mb-8 transform rounded-3xl border-4 border-purple-200 bg-white p-8 shadow-xl'>
        {error && (
          <div className='mb-4 rounded-lg bg-red-100 p-4 text-red-700'>
            Villa kom upp: {error}
          </div>
        )}

        {isLoading ? (
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
            {recommendations && recommendations.length > 0 && (
              <div>
                <div className='mb-4 flex items-center justify-between'>
                  <h2 className='text-4xl font-bold text-purple-800'>
                    Bækur fyrir þig
                  </h2>
                </div>
                <p className='mb-4 text-gray-600'>
                  Þetta eru bækur sem bókavélin hefur fann sérstaklega fyrir
                  þig!
                </p>
                <div className='space-y-6'>
                  {recommendations.map((recommendation, index) => (
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
          <span className='text-center'>Svara stuttri könnun um vefsíðuna</span>
        </MotionLink>
      )}
    </div>
  );
}
