'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { Question, FormValues } from '../types';
import { ProgressBar } from '@/components/ProgressBar';
import { StepButtons } from '@/components/StepButtons';
import { QuestionContent } from '@/components/QuestionContent';
import { NavigationButtons } from '@/components/NavigationButtons';
import Loader from '@/components/loader';
import Link from 'next/link';

interface SurveyProps {
  questions: Question[];
  onComplete?: (answers: Record<string, string | string[]>) => void;
  submitButtonText?: string;
}

export default function Survey({
  questions,
  onComplete,
  submitButtonText = 'Áfram',
}: SurveyProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const { control, handleSubmit, watch } = useForm<FormValues>({
    defaultValues: {},
  });
  const [isLoading, setIsLoading] = useState(false);
  const currentQuestion = questions[currentStep];
  const isLastQuestion = currentStep === questions.length - 1;
  const answers = watch();
  const hasValidAnswers = Object.keys(answers).every(key => {
    const answer = answers[key as keyof FormValues];
    // Check if answer exists and is either a non-empty string or non-empty array
    const isValidAnswer =
      answer && (!Array.isArray(answer) || answer.length > 0);
    return isValidAnswer;
  });

  const hasAnsweredAllQuestions =
    Object.keys(answers).length === questions.length;

  const isComplete = hasValidAnswers && hasAnsweredAllQuestions;

  // Handle browser back button
  useEffect(() => {
    const handlePopState = (e: PopStateEvent) => {
      e.preventDefault();
      if (currentStep > 0) {
        setCurrentStep(currentStep - 1);
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [currentStep]);

  const onSubmit = (data: FormValues) => {
    if (onComplete) {
      const transformedAnswers = Object.entries(data).reduce(
        (acc, [, value], index) => {
          const questionKey = questions[index].key;
          acc[questionKey] = value;
          return acc;
        },
        {} as Record<string, string | string[]>
      );

      setIsLoading(true);
      onComplete(transformedAnswers);
    }
  };

  const handleNextStep = (e?: React.MouseEvent) => {
    // Prevent default form submission if this is a button click
    if (e) {
      e.preventDefault();
    }

    // Only submit if we're on the last question or the form is complete
    if (isLastQuestion || isComplete) {
      handleSubmit(onSubmit)();
    } else {
      const nextStep = currentStep + 1;
      setCurrentStep(nextStep);
      // Add to history without changing URL
      window.history.pushState(
        { step: nextStep },
        '',
        window.location.pathname
      );
    }
  };

  // Initialize history state
  useEffect(() => {
    window.history.replaceState(
      { step: currentStep },
      '',
      window.location.pathname
    );
  }, [currentStep]);

  if (isLoading) {
    return (
      <div className='flex min-h-screen flex-col items-center justify-center pb-48'>
        <Loader />
        <p className='pt-5 text-center text-lg'>Bókavélin er að hugsa</p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className='mx-auto max-w-2xl px-4 sm:px-6'
    >
      <form onSubmit={handleSubmit(onSubmit)}>
        <ProgressBar currentStep={currentStep} totalSteps={questions.length} />
        <div className='mb-4 flex items-center justify-between sm:mb-8'>
          <StepButtons
            questions={questions}
            currentStep={currentStep}
            answers={answers}
            onStepClick={setCurrentStep}
          />
          <Link
            href='/'
            className='inline-flex items-center justify-center rounded-full border-2 border-purple-400 px-6 py-3 font-medium text-purple-500 shadow-md transition-all hover:bg-purple-50 hover:shadow-lg active:bg-purple-100 active:shadow-inner'
          >
            <span className='text-center'>Aftur á forsíðu</span>
          </Link>
        </div>

        <AnimatePresence mode='wait'>
          <motion.div
            key={currentStep}
            initial={{ x: 50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -50, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className='transform rounded-2xl border-2 border-purple-200 bg-white p-4 shadow-xl sm:rounded-3xl sm:border-4 sm:p-8'
          >
            <motion.h1
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className='mb-4 bg-clip-text text-2xl font-bold text-indigo-600 sm:mb-6 sm:text-3xl'
            >
              {currentQuestion.text}
            </motion.h1>

            <QuestionContent
              question={currentQuestion}
              control={control}
              onNextStep={handleNextStep}
              name={currentQuestion.key}
            />

            <NavigationButtons
              isLastQuestion={isLastQuestion}
              isComplete={isComplete}
              isLoading={isLoading}
              currentAnswer={answers[currentQuestion.key]}
              onNextStep={handleNextStep}
              submitButtonText={submitButtonText}
            />
          </motion.div>
        </AnimatePresence>
      </form>
    </motion.div>
  );
}
