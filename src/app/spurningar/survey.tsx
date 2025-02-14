'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { Question, FormValues } from './types';
import { ProgressBar } from './components/ProgressBar';
import { StepButtons } from './components/StepButtons';
import { QuestionContent } from './components/QuestionContent';
import { NavigationButtons } from './components/NavigationButtons';
import Link from 'next/link';

interface SurveyProps {
  questions: Question[];
  onComplete?: (answers: Record<number, string | string[]>) => void;
  nextPageUrl?: string;
  nextPageButtonText?: string;
}

export default function Survey({
  questions,
  onComplete,
  nextPageUrl = '/search',
  nextPageButtonText = 'Áfram',
}: SurveyProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const router = useRouter();

  const { control, handleSubmit, watch } = useForm<FormValues>({
    defaultValues: {},
  });

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

  const onSubmit = (data: FormValues) => {
    if (onComplete) {
      const transformedAnswers = Object.entries(data).reduce(
        (acc, [key, value]) => {
          const id = parseInt(key.replace('question', ''));
          acc[id] = value;
          return acc;
        },
        {} as Record<number, string | string[]>
      );

      onComplete(transformedAnswers);
      router.push(nextPageUrl);
    }
  };

  const handleNextStep = () => {
    if (!isLastQuestion) {
      setCurrentStep(prev => prev + 1);
    } else {
      handleSubmit(onSubmit)();
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className='mx-auto max-w-2xl'
    >
      <ProgressBar currentStep={currentStep} totalSteps={questions.length} />
      <div className='mb-8 flex items-center justify-between'>
        <StepButtons
          questions={questions}
          currentStep={currentStep}
          answers={answers}
          onStepClick={setCurrentStep}
        />

        <Link href='/'>
          <button className='rounded-xl border-2 border-purple-300 bg-purple-50 px-4 py-2 text-center text-purple-700 transition-all hover:scale-105 hover:border-purple-400 hover:bg-purple-100'>
            Aftur á forsíðu
          </button>
        </Link>
      </div>

      <AnimatePresence mode='wait'>
        <motion.div
          key={currentStep}
          initial={{ x: 50, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: -50, opacity: 0 }}
          transition={{ duration: 0.3 }}
          className='transform rounded-3xl border-4 border-purple-200 bg-white p-8 shadow-xl'
        >
          <motion.h1
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className='mb-6 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-3xl font-bold text-transparent'
          >
            {currentQuestion.text}
          </motion.h1>

          <QuestionContent
            question={currentQuestion}
            control={control}
            onNextStep={handleNextStep}
          />

          <NavigationButtons
            isLastQuestion={isLastQuestion}
            isComplete={isComplete}
            currentAnswer={answers[`question${currentQuestion.id}`]}
            onNextStep={handleNextStep}
            nextPageUrl={nextPageUrl}
            nextPageButtonText={nextPageButtonText}
          />
        </motion.div>
      </AnimatePresence>
    </motion.div>
  );
}
