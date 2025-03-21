'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { Loader } from 'lucide-react';
import Link from 'next/link';
import { useBook } from '../context/BookContext';

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

export default function SearchPage() {
  const { coverDescription } = useBook();
  const [query, setQuery] = useState(coverDescription);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [readBooks, setReadBooks] = useState<Set<string>>(new Set());
  const [recommendations, setRecommendations] = useState<
    (SearchResult & { reasoning: string })[]
  >([]);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSearch = useCallback(async () => {
    if (!query) return;

    setIsLoading(true);
    setError(null); // Clear any previous errors

    try {
      // First get the embedding for the search query
      const embedResponse = await fetch('/api/embed', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text: query }),
      });

      if (!embedResponse.ok) {
        const rawText = await embedResponse.text();
        console.error('Raw error response:', rawText);
        throw new Error(
          `API request failed: ${embedResponse.status} ${embedResponse.statusText}`
        );
      }

      const { vector } = await embedResponse.json();
      
      // Add logging to debug the vector
      console.log('Vector type:', typeof vector);
      console.log('Vector length:', vector.length);
      console.log('First few values:', vector.slice(0, 5));

      console.log(
        'Sending to search:',
        JSON.stringify({ vector, topK: 50 }, null, 2)
      );

      // Then search Pinecone with the embedding
      const searchResponse = await fetch('/api/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          vector,
          topK: 50,
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
  }, [query]);

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
    setIsProcessing(true);
    try {
      const response = await fetch('/api/recommend', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          searchResults: results,
          readBooks: Array.from(readBooks),
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get recommendations');
      }

      const data = await response.json();
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
          Bókaleit
        </h1>
        <Link href='/'>
          <button className='mb-4 rounded-xl border-2 border-purple-300 bg-purple-50 px-4 py-2 text-center text-purple-700 transition-all hover:scale-105 hover:border-purple-400 hover:bg-purple-100'>
            Aftur á forsíðu
          </button>
        </Link>
      </div>
      <div className='mb-8 transform rounded-3xl border-4 border-purple-200 bg-white p-8 shadow-xl'>
        <p className='mb-6 rounded-xl bg-purple-50 p-4 text-base text-gray-600'>
          Athugið: Þegar spurningum hefur verið svarað notum við svörin til að
          útbúa bókalýsingu. Þessi lýsing er notuð til að leita að svipuðum
          bókum en verður líklega ekki sýnileg í endanlegri útgáfu.
        </p>
        <div className='mb-8 flex flex-col content-center items-center gap-4 sm:flex-row'>
          <textarea
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder='Sláðu inn bókalýsingu...'
            className='h-24 flex-1 rounded-xl border-2 border-gray-200 p-4 opacity-30 transition-all focus:border-purple-300 focus:outline-none focus:ring-2 focus:ring-purple-100'
            onKeyDown={e => e.key === 'Enter' && handleSearch()}
          />
          <button
            onClick={handleSearch}
            disabled={isLoading}
            className='h-14 rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 px-8 py-4 text-white transition-all hover:scale-105 hover:shadow-lg disabled:from-gray-400 disabled:to-gray-500'
          >
            {isLoading ? <Loader className='animate-spin' /> : 'Leita'}
          </button>
        </div>

        <div className='flex justify-center'>
          <Link
            href='/spurningar/konnun'
            className='mb-8 inline-block rounded-xl border-2 border-purple-300 bg-purple-50 px-8 py-4 text-center text-purple-700 transition-all hover:scale-105 hover:border-purple-400 hover:bg-purple-100'
          >
            Svara stuttri könnun um vefsíðuna
          </Link>
        </div>

        {error && (
          <div className='mb-4 rounded-lg bg-red-100 p-4 text-red-700'>
            Villa kom upp: {error}
          </div>
        )}

        {isLoading ? (
          <div className='text-center text-lg text-gray-600'>
            Leita að bókum...
          </div>
        ) : (
          <>
            {results.length > 0 && recommendations.length === 0 && (
              <div>
                <div className='mb-4 text-sm text-gray-600'>
                  Hefurðu lesið einhverjar af þessum bókum?
                </div>
                <div className='grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3'>
                  {results.map((book, index) => (
                    <div
                      key={index}
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
                      <p className='pb-5 text-xs text-gray-500'>
                        Score: {book.score}
                      </p>
                      <div className='mb-4 flex items-center justify-between'>
                        <a
                          href={book.metadata.url}
                          target='_blank'
                          rel='noopener noreferrer'
                          className='inline-block rounded-lg bg-gradient-to-r from-blue-500 to-purple-600 px-4 py-2 text-white transition-all hover:scale-105'
                        >
                          Skoða nánar
                        </a>
                        <button
                          onClick={() => toggleReadStatus(book.id)}
                          className={`rounded-lg px-4 py-2 transition-all ${
                            readBooks.has(book.id)
                              ? 'bg-green-500 text-white hover:bg-green-600'
                              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                          }`}
                        >
                          {readBooks.has(book.id)
                            ? 'Lesin ✓'
                            : 'Merkja sem lesna'}
                        </button>
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
                    Tillögur að nýjum bókum
                  </h2>
                  <button
                    onClick={() => setRecommendations([])}
                    className='px-4 py-2 text-sm text-purple-600 hover:text-purple-800'
                  >
                    Sýna allar bækur
                  </button>
                </div>
                <div className='grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3'>
                  {recommendations.map((book, index) => (
                    <div
                      key={index}
                      className='transform rounded-xl border-2 border-purple-100 bg-white p-4 shadow-md transition-all hover:scale-[1.02] hover:shadow-xl'
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
                      <p className='pb-5 text-xs text-gray-500'>
                        Score: {book.score}
                      </p>
                      <div className='mt-4 rounded-lg bg-purple-50 p-3 text-sm text-purple-700'>
                        {book.reasoning}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
      {results.length > 0 &&
        readBooks.size > 0 &&
        recommendations.length === 0 && (
          <button
            onClick={getRecommendations}
            disabled={isProcessing}
            className='fixed bottom-8 right-8 z-50 flex items-center gap-2 rounded-full bg-purple-600 px-6 py-3 text-white shadow-lg transition-all hover:scale-105 hover:bg-purple-700 disabled:bg-gray-400'
          >
            {isProcessing ? (
              <Loader className='animate-spin' />
            ) : (
              <>
                <span>Fá tillögur að nýjum bókum</span>
                <span className='flex h-6 w-6 items-center justify-center rounded-full bg-white text-sm text-purple-600'>
                  {readBooks.size}
                </span>
              </>
            )}
          </button>
        )}
      {recommendations.length > 0 && (
        <Link
          href='/spurningar/konnun'
          className='fixed bottom-8 right-8 z-50 flex items-center gap-2 rounded-full bg-purple-600 px-6 py-3 text-white shadow-lg transition-all hover:scale-105 hover:bg-purple-700'
        >
          <span>Svara stuttri könnun um vefsíðuna</span>
        </Link>
      )}
    </div>
  );
}
