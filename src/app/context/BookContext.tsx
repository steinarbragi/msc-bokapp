'use client';

import { createContext, useContext, useState, ReactNode } from 'react';

interface BookContextType {
  coverDescription: string;
  setCoverDescription: (description: string) => void;
}

const BookContext = createContext<BookContextType | undefined>(undefined);

export function BookProvider({ children }: { children: ReactNode }) {
  const [coverDescription, setCoverDescription] = useState('');

  return (
    <BookContext.Provider value={{ coverDescription, setCoverDescription }}>
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
