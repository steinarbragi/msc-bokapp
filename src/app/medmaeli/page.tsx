'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Loader } from 'lucide-react';
import Link from 'next/link';
import { useBook } from '../context/BookContext';
import { motion } from 'framer-motion';

interface BookMetadata {
  title: string;
  description: string;
  url: string;
  image_filename?: string;
}

interface SearchResult {
  metadata: BookMetadata;
  id: string;
  score: number;
}

interface Recommendation extends SearchResult {
  reasoning: string;
}

const MotionLink = motion(Link);

export default function RecommendationsPage() {
  const { searchResults, readBooks, sessionId, surveyResponses } = useBook();
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
  }, [searchResults, readBooks, sessionId, surveyResponses]);

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
            {recommendations.length > 0 && (
              <div>
                <div className='mb-4 flex items-center justify-between'>
                  <h2 className='text-2xl font-bold text-purple-800'>
                    Bókameðmæli
                  </h2>
                </div>
                <div className='space-y-6'>
                  {recommendations.map((book, index) => (
                    <Link
                      key={index}
                      href={`https://leitir.is/discovery/search?query=any,contains,${encodeURIComponent(book.metadata.title)}&tab=MyLibrary&search_scope=10000_MYLIB&vid=354ILC_NETWORK:10000_UNION&offset=0`}
                      target='_blank'
                      rel='noopener noreferrer'
                      className='flex transform flex-col rounded-xl border-2 border-purple-100 bg-white p-4 shadow-md transition-all hover:scale-[1.02] hover:shadow-xl md:flex-row md:gap-8'
                    >
                      <div className='mx-auto w-48 flex-shrink-0 md:mx-0'>
                        {book.metadata.image_filename && (
                          <Image
                            src={`https://c8relzaanv7wdgxi.public.blob.vercel-storage.com/${book.metadata.image_filename}`}
                            alt={book.metadata.title}
                            width={200}
                            height={320}
                            className='h-64 w-full rounded-lg object-cover'
                          />
                        )}
                      </div>
                      <div className='mt-4 md:mt-0'>
                        <h2 className='mb-2 text-xl font-semibold text-purple-800'>
                          {book.metadata.title}
                        </h2>
                        <p className='mb-4 line-clamp-3 text-gray-600'>
                          {book.metadata.description}
                        </p>

                        {book.reasoning && (
                          <div className='mt-4 rounded-lg bg-purple-50 p-3 text-sm text-purple-700'>
                            <p className='text-xs text-gray-500'>
                              Hvað segir bókavélin?
                            </p>
                            {book.reasoning}
                          </div>
                        )}
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
      {recommendations.length > 0 && (
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
