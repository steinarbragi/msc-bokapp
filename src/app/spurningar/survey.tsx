'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { Question, FormValues } from './types';
import { ProgressBar } from './components/ProgressBar';
import { StepButtons } from './components/StepButtons';
import { QuestionContent } from './components/QuestionContent';
import { NavigationButtons } from './components/NavigationButtons';
import Loader from '@/components/loader';
import Link from 'next/link';

interface SurveyProps {
  questions: Question[];
  onComplete?: (answers: Record<string, string | string[]>) => void;
  submitButtonText?: string;
}

export default function Survey({
  questions: initialQuestions,
  onComplete,
  submitButtonText = 'Áfram',
}: SurveyProps) {
  const [questions, setQuestions] = useState(initialQuestions);
  const [currentStep, setCurrentStep] = useState(0);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const { control, handleSubmit, watch } = useForm<FormValues>({
    defaultValues: {},
  });
  const [isLoading, setIsLoading] = useState(false);
  const [hasGeneratedQuestions, setHasGeneratedQuestions] = useState(false);
  const [debugInfo, setDebugInfo] = useState<{
    success: boolean;
    questions?: Question[];
    error?: string;
  } | null>(null);

  // Safety check for current question
  const safeCurrentStep = Math.min(currentStep, questions.length - 1);
  const currentQuestion = questions[safeCurrentStep];
  const isLastQuestion = safeCurrentStep === questions.length - 1;

  // Check if we're at the last question of the initial set
  const isLastInitialQuestion = safeCurrentStep === initialQuestions.length - 1;

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
    // Don't submit if we're on the last question of the initial set and haven't generated questions yet
    if (
      safeCurrentStep === initialQuestions.length - 1 &&
      !hasGeneratedQuestions
    ) {
      console.log('Preventing submission to generate more questions first');
      generateMoreQuestions();
      return;
    }

    if (onComplete) {
      // Make sure we have answers for all questions
      if (Object.keys(data).length < questions.length) {
        console.warn('Not all questions have been answered');
        alert('Please answer all questions before submitting.');
        return;
      }

      const transformedAnswers = Object.entries(data).reduce(
        (acc, [key, value]) => {
          // Find the corresponding question by index or ID
          const questionIndex = parseInt(key.replace(/\D/g, ''), 10) - 1;
          if (questionIndex >= 0 && questionIndex < questions.length) {
            const questionKey = questions[questionIndex].key;
            acc[questionKey] = value;
          }
          return acc;
        },
        {} as Record<string, string | string[]>
      );

      console.log('Submitting form with answers:', transformedAnswers);
      setIsLoading(true);
      onComplete(transformedAnswers);
    }
  };

  // Add an effect to detect when we reach the last initial question
  useEffect(() => {
    if (isLastInitialQuestion && !hasGeneratedQuestions && !isLoadingMore) {
      console.log(
        'Reached last initial question, will generate more questions on next'
      );
    }
  }, [isLastInitialQuestion, hasGeneratedQuestions, isLoadingMore]);

  const handleNextStep = async (e?: React.MouseEvent) => {
    // Prevent default form submission if this is a button click
    if (e) {
      e.preventDefault();
    }

    console.log(
      'Current step:',
      currentStep,
      'Total questions:',
      questions.length
    );
    console.log('Is last question:', isLastQuestion);
    console.log('Is complete:', isComplete);
    console.log('Has generated questions:', hasGeneratedQuestions);

    // If we're on the last initial question and haven't generated questions yet, try to get more
    if (isLastInitialQuestion && !hasGeneratedQuestions) {
      // Use the dedicated function to generate more questions
      generateMoreQuestions();
      return;
    }

    // If we're on the last question, have already generated questions, and the form is complete
    if (isLastQuestion && hasGeneratedQuestions && isComplete) {
      console.log('On last question with generated questions, submitting form');
      handleSubmit(onSubmit)();
      return;
    }

    // If not the last question, just move to the next step
    console.log('Moving to next step');
    setCurrentStep(prev => prev + 1);
  };

  // Function to generate more questions
  const generateMoreQuestions = async () => {
    if (isLoadingMore) return;

    try {
      setIsLoadingMore(true);
      console.log('Manually generating more questions...');

      // Transform the current answers to the format expected by the API
      const transformedAnswers = Object.entries(answers).reduce(
        (acc, [key, value]) => {
          // Find the corresponding question to get its key
          const questionIndex = parseInt(key.replace(/\D/g, ''), 10) - 1;
          if (questionIndex >= 0 && questionIndex < questions.length) {
            const questionKey = questions[questionIndex].key;
            acc[questionKey] = value;
          }
          return acc;
        },
        {} as Record<string, string | string[]>
      );

      console.log('Sending answers to API:', transformedAnswers);

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
      console.log('API response:', data);
      setDebugInfo(data);

      // Log the raw questions data to help debug
      console.log(
        'Raw questions data:',
        JSON.stringify(data.questions, null, 2)
      );

      if (data.success) {
        // Check if we have questions in the response
        let questionsToUse: Partial<Question>[] = [];

        // Try to extract questions from the response
        if (data.questions) {
          // If questions is an array of objects with type 'tool_use'
          if (
            Array.isArray(data.questions) &&
            data.questions.length > 0 &&
            data.questions[0].type === 'tool_use' &&
            data.questions[0].input &&
            Array.isArray(data.questions[0].input.questions)
          ) {
            console.log('Found tool_use format in questions array');
            const rawQuestions = data.questions[0].input.questions;
            questionsToUse = rawQuestions;
          }
          // If questions is a direct array of question objects
          else if (Array.isArray(data.questions)) {
            console.log('Found direct array of questions');
            questionsToUse = data.questions;
          }
          // If questions is a single object
          else {
            console.log('Found single question object');
            questionsToUse = [data.questions];
          }
        }

        console.log('Questions to use:', questionsToUse);

        // Ensure questions is an array
        const questionsArray = Array.isArray(questionsToUse)
          ? questionsToUse
          : [questionsToUse];
        console.log('Questions array after conversion:', questionsArray);

        // Validate and transform the questions with more lenient validation
        const validQuestions = questionsArray.filter(q => {
          // Log each question for debugging
          console.log('Validating question:', q);

          // Check if the question has the minimum required fields
          const isValid =
            q &&
            typeof q.text === 'string' &&
            typeof q.type === 'string' &&
            Array.isArray(q.options) &&
            q.options.length >= 2;

          // Log validation details
          if (!q) console.log('Question is null or undefined');
          else if (!q.text) console.log('Question has no text');
          else if (!q.type) console.log('Question has no type');
          else if (!Array.isArray(q.options))
            console.log('Question options is not an array');
          else if (q.options.length < 2)
            console.log('Question has fewer than 2 options');

          console.log('Is question valid:', isValid);
          return isValid;
        });

        console.log('Valid questions after filtering:', validQuestions);

        if (validQuestions.length === 0) {
          console.error('No valid questions returned from API');

          // Create fallback questions if none were valid
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

          console.log('Using fallback questions:', fallbackQuestions);

          // First mark that we've generated questions to prevent loops
          setHasGeneratedQuestions(true);

          // Then update questions
          setQuestions(prevQuestions => {
            const updatedQuestions = [...prevQuestions, ...fallbackQuestions];
            console.log(
              'Updated questions array with fallbacks:',
              updatedQuestions
            );
            return updatedQuestions;
          });

          // Clear loading state
          setIsLoadingMore(false);

          // Show success message with a delay to ensure state updates have been applied
          setTimeout(() => {
            alert('Using default follow-up questions. Click OK to continue.');

            // Show the notification banner to navigate to the first generated question
            const newStepIndex = initialQuestions.length;
            console.log('First generated question is at index:', newStepIndex);
          }, 100);

          return;
        }

        // Add unique IDs to ensure React keys are unique
        const newQuestions = validQuestions.map((q, index: number) => {
          // Log the question being processed
          console.log(`Processing question ${index}:`, q);

          // Create a properly formatted question
          const formattedQuestion = {
            ...q,
            id: questions.length + index + 1,
            key: q.id || `question${questions.length + index + 1}`,
            type: q.type || 'single-choice',
          } as Question;

          console.log(`Formatted question ${index}:`, formattedQuestion);
          return formattedQuestion;
        });

        // First mark that we've generated questions to prevent loops
        setHasGeneratedQuestions(true);

        // Then update questions and handle the step update in the callback
        setQuestions(prevQuestions => {
          const updatedQuestions = [...prevQuestions, ...newQuestions];
          console.log('Updated questions array:', updatedQuestions);
          return updatedQuestions;
        });

        // Clear loading state
        setIsLoadingMore(false);

        // Show success message with a delay to ensure state updates have been applied
        setTimeout(() => {
          alert(
            `${newQuestions.length} new questions have been added! Click OK to continue.`
          );

          // Ask the user if they want to go to the first new question
          if (confirm('Would you like to go to the first new question now?')) {
            goToFirstGeneratedQuestion();
          }
        }, 300);
      } else {
        // If no questions were generated, mark as generated and clear loading state
        setHasGeneratedQuestions(true);
        setIsLoadingMore(false);
        alert(
          'No questions were generated. Proceeding with current questions.'
        );
      }
    } catch (error) {
      console.error('Error fetching additional questions:', error);
      // Mark as generated and clear loading state to avoid loops
      setHasGeneratedQuestions(true);
      setIsLoadingMore(false);
      alert('Error generating questions. Proceeding with current questions.');
    }
  };

  // Function to manually go to the first generated question
  const goToFirstGeneratedQuestion = () => {
    if (questions.length > initialQuestions.length) {
      const newStepIndex = initialQuestions.length;
      console.log(
        'Manually going to first generated question at index:',
        newStepIndex
      );
      setCurrentStep(newStepIndex);
    }
  };

  // Add a safeguard effect to prevent infinite loading
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    if (isLoadingMore) {
      // Set a timeout to clear the loading state if it's been active too long
      timeoutId = setTimeout(() => {
        console.warn('Loading timeout reached, clearing loading state');
        setIsLoadingMore(false);
        setHasGeneratedQuestions(true); // Mark as generated to prevent loops
        alert(
          'Question generation timed out. Please try again or proceed with current questions.'
        );
      }, 15000); // 15 seconds timeout
    }

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [isLoadingMore]);

  // Add a debug function to log the current state
  const logState = () => {
    console.group('Current Survey State');
    console.log('Questions:', questions);
    console.log('Current Step:', currentStep);
    console.log('Safe Current Step:', safeCurrentStep);
    console.log('Is Last Question:', isLastQuestion);
    console.log('Is Last Initial Question:', isLastInitialQuestion);
    console.log('Has Generated Questions:', hasGeneratedQuestions);
    console.log('Is Loading More:', isLoadingMore);
    console.log('Is Loading:', isLoading);
    console.log('Answers:', answers);
    console.log('Is Complete:', isComplete);
    console.log('Current Question: ', currentQuestion?.text || 'None');
    console.groupEnd();
  };

  // Call the debug function when relevant state changes
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      logState();
    }
  }, [
    currentStep,
    questions.length,
    hasGeneratedQuestions,
    isLoadingMore,
    isLoading,
  ]);

  // Add an effect to log when questions are updated
  useEffect(() => {
    console.log('Questions array updated:', questions);
    console.log('Current step after questions update:', currentStep);
  }, [questions, currentStep]);

  // Add an effect to detect when we're at the first generated question
  useEffect(() => {
    if (hasGeneratedQuestions && currentStep >= initialQuestions.length) {
      console.log('Now showing a generated question at step:', currentStep);
    }
  }, [hasGeneratedQuestions, currentStep, initialQuestions.length]);

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

  // Add a debug display for the current state
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className='mx-auto max-w-2xl'
    >
      {process.env.NODE_ENV === 'development' && (
        <div className='mb-4 rounded-lg bg-gray-100 p-4'>
          <h3 className='font-bold'>Current State:</h3>
          <div className='text-xs'>
            <p>Current Step: {currentStep}</p>
            <p>Safe Current Step: {safeCurrentStep}</p>
            <p>Total Questions: {questions.length}</p>
            <p>Initial Questions: {initialQuestions.length}</p>
            <p>Is Last Question: {isLastQuestion ? 'Yes' : 'No'}</p>
            <p>
              Is Last Initial Question: {isLastInitialQuestion ? 'Yes' : 'No'}
            </p>
            <p>
              Has Generated Questions: {hasGeneratedQuestions ? 'Yes' : 'No'}
            </p>
            <p>Is Complete: {isComplete ? 'Yes' : 'No'}</p>
            <p>Current Question: {currentQuestion?.text || 'None'}</p>
          </div>
        </div>
      )}

      {debugInfo && process.env.NODE_ENV === 'development' && (
        <div className='mb-4 rounded-lg bg-gray-100 p-4'>
          <h3 className='font-bold'>Debug Info:</h3>
          <pre className='max-h-40 overflow-auto text-xs'>
            {JSON.stringify(debugInfo, null, 2)}
          </pre>
          <button
            onClick={() => setDebugInfo(null)}
            className='mt-2 rounded bg-gray-200 px-2 py-1 text-xs'
          >
            Clear
          </button>
        </div>
      )}

      {isLastInitialQuestion && !hasGeneratedQuestions && (
        <div className='mb-4 rounded-lg border-2 border-yellow-200 bg-yellow-50 p-4'>
          <h3 className='font-bold text-yellow-800'>
            Þú ert að ljúka grunnspurningum
          </h3>
          <p className='mb-2 text-sm text-yellow-700'>
            Viltu fá fleiri spurningar til að sérsníða bókina betur?
          </p>
          <button
            onClick={generateMoreQuestions}
            className='rounded-lg bg-yellow-500 px-4 py-2 text-white transition-colors hover:bg-yellow-600'
            disabled={isLoadingMore}
          >
            {isLoadingMore ? 'Hleð...' : 'Fá fleiri spurningar'}
          </button>
        </div>
      )}

      {hasGeneratedQuestions &&
        questions.length > initialQuestions.length &&
        currentStep < initialQuestions.length && (
          <div className='mb-4 rounded-lg border-2 border-green-200 bg-green-50 p-4'>
            <h3 className='font-bold text-green-800'>
              Nýjar spurningar tilbúnar!
            </h3>
            <p className='mb-2 text-sm text-green-700'>
              {questions.length - initialQuestions.length} nýjar spurningar hafa
              verið búnar til.
            </p>
            <button
              onClick={goToFirstGeneratedQuestion}
              className='rounded-lg bg-green-500 px-4 py-2 text-white transition-colors hover:bg-green-600'
            >
              Skoða nýjar spurningar
            </button>
          </div>
        )}

      <form
        onSubmit={e => {
          // Always prevent default form submission and handle it manually
          e.preventDefault();

          // If we're on the last question and haven't generated questions yet
          if (isLastQuestion && !hasGeneratedQuestions) {
            console.log(
              'Form submission intercepted - generating questions first'
            );
            handleNextStep();
            return false;
          }

          // Otherwise, proceed with form submission if complete
          if (isComplete) {
            console.log('Form submission - all questions answered');
            handleSubmit(onSubmit)(e);
          } else {
            console.log('Form not complete yet, moving to next step');
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
