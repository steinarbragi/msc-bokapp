'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';

interface BookMetadata {
  title: string;
  description: string;
  url: string;
  image_url?: string;
}

interface SearchResult {
  metadata: BookMetadata;
}

export default function SearchPage() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (results.length > 0) {
      console.log('Search results:', results);
    }
  }, [results]);
  const handleSearch = async () => {
    if (!query) return;

    setIsLoading(true);
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
        throw new Error('Failed to generate embedding');
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
    } catch (error) {
      console.error('Error searching:', error);
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
                    width={100}
                    height={150}
                    className='mb-4 h-48 w-full object-cover'
                  />
                )}
                <h2 className='mb-2 text-xl font-semibold'>
                  {book.metadata.title}
                </h2>
                <p className='mb-4 line-clamp-3 text-gray-600'>
                  {book.metadata.description}
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
