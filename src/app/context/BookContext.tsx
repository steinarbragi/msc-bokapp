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
};

const BookContext = createContext<BookContextType | undefined>(undefined);

export function BookProvider({ children }: { children: ReactNode }) {
  const [coverDescription, setCoverDescription] = useState<string | null>(null);
  const [surveyResponses, setSurveyResponses] = useState<SurveyResponse | null>(
    null
  );
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [descriptionId, setDescriptionId] = useState<string | null>(null);

  return (
    <BookContext.Provider
      value={{
        coverDescription,
        setCoverDescription,
        surveyResponses,
        setSurveyResponses,
        sessionId,
        setSessionId,
        descriptionId,
        setDescriptionId,
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
