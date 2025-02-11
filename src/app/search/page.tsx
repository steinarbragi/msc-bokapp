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
    <div className='min-h-screen p-8'>
      <div className='mx-auto max-w-4xl'>
        <h1 className='mb-8 text-3xl font-bold'>Leitaðu að bókum</h1>

        <div className='mb-8 flex gap-4'>
          <input
            type='text'
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder='Sláðu inn leitarorð...'
            className='flex-1 rounded-lg border p-3 shadow-sm'
            onKeyDown={e => e.key === 'Enter' && handleSearch()}
          />
          <button
            onClick={handleSearch}
            disabled={isLoading}
            className='rounded-lg bg-blue-600 px-6 py-3 text-white hover:bg-blue-700 disabled:bg-blue-300'
          >
            {isLoading ? 'Leita...' : 'Leita'}
          </button>
        </div>

        <Link
          href='/survey/end'
          className='mb-8 block text-center text-blue-600 hover:underline'
        >
          Svara stuttri könnun um vefsíðuna
        </Link>

        {error && (
          <div className='mb-4 rounded-lg bg-red-100 p-4 text-red-700'>
            Villa kom upp: {error}
          </div>
        )}

        {isLoading ? (
          <div className='text-center'>Leita að bókum...</div>
        ) : (
          <div className='grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3'>
            {results.map((book, index) => (
              <div
                key={index}
                className='rounded-lg border bg-white p-4 shadow'
              >
                {book.metadata.image_url && (
                  <Image
                    src={`https://c8relzaanv7wdgxi.public.blob.vercel-storage.com/${book.metadata.image_url}`}
                    alt={book.metadata.title}
                    width={200}
                    height={320}
                    className='mb-4 h-80 w-full object-cover'
                  />
                )}
                <h2 className='mb-2 text-xl font-semibold'>
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
                  className='text-blue-600 hover:underline'
                >
                  Skoða nánar
                </a>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
