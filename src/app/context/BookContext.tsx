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
  resetSession: () => void;
};

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
        console.log('Loading coverDescription from localStorage:', value);
        return safeParseString(value, null);
      }
      return null;
    }
  );

  const [surveyResponses, setSurveyResponses] = useState<SurveyResponse | null>(
    () => {
      if (typeof window !== 'undefined') {
        const value = localStorage.getItem('surveyResponses');
        console.log('Loading surveyResponses from localStorage:', value);
        return safeParseSurveyResponse(value, null);
      }
      return null;
    }
  );

  const [sessionId, setSessionId] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      const value = localStorage.getItem('sessionId');
      console.log('Loading sessionId from localStorage:', value);
      return safeParseString(value, null);
    }
    return null;
  });

  const [descriptionId, setDescriptionId] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      const value = localStorage.getItem('descriptionId');
      console.log('Loading descriptionId from localStorage:', value);
      return safeParseString(value, null);
    }
    return null;
  });

  // Update localStorage when state changes
  const handleSetCoverDescription = (description: string) => {
    setCoverDescription(description);
    if (typeof window !== 'undefined') {
      try {
        const value = JSON.stringify(description);
        console.log('Saving coverDescription to localStorage:', value);
        localStorage.setItem('coverDescription', value);
      } catch (error) {
        console.error('Error saving coverDescription to localStorage:', {
          error,
          description,
        });
      }
    }
  };

  const handleSetSurveyResponses = (responses: SurveyResponse) => {
    setSurveyResponses(responses);
    if (typeof window !== 'undefined') {
      try {
        const value = JSON.stringify(responses);
        console.log('Saving surveyResponses to localStorage:', value);
        localStorage.setItem('surveyResponses', value);
      } catch (error) {
        console.error('Error saving surveyResponses to localStorage:', {
          error,
          responses,
        });
      }
    }
  };

  const handleSetSessionId = (id: string) => {
    setSessionId(id);
    if (typeof window !== 'undefined') {
      try {
        const value = JSON.stringify(id);
        console.log('Saving sessionId to localStorage:', value);
        localStorage.setItem('sessionId', value);
      } catch (error) {
        console.error('Error saving sessionId to localStorage:', {
          error,
          id,
        });
      }
    }
  };

  const handleSetDescriptionId = (id: string) => {
    setDescriptionId(id);
    if (typeof window !== 'undefined') {
      try {
        const value = JSON.stringify(id);
        console.log('Saving descriptionId to localStorage:', value);
        localStorage.setItem('descriptionId', value);
      } catch (error) {
        console.error('Error saving descriptionId to localStorage:', {
          error,
          id,
        });
      }
    }
  };

  const resetSession = () => {
    // Clear all state
    setCoverDescription(null);
    setSurveyResponses(null);
    setSessionId(null);
    setDescriptionId(null);

    // Clear localStorage
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem('coverDescription');
        localStorage.removeItem('surveyResponses');
        localStorage.removeItem('sessionId');
        localStorage.removeItem('descriptionId');
      } catch (error) {
        console.error('Error clearing localStorage:', error);
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
        resetSession,
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
