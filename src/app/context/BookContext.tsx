'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';

type SurveyResponse = {
  [key: string]: string | string[];
};

type BookContextType = {
  coverDescription: string | null;
  setCoverDescription: (description: string) => void;
  surveyResponses: SurveyResponse | null;
  setSurveyResponses: (responses: SurveyResponse) => void;
  sessionId: string | null;
  setSessionId: (id: string) => void;
  descriptionId: string | null;
  setDescriptionId: (id: string) => void;
  searchResults: SearchResult[] | null;
  setSearchResults: (results: SearchResult[]) => void;
  readBooks: Set<string>;
  setReadBooks: (books: Set<string>) => void;
  resetSession: () => void;
  recommendations: Recommendation[] | null;
  setRecommendations: (recommendations: Recommendation[] | null) => void;
  addRecommendation: (recommendation: Recommendation) => void;
  removeRecommendation: (recommendationId: string) => void;
};

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

interface Recommendation {
  id: string;
  book_id: string;
  metadata: {
    title: string;
    description: string;
    url: string;
    image_filename?: string;
  };
  reasoning: string;
}

const BookContext = createContext<BookContextType | undefined>(undefined);

// Helper functions to safely parse JSON
const safeParseString = (
  value: string | null,
  defaultValue: string | null
): string | null => {
  if (!value) return defaultValue;
  try {
    // First try to parse as JSON
    const parsed = JSON.parse(value);
    // If it's already a string, return it directly
    if (typeof parsed === 'string') return parsed;
    // If it's not a string, stringify it
    return JSON.stringify(parsed);
  } catch {
    // If parsing fails, assume it's a plain string and return it directly
    return value;
  }
};

const safeParseSurveyResponse = (
  value: string | null,
  defaultValue: SurveyResponse | null
): SurveyResponse | null => {
  if (!value) return defaultValue;
  try {
    return JSON.parse(value);
  } catch (error) {
    console.error('Error parsing JSON from localStorage:', {
      error,
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      value,
      key: 'surveyResponses',
      defaultValue,
    });
    return defaultValue;
  }
};

export function BookProvider({ children }: { children: ReactNode }) {
  // Initialize state from localStorage if available
  const [coverDescription, setCoverDescription] = useState<string | null>(
    () => {
      if (typeof window !== 'undefined') {
        const value = localStorage.getItem('coverDescription');
        return safeParseString(value, null);
      }
      return null;
    }
  );

  const [surveyResponses, setSurveyResponses] = useState<SurveyResponse | null>(
    () => {
      if (typeof window !== 'undefined') {
        const value = localStorage.getItem('surveyResponses');
        return safeParseSurveyResponse(value, null);
      }
      return null;
    }
  );

  const [sessionId, setSessionId] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      const value = localStorage.getItem('sessionId');
      return safeParseString(value, null);
    }
    return null;
  });

  const [descriptionId, setDescriptionId] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      const value = localStorage.getItem('descriptionId');
      return safeParseString(value, null);
    }
    return null;
  });

  const [searchResults, setSearchResults] = useState<SearchResult[] | null>(
    () => {
      if (typeof window !== 'undefined') {
        const value = localStorage.getItem('searchResults');
        return value ? JSON.parse(value) : null;
      }
      return null;
    }
  );

  const [readBooks, setReadBooks] = useState<Set<string>>(() => {
    if (typeof window !== 'undefined') {
      const value = localStorage.getItem('readBooks');
      return value ? new Set(JSON.parse(value)) : new Set();
    }
    return new Set();
  });

  const [recommendations, setRecommendations] = useState<
    Recommendation[] | null
  >(null);

  // Update localStorage when state changes
  const handleSetCoverDescription = (description: string) => {
    setCoverDescription(description);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('coverDescription', JSON.stringify(description));
      } catch (error) {
        console.error('Error setting coverDescription in localStorage:', {
          error,
          message: error instanceof Error ? error.message : 'Unknown error',
          stack: error instanceof Error ? error.stack : undefined,
          description,
        });
      }
    }
  };

  const handleSetSurveyResponses = (responses: SurveyResponse) => {
    setSurveyResponses(responses);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('surveyResponses', JSON.stringify(responses));
      } catch (error) {
        console.error('Error setting surveyResponses in localStorage:', {
          error,
          message: error instanceof Error ? error.message : 'Unknown error',
          stack: error instanceof Error ? error.stack : undefined,
          responses,
        });
      }
    }
  };

  const handleSetSessionId = (id: string) => {
    setSessionId(id);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('sessionId', JSON.stringify(id));
      } catch (error) {
        console.error('Error setting sessionId in localStorage:', {
          error,
          message: error instanceof Error ? error.message : 'Unknown error',
          stack: error instanceof Error ? error.stack : undefined,
          id,
        });
      }
    }
  };

  const handleSetDescriptionId = (id: string) => {
    setDescriptionId(id);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('descriptionId', JSON.stringify(id));
      } catch (error) {
        console.error('Error setting descriptionId in localStorage:', {
          error,
          message: error instanceof Error ? error.message : 'Unknown error',
          stack: error instanceof Error ? error.stack : undefined,
          id,
        });
      }
    }
  };

  const handleSetSearchResults = (results: SearchResult[]) => {
    setSearchResults(results);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('searchResults', JSON.stringify(results));
      } catch (error) {
        console.error('Error setting searchResults in localStorage:', {
          error,
          message: error instanceof Error ? error.message : 'Unknown error',
          stack: error instanceof Error ? error.stack : undefined,
          results,
        });
      }
    }
  };

  const handleSetReadBooks = (books: Set<string>) => {
    setReadBooks(books);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('readBooks', JSON.stringify(Array.from(books)));
      } catch (error) {
        console.error('Error setting readBooks in localStorage:', {
          error,
          message: error instanceof Error ? error.message : 'Unknown error',
          stack: error instanceof Error ? error.stack : undefined,
          books,
        });
      }
    }
  };

  const addRecommendation = (recommendation: Recommendation) => {
    setRecommendations(prev => {
      if (!prev) return [recommendation];
      return [...prev, recommendation];
    });
  };

  const removeRecommendation = (recommendationId: string) => {
    setRecommendations(prev => {
      if (!prev) return null;
      return prev.filter(r => r.id !== recommendationId);
    });
  };

  const resetSession = () => {
    // Clear all state
    setCoverDescription(null);
    setSurveyResponses(null);
    setSessionId(null);
    setDescriptionId(null);
    setSearchResults(null);
    setReadBooks(new Set());
    setRecommendations(null);

    // Clear localStorage
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem('coverDescription');
        localStorage.removeItem('surveyResponses');
        localStorage.removeItem('sessionId');
        localStorage.removeItem('descriptionId');
        localStorage.removeItem('searchResults');
        localStorage.removeItem('readBooks');
        localStorage.removeItem('recommendations');
      } catch (error) {
        console.error('Error clearing localStorage:', {
          error,
          message: error instanceof Error ? error.message : 'Unknown error',
          stack: error instanceof Error ? error.stack : undefined,
        });
      }
    }
  };

  return (
    <BookContext.Provider
      value={{
        coverDescription,
        setCoverDescription: handleSetCoverDescription,
        surveyResponses,
        setSurveyResponses: handleSetSurveyResponses,
        sessionId,
        setSessionId: handleSetSessionId,
        descriptionId,
        setDescriptionId: handleSetDescriptionId,
        searchResults,
        setSearchResults: handleSetSearchResults,
        readBooks,
        setReadBooks: handleSetReadBooks,
        resetSession,
        recommendations,
        setRecommendations,
        addRecommendation,
        removeRecommendation,
      }}
    >
      {children}
    </BookContext.Provider>
  );
}

export function useBook() {
  const context = useContext(BookContext);
  if (context === undefined) {
    throw new Error('useBook must be used within a BookProvider');
  }
  return context;
}
