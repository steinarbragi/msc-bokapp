'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { Question, FormValues } from './types';
import { ProgressBar } from '@/components/ProgressBar';
import { StepButtons } from '@/components/StepButtons';
import { QuestionContent } from '@/components/QuestionContent';
import { NavigationButtons } from '@/components/NavigationButtons';
import Loader from '@/components/loader';
import Link from 'next/link';
import { useQuestionContext } from './QuestionContext';

interface SurveyProps {
  questions: Question[];
  onComplete?: (answers: Record<string, string | string[]>) => void;
  submitButtonText?: string;
}

export default function Questions({
  questions: initialQuestions,
  onComplete,
  submitButtonText = 'Fá bókameðmæli',
}: SurveyProps) {
  const {
    questions,
    setQuestions,
    currentStep,
    setCurrentStep,
    hasGeneratedQuestions,
    setHasGeneratedQuestions,
    isLoadingMore,
    setIsLoadingMore,
  } = useQuestionContext();

  const { control, watch } = useForm<FormValues>({
    defaultValues: {},
  });
  const [isLoading, setIsLoading] = useState(false);

  const safeCurrentStep = Math.min(currentStep, questions.length - 1);
  const currentQuestion = questions[safeCurrentStep];
  const isLastQuestion = safeCurrentStep === questions.length - 1;
  const isLastInitialQuestion = safeCurrentStep === initialQuestions.length - 1;

  const formAnswers = watch();
  const hasValidAnswers = Object.keys(formAnswers).every(key => {
    const answer = formAnswers[key as keyof FormValues];
    return answer && (!Array.isArray(answer) || answer.length > 0);
  });

  const hasAnsweredAllQuestions =
    Object.keys(formAnswers).length === questions.length;
  const isComplete = hasValidAnswers && hasAnsweredAllQuestions;

  const onSubmit = (data: FormValues) => {
    if (isLastInitialQuestion && !hasGeneratedQuestions) {
      generateMoreQuestions();
      return;
    }

    if (onComplete) {
      if (Object.keys(data).length < questions.length) {
        return;
      }

      const transformedAnswers = Object.entries(data).reduce(
        (acc, [key, value]) => {
          const questionIndex = parseInt(key.replace(/\D/g, ''), 10) - 1;
          if (questionIndex >= 0 && questionIndex < questions.length) {
            const questionKey = questions[questionIndex].key;
            acc[questionKey] = value;
          }
          return acc;
        },
        {} as Record<string, string | string[]>
      );

      setIsLoading(true);
      onComplete(transformedAnswers);
    }
  };

  const handleNextStep = async (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
    }

    if (isLastInitialQuestion && !hasGeneratedQuestions) {
      generateMoreQuestions();
      return;
    }

    if (isLastQuestion && hasGeneratedQuestions && isComplete) {
      const formData = watch();
      onSubmit(formData);
      return;
    }

    const nextStep = Math.min(currentStep + 1, questions.length - 1);
    setCurrentStep(nextStep);
  };

  const generateMoreQuestions = async () => {
    if (isLoadingMore) return;

    try {
      setIsLoadingMore(true);

      const transformedAnswers = Object.entries(formAnswers).reduce(
        (acc, [key, value]) => {
          const questionIndex = parseInt(key.replace(/\D/g, ''), 10) - 1;
          if (questionIndex >= 0 && questionIndex < questions.length) {
            const questionKey = questions[questionIndex].key;
            acc[questionKey] = value;
          }
          return acc;
        },
        {} as Record<string, string | string[]>
      );

      const response = await fetch('/api/survey/questions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ surveyResponses: transformedAnswers }),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch additional questions');
      }

      const data = await response.json();

      if (data.success && data.questions) {
        const questionsToUse = Array.isArray(data.questions)
          ? data.questions
          : [data.questions];

        const validQuestions = questionsToUse.filter(
          (q: Question) =>
            q &&
            typeof q.text === 'string' &&
            typeof q.type === 'string' &&
            Array.isArray(q.options) &&
            q.options.length >= 2
        );

        if (validQuestions.length === 0) {
          console.log('No valid questions found in response:', data);
          const fallbackQuestions = [
            {
              id: questions.length + 1,
              text: 'Hvaða tegund af sögu myndir þú vilja lesa?',
              type: 'single-choice',
              options: [
                'Ævintýri',
                'Spennusaga',
                'Rómantík',
                'Vísindaskáldskapur',
                'Fantasía',
              ],
              allowTextInput: false,
              key: 'fallback1',
            },
            {
              id: questions.length + 2,
              text: 'Hversu löng ætti sagan að vera?',
              type: 'single-choice',
              options: [
                'Stutt saga (undir 10 mínútur)',
                'Miðlungs (10-20 mínútur)',
                'Löng saga (yfir 20 mínútur)',
              ],
              allowTextInput: false,
              key: 'fallback2',
            },
          ] as Question[];

          setHasGeneratedQuestions(true);
          setQuestions((prev: Question[]) => [...prev, ...fallbackQuestions]);
          setIsLoadingMore(false);
          setCurrentStep(initialQuestions.length);
          return;
        }

        const newQuestions = validQuestions.map(
          (q: Question, index: number) => ({
            ...q,
            id: questions.length + index + 1,
            key: q.key || `question${questions.length + index + 1}`,
            type: q.type || 'single-choice',
          })
        ) as Question[];

        setHasGeneratedQuestions(true);
        setQuestions((prev: Question[]) => [...prev, ...newQuestions]);
        setIsLoadingMore(false);
        setCurrentStep(initialQuestions.length);
      } else {
        setHasGeneratedQuestions(true);
        setIsLoadingMore(false);
      }
    } catch (error) {
      setHasGeneratedQuestions(true);
      setIsLoadingMore(false);
      console.error('Error generating questions:', error);
    }
  };

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    if (isLoadingMore) {
      timeoutId = setTimeout(() => {
        setIsLoadingMore(false);
        setHasGeneratedQuestions(true);
      }, 15000);
    }
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [isLoadingMore, setIsLoadingMore, setHasGeneratedQuestions]);

  if (isLoading) {
    return (
      <div className='flex min-h-screen flex-col items-center justify-center pb-48'>
        <Loader />
        <p className='pt-5 text-center text-lg'>Bókavélin er að hugsa</p>
      </div>
    );
  }

  if (isLoadingMore) {
    return (
      <div className='flex min-h-screen flex-col items-center justify-center pb-48'>
        <Loader />
        <p className='pt-5 text-center text-lg'>
          Bókavélin er að búa til fleiri spurningar
        </p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className='mx-auto max-w-2xl'
    >
      <form
        onSubmit={e => {
          e.preventDefault();
          if (isLastQuestion && !hasGeneratedQuestions) {
            handleNextStep();
            return false;
          }
          if (isComplete) {
            const formData = watch();
            onSubmit(formData);
          } else {
            handleNextStep();
          }
          return false;
        }}
      >
        <ProgressBar currentStep={currentStep} totalSteps={questions.length} />
        <div className='mb-8 flex items-center justify-between'>
          <StepButtons
            questions={questions}
            currentStep={currentStep}
            answers={formAnswers}
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
              name={currentQuestion.key}
            />

            <NavigationButtons
              isLastQuestion={isLastQuestion}
              isComplete={isComplete}
              isLoading={isLoading || isLoadingMore}
              currentAnswer={watch(`question${currentQuestion.id}`)}
              onNextStep={
                isLastInitialQuestion && !hasGeneratedQuestions
                  ? generateMoreQuestions
                  : handleNextStep
              }
              submitButtonText={
                isLastInitialQuestion && !hasGeneratedQuestions
                  ? 'Fá fleiri spurningar'
                  : submitButtonText
              }
            />
          </motion.div>
        </AnimatePresence>
      </form>
    </motion.div>
  );
}
