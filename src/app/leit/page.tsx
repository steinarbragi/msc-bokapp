'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { Loader } from 'lucide-react';
import Link from 'next/link';
import { useBook } from '../context/BookContext';
import { motion } from 'framer-motion';

interface BookMetadata {
  title: string;
  description: string;
  url: string;
  image_url?: string;
}

interface SearchResult {
  metadata: BookMetadata;
  id: string;
  score: number;
}

const MotionLink = motion(Link);

export default function SearchPage() {
  const { coverDescription, surveyResponses, sessionId, descriptionId } =
    useBook();
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [readBooks, setReadBooks] = useState<Set<string>>(new Set());
  const [recommendations, setRecommendations] = useState<
    (SearchResult & { reasoning: string })[]
  >([]);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSearch = useCallback(async () => {
    if (!coverDescription || !sessionId || !descriptionId) return;

    setIsLoading(true);
    setError(null);

    try {
      // First get the embedding for the search query
      const embedResponse = await fetch('/api/embed', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text: coverDescription }),
      });

      if (!embedResponse.ok) {
        const rawText = await embedResponse.text();
        console.error('Raw error response:', rawText);
        throw new Error(
          `API request failed: ${embedResponse.status} ${embedResponse.statusText}`
        );
      }

      const { vector } = await embedResponse.json();

      // Then search Pinecone with the embedding
      const searchResponse = await fetch('/api/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          vector,
          topK: 50,
          sessionId,
          descriptionId,
        }),
      });

      if (!searchResponse.ok) {
        const errorText = await searchResponse.text();
        console.error('Search error response:', errorText);
        throw new Error(`Search failed: ${errorText}`);
      }

      const searchResults = await searchResponse.json();
      setResults(searchResults.matches);
    } catch (error: unknown) {
      console.error('Error searching:', error);
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError('An unknown error occurred');
      }
    } finally {
      setIsLoading(false);
    }
  }, [coverDescription, sessionId, descriptionId]);

  const toggleReadStatus = (bookId: string) => {
    setReadBooks(prev => {
      const newSet = new Set(prev);
      if (newSet.has(bookId)) {
        newSet.delete(bookId);
      } else {
        newSet.add(bookId);
      }
      return newSet;
    });
  };

  const getRecommendations = async () => {
    if (!sessionId) return;

    setIsProcessing(true);
    try {
      console.log('Fetching recommendations with:', {
        searchResults: results.length,
        readBooks: Array.from(readBooks),
        surveyResponses,
        sessionId,
      });

      const response = await fetch('/api/recommend', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          searchResults: results,
          readBooks: Array.from(readBooks),
          surveyResponses,
          sessionId,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get recommendations');
      }

      const data = await response.json();
      console.log('Received recommendations:', data.recommendations);
      setRecommendations(data.recommendations);
    } catch (error) {
      console.error('Error getting recommendations:', error);
      setError(
        error instanceof Error ? error.message : 'Failed to get recommendations'
      );
    } finally {
      setIsProcessing(false);
    }
  };

  useEffect(() => {
    if (coverDescription) {
      handleSearch();
    }
  }, [coverDescription, handleSearch]);

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

        {isLoading && !isProcessing ? (
          <div className='inset-0 z-50 flex flex-col items-center justify-center bg-white/80 backdrop-blur-sm'>
            <Loader className='h-8 w-8 animate-spin text-purple-600' />
            <p className='mt-4 text-center text-lg text-gray-600'>
              Bókavélin er að leita að bókum sem gætu passað fyrir þig. Þetta
              eru ekki endanleg meðmæli, þú færð þau í næsta skrefi.
            </p>
          </div>
        ) : isProcessing ? (
          <div className='inset-0 z-50 flex flex-col items-center justify-center bg-white/80 backdrop-blur-sm'>
            <Loader className='h-8 w-8 animate-spin text-purple-600' />
            <p className='mt-4 text-center text-lg text-gray-600'>
              Bókavélin er að vinna úr þínu vali og býr nú til persónuleg
              bókameðmæli. Þetta gæti tekið smá tíma.
            </p>
          </div>
        ) : (
          <>
            {(() => {
              return (
                <>
                  {results.length > 0 && recommendations.length === 0 && (
                    <div>
                      <h2 className='mb-4 text-2xl font-bold text-purple-800'>
                        Hefurðu lesið einhverjar af þessum bókum?
                      </h2>
                      <p className='mb-4 rounded-lg bg-purple-50 p-4 text-gray-600'>
                        Þetta eru ekki endanleg meðmæli, þú færð þau í næsta
                        skrefi. Nú getur þú merkt við þær bækur sem þú hefur
                        þegar lesið. Svo getur þú smellt á hnappinn neðst á
                        síðunni til þess að fá persónuleg bókameðmæli.
                      </p>
                      <div className='grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3'>
                        {results.map((book, index) => (
                          <div
                            key={index}
                            onClick={() => toggleReadStatus(book.id)}
                            className={`transform rounded-xl border-2 ${
                              readBooks.has(book.id)
                                ? 'border-green-200 bg-green-50'
                                : 'border-purple-100 bg-white'
                            } p-4 shadow-md transition-all hover:scale-[1.02] hover:shadow-xl`}
                          >
                            {book.metadata.image_url && (
                              <Image
                                src={`https://c8relzaanv7wdgxi.public.blob.vercel-storage.com/${book.metadata.image_url}`}
                                alt={book.metadata.title}
                                width={200}
                                height={320}
                                className='mb-4 h-80 w-full rounded-lg object-cover'
                              />
                            )}
                            <h2 className='mb-2 text-xl font-semibold text-purple-800'>
                              {book.metadata.title}
                            </h2>
                            <p className='mb-4 line-clamp-3 text-gray-600'>
                              {book.metadata.description}
                            </p>
                            <button
                              onClick={e => {
                                e.stopPropagation();
                                toggleReadStatus(book.id);
                              }}
                              className={`w-full rounded-lg px-4 py-3 text-lg font-medium transition-all ${
                                readBooks.has(book.id)
                                  ? 'bg-green-600 text-white hover:bg-green-700'
                                  : 'bg-purple-100 text-purple-800 hover:bg-purple-200'
                              }`}
                            >
                              {readBooks.has(book.id)
                                ? 'Lesin ✓'
                                : 'Merkja sem lesna'}
                            </button>
                            <div className='pt-4'>
                              <Link
                                href={book.metadata.url}
                                target='_blank'
                                rel='noopener noreferrer'
                                className='text-center text-xs text-blue-500'
                                onClick={e => e.stopPropagation()}
                              >
                                Skoða hjá Forlaginu
                              </Link>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {recommendations.length > 0 && (
                    <div>
                      <div className='mb-4 flex items-center justify-between'>
                        <h2 className='text-2xl font-bold text-purple-800'>
                          Bókameðmæli
                        </h2>
                        <button
                          onClick={() => setRecommendations([])}
                          className='px-4 py-2 text-sm text-purple-600 hover:text-purple-800'
                        >
                          Sýna allar bækur
                        </button>
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
                              {book.metadata.image_url && (
                                <Image
                                  src={`https://c8relzaanv7wdgxi.public.blob.vercel-storage.com/${book.metadata.image_url}`}
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
              );
            })()}
          </>
        )}
      </div>
      {results.length > 0 && recommendations.length === 0 && (
        <motion.button
          onClick={getRecommendations}
          disabled={isProcessing}
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
          className='fixed bottom-8 right-8 z-50 ml-8 flex items-center gap-2 rounded-full px-6 py-4 text-lg font-bold text-white shadow-xl transition-all hover:scale-110 hover:shadow-2xl disabled:bg-gray-400'
        >
          {isProcessing ? (
            <Loader className='animate-spin' />
          ) : (
            <>
              <span>✨</span>
              <span>Vista lesnar bækur og fá meðmæli frá bókavélinni</span>
              <span className='flex h-8 w-8 items-center justify-center rounded-full bg-white text-lg font-bold text-purple-600 shadow-inner'>
                {readBooks.size}
              </span>
              <span>✨</span>
            </>
          )}
        </motion.button>
      )}
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
