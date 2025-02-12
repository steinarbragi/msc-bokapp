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
  const isComplete =
    Object.keys(answers).every(key => {
      const answer = answers[key as keyof FormValues];
      return answer && (!Array.isArray(answer) || answer.length > 0);
    }) && Object.keys(answers).length === questions.length;

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
      <StepButtons
        questions={questions}
        currentStep={currentStep}
        answers={answers}
        onStepClick={setCurrentStep}
      />

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
            className='mb-6 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-2xl font-bold text-transparent'
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
