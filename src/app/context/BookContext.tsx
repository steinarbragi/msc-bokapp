'use client';

import { createContext, useContext, useState, ReactNode } from 'react';

interface BookContextType {
  coverDescription: string;
  setCoverDescription: (description: string) => void;
  surveyResponses: Record<string, string | string[]>;
  setSurveyResponses: (responses: Record<string, string | string[]>) => void;
}

const BookContext = createContext<BookContextType | undefined>(undefined);

export function BookProvider({ children }: { children: ReactNode }) {
  const [coverDescription, setCoverDescription] = useState('');
  const [surveyResponses, setSurveyResponses] = useState<
    Record<string, string | string[]>
  >({});

  return (
    <BookContext.Provider
      value={{
        coverDescription,
        setCoverDescription,
        surveyResponses,
        setSurveyResponses,
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
