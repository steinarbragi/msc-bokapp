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
import { useQuestionContext } from './QuestionContext';
import { useBook } from '../context/BookContext';
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

  const { sessionId } = useBook();

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
      // Only check if answered questions have valid answers
      const answeredQuestions = Object.keys(data);
      const hasValidAnsweredQuestions = answeredQuestions.every(key => {
        const answer = data[key as keyof FormValues];
        return answer && (!Array.isArray(answer) || answer.length > 0);
      });

      if (!hasValidAnsweredQuestions && !isComplete && !isLastQuestion) {
        return;
      }

      // Include all answers, not just those from initial questions
      const transformedAnswers = Object.entries(data).reduce(
        (acc, [key, value]) => {
          acc[key] = value;
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

    if ((isLastQuestion || isComplete) && hasGeneratedQuestions) {
      const formData = watch();
      onSubmit(formData);
      return;
    }

    const nextStep = Math.min(currentStep + 1, questions.length - 1);
    setCurrentStep(nextStep);
  };

  useEffect(() => {
    // Remove these debug logs:
    // console.log('isLastQuestion', isLastQuestion);
    // console.log('hasGeneratedQuestions', hasGeneratedQuestions);
    // console.log('isComplete', isComplete);
  }, [isLastQuestion, hasGeneratedQuestions, isComplete]);

  const generateMoreQuestions = async () => {
    if (isLoadingMore) return;

    if (!sessionId) {
      console.error('No session ID available');
      return;
    }

    try {
      setIsLoadingMore(true);

      const transformedAnswers = Object.entries(formAnswers).reduce(
        (acc, [key, value]) => {
          // Include all answers, not just those with matching question keys
          acc[key] = value;
          return acc;
        },
        {} as Record<string, string | string[]>
      );

      // Keep this log for debugging API requests
      console.log('Sending to API:', {
        sessionId,
        surveyResponses: transformedAnswers,
      });

      // Store all answers in question_responses
      const response = await fetch('/api/survey/questions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          surveyResponses: transformedAnswers,
          sessionId,
        }),
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
          // Remove debug log
          // console.log('No valid questions found in response:', data);
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
              key: 'fallback-story-type',
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
              key: 'fallback-story-length',
            },
          ] as Question[];

          setHasGeneratedQuestions(true);
          setQuestions((prev: Question[]) => [...prev, ...fallbackQuestions]);
          setCurrentStep(initialQuestions.length);
          setIsLoadingMore(false);
          return;
        }

        const newQuestions = validQuestions.map(
          (q: Question, index: number) => ({
            ...q,
            id: questions.length + index + 1,
            key: q.key || `generated-question-${index + 1}`,
            type: q.type || 'single-choice',
          })
        ) as Question[];

        setHasGeneratedQuestions(true);
        setQuestions((prev: Question[]) => [...prev, ...newQuestions]);
        setCurrentStep(initialQuestions.length);
        setIsLoadingMore(false);
      } else {
        throw new Error('Invalid response format');
      }
    } catch (error) {
      console.error('Error generating questions:', error);
      setIsLoadingMore(false);
      // You might want to show an error message to the user here
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
        <p className='pt-5 text-center text-lg'>
          Bókavélin er að leita að bókum. Þetta gæti tekið smá tíma.
        </p>
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
      className='mx-auto max-w-2xl px-4 sm:px-6'
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
        <div className='mb-4 flex items-center justify-between sm:mb-8'>
          <StepButtons
            questions={questions}
            currentStep={currentStep}
            answers={formAnswers}
            onStepClick={setCurrentStep}
          />
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
              className='mb-4 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-2xl font-bold text-transparent sm:mb-6 sm:text-3xl'
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
              currentAnswer={watch(currentQuestion.key)}
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
