'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Image from 'next/image';
import { Loader } from 'lucide-react';
import Link from 'next/link';
import { useBook } from '../context/BookContext';
import NextStepButton from './NextStepButton';

export default function SearchPage() {
  const {
    coverDescription,
    surveyResponses,
    sessionId,
    descriptionId,
    searchResults,
    setSearchResults,
    readBooks,
    setReadBooks,
  } = useBook();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showFloatingButton, setShowFloatingButton] = useState(true);
  const buttonRef = useRef<HTMLDivElement>(null);

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
          age: surveyResponses ? surveyResponses['reader-age'] : null,
        }),
      });

      if (!searchResponse.ok) {
        const errorText = await searchResponse.text();
        console.error('Search error response:', errorText);
        throw new Error(`Search failed: ${errorText}`);
      }

      const searchData = await searchResponse.json();
      setSearchResults(searchData.matches);
    } catch (error: unknown) {
      console.error('Error in handleSearch:', {
        error,
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
      });
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError('An unknown error occurred');
      }
    } finally {
      setIsLoading(false);
    }
  }, [
    coverDescription,
    sessionId,
    descriptionId,
    surveyResponses,
    setSearchResults,
  ]);

  const toggleReadStatus = (bookId: string) => {
    const newSet = new Set(readBooks);
    if (newSet.has(bookId)) {
      newSet.delete(bookId);
    } else {
      newSet.add(bookId);
    }
    setReadBooks(newSet);
  };

  useEffect(() => {
    if (coverDescription && !searchResults && !isLoading) {
      handleSearch();
    }
  }, [coverDescription, handleSearch, searchResults, isLoading]);

  useEffect(() => {
    const handleScroll = () => {
      if (buttonRef.current) {
        const buttonRect = buttonRef.current.getBoundingClientRect();
        const isButtonVisible =
          buttonRect.top >= 0 && buttonRect.bottom <= window.innerHeight;
        setShowFloatingButton(!isButtonVisible);
      }
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll(); // Check initial position

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

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
              Bókavélin er að leita að bókum sem gætu passað fyrir þig. Þetta
              eru ekki endanleg meðmæli, þú færð þau í næsta skrefi.
            </p>
          </div>
        ) : (
          <>
            {searchResults && searchResults.length > 0 && (
              <div>
                <h2 className='mb-4 text-4xl font-bold text-purple-800'>
                  Hefurðu lesið einhverjar af þessum bókum?
                </h2>
                <p className='mb-4 rounded-lg bg-purple-50 p-4 text-gray-600'>
                  Þetta eru ekki endanleg meðmæli, þú færð þau í næsta skrefi.
                  Nú getur þú merkt við þær bækur sem þú hefur þegar lesið. Svo
                  getur þú smellt á hnappinn neðst á síðunni til þess að fá
                  persónuleg bókameðmæli.
                </p>
                <div className='grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3'>
                  {searchResults.map((book, index) => (
                    <div
                      key={index}
                      onClick={() => toggleReadStatus(book.id)}
                      className={`transform rounded-xl border-2 ${
                        readBooks.has(book.id)
                          ? 'border-green-200 bg-green-50'
                          : 'border-purple-100 bg-white'
                      } p-4 shadow-md transition-all hover:scale-[1.02] hover:shadow-xl`}
                    >
                      {book.metadata.image_filename && (
                        <Image
                          src={`https://c8relzaanv7wdgxi.public.blob.vercel-storage.com/${book.metadata.image_filename}`}
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
                <div ref={buttonRef}>
                  <NextStepButton />
                </div>
              </div>
            )}
          </>
        )}
      </div>
      {searchResults && searchResults.length > 0 && showFloatingButton && (
        <NextStepButton isFloating />
      )}
    </div>
  );
}
