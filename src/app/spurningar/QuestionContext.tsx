import {
  createContext,
  useContext,
  useState,
  ReactNode,
  Dispatch,
  SetStateAction,
} from 'react';
import { Question, FormValues } from './types';

interface QuestionContextType {
  questions: Question[];
  setQuestions: Dispatch<SetStateAction<Question[]>>;
  currentStep: number;
  setCurrentStep: Dispatch<SetStateAction<number>>;
  answers: FormValues;
  setAnswers: Dispatch<SetStateAction<FormValues>>;
  hasGeneratedQuestions: boolean;
  setHasGeneratedQuestions: Dispatch<SetStateAction<boolean>>;
  isLoadingMore: boolean;
  setIsLoadingMore: Dispatch<SetStateAction<boolean>>;
}

const QuestionContext = createContext<QuestionContextType | undefined>(
  undefined
);

export function QuestionProvider({
  children,
  initialQuestions,
}: {
  children: ReactNode;
  initialQuestions: Question[];
}) {
  const [questions, setQuestions] = useState<Question[]>(initialQuestions);
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [answers, setAnswers] = useState<FormValues>({});
  const [hasGeneratedQuestions, setHasGeneratedQuestions] =
    useState<boolean>(false);
  const [isLoadingMore, setIsLoadingMore] = useState<boolean>(false);

  return (
    <QuestionContext.Provider
      value={{
        questions,
        setQuestions,
        currentStep,
        setCurrentStep,
        answers,
        setAnswers,
        hasGeneratedQuestions,
        setHasGeneratedQuestions,
        isLoadingMore,
        setIsLoadingMore,
      }}
    >
      {children}
    </QuestionContext.Provider>
  );
}

export function useQuestionContext() {
  const context = useContext(QuestionContext);
  if (context === undefined) {
    throw new Error(
      'useQuestionContext must be used within a QuestionProvider'
    );
  }
  return context;
}
