'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';

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
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (results.length > 0) {
      console.log('Search results:', results);
    }
  }, [results]);
  const handleSearch = async () => {
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

      // Log the response details
      console.log('Response status:', embedResponse.status);
      console.log(
        'Response headers:',
        Object.fromEntries(embedResponse.headers.entries())
      );

      // If not OK, log the raw response text for debugging
      if (!embedResponse.ok) {
        const rawText = await embedResponse.text();
        console.error('Raw error response:', rawText);
        throw new Error(
          `API request failed: ${embedResponse.status} ${embedResponse.statusText}`
        );
      }

      const embedding = await embedResponse.json();

      // Then search Pinecone with the embedding
      const searchResponse = await fetch('/api/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          vector: embedding,
          topK: 10,
        }),
      });

      if (!searchResponse.ok) {
        throw new Error('Search failed');
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
  };

  return (
    <div className='min-h-screen bg-gradient-to-b from-blue-100 via-purple-100 to-pink-100 px-3 py-20 font-[family-name:var(--font-geist-sans)] sm:p-20'>
      <div className='mx-auto max-w-4xl'>
        <h1 className='mb-8 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-4xl font-bold text-transparent'>
          Bókaleit
        </h1>

        <div className='mb-8 transform rounded-3xl border-4 border-purple-200 bg-white p-8 shadow-xl'>
          <div className='mb-8 rounded-lg bg-purple-50 p-4 text-sm text-purple-700'>
            <p>
              Við munum nota svörin úr könnuninni til að útbúa bókalýsingu. Hún
              verður borin saman við lýsingar í bókagrunninum okkar til að finna
              viðeigandi bækur. Það er enn í vinnslu.
            </p>
          </div>

          <div className='mb-8 flex flex-col gap-4 sm:flex-row'>
            <input
              type='text'
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder='Sláðu inn bókalýsingu...'
              className='flex-1 rounded-xl border-2 border-gray-200 p-4 transition-all focus:border-purple-300 focus:outline-none focus:ring-2 focus:ring-purple-100'
              onKeyDown={e => e.key === 'Enter' && handleSearch()}
            />
            <button
              onClick={handleSearch}
              disabled={isLoading}
              className='rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 px-8 py-4 text-white transition-all hover:scale-105 hover:shadow-lg disabled:from-gray-400 disabled:to-gray-500'
            >
              {isLoading ? 'Leita...' : 'Leita'}
            </button>
          </div>

          <div className='flex justify-center'>
            <Link
              href='/survey/end'
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
            <div className='grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3'>
              {results.map((book, index) => (
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
                  <a
                    href={book.metadata.url}
                    target='_blank'
                    rel='noopener noreferrer'
                    className='inline-block rounded-lg bg-gradient-to-r from-blue-500 to-purple-600 px-4 py-2 text-white transition-all hover:scale-105'
                  >
                    Skoða nánar
                  </a>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
