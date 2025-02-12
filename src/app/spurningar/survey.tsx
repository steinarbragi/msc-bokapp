'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm, Controller } from 'react-hook-form';

interface Question {
  id: number;
  text: string;
  type: 'multiple-choice' | 'slider' | 'text' | 'single-choice';
  options?: string[];
  allowTextInput?: boolean;
}

// Change the FormValues type to have a flat structure
type FormValues = {
  [key: `question${number}`]: string | string[];
};

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

  const isComplete = Object.keys(answers).length === questions.length;

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

  const renderProgressBar = () => (
    <div className='mb-8'>
      <div className='h-2 rounded-full bg-white/50'>
        <motion.div
          className='h-2 rounded-full bg-gradient-to-r from-blue-500 to-purple-600'
          initial={{ width: 0 }}
          animate={{
            width: `${((currentStep + 1) / questions.length) * 100}%`,
          }}
          transition={{ duration: 0.5 }}
        />
      </div>
    </div>
  );

  const renderStepButtons = () => (
    <div className='mb-6 flex flex-wrap gap-2'>
      {questions.map((question, index) => (
        <button
          key={index}
          onClick={() => setCurrentStep(index)}
          className={`h-8 w-8 rounded-full ${
            index === currentStep
              ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white'
              : answers[`question${question.id}`]
                ? 'bg-green-500 text-white'
                : index < currentStep
                  ? 'bg-white/80 text-purple-600'
                  : 'bg-white/50 text-gray-600'
          } flex items-center justify-center font-medium transition-all hover:scale-105`}
        >
          {index + 1}
        </button>
      ))}
    </div>
  );

  const renderQuestionContent = () => {
    switch (currentQuestion.type) {
      case 'multiple-choice':
        return (
          <Controller<FormValues>
            name={`question${currentQuestion.id}`}
            control={control}
            defaultValue={[]}
            render={({ field }) => (
              <div className='flex flex-col gap-4'>
                <div className='grid grid-cols-1 gap-4 sm:grid-cols-2'>
                  {currentQuestion.options?.map(option => (
                    <motion.button
                      key={option}
                      onClick={() => {
                        const currentValues = (field.value as string[]) || [];
                        const newValues = currentValues.includes(option)
                          ? currentValues.filter(v => v !== option)
                          : [...currentValues, option];
                        field.onChange(newValues.length > 0 ? newValues : []);
                      }}
                      className={`w-full rounded-xl border-2 ${
                        ((field.value as string[]) || []).includes(option)
                          ? 'border-purple-300 bg-purple-50'
                          : 'border-gray-200'
                      } p-4 text-left`}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      {option}
                    </motion.button>
                  ))}
                  {currentQuestion.allowTextInput && (
                    <div className='flex gap-2'>
                      <input
                        type='text'
                        placeholder='Annað...'
                        className={`flex-1 rounded-xl border-2 p-4 ${
                          ((field.value as string[]) || []).find(
                            v => !currentQuestion.options?.includes(v)
                          )
                            ? 'border-purple-300 bg-purple-50'
                            : 'border-gray-200'
                        }`}
                        value={
                          ((field.value as string[]) || []).find(
                            v => !currentQuestion.options?.includes(v)
                          ) || ''
                        }
                        onChange={e => {
                          const currentValues = (field.value as string[]) || [];
                          const customValue = currentValues.find(
                            v => !currentQuestion.options?.includes(v)
                          );
                          const newValues = customValue
                            ? currentValues.filter(v => v !== customValue)
                            : currentValues;
                          if (e.target.value) {
                            newValues.push(e.target.value);
                          }
                          field.onChange(newValues);
                        }}
                      />
                    </div>
                  )}
                </div>
              </div>
            )}
          />
        );

      case 'single-choice':
        return (
          <Controller<FormValues>
            name={`question${currentQuestion.id}`}
            control={control}
            render={({ field }) => (
              <div className='grid grid-cols-1 gap-4 sm:grid-cols-2'>
                {currentQuestion.options?.map(option => (
                  <motion.button
                    key={option}
                    onClick={() => {
                      const newValue = field.value === option ? '' : option;
                      field.onChange(newValue);
                      if (newValue) {
                        handleNextStep();
                      }
                    }}
                    className={`w-full rounded-xl border-2 ${
                      field.value === option
                        ? 'border-purple-300 bg-purple-50'
                        : 'border-gray-200'
                    } p-4 text-left`}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    {option}
                  </motion.button>
                ))}
              </div>
            )}
          />
        );

      case 'text':
        return (
          <Controller<FormValues>
            name={`question${currentQuestion.id}`}
            control={control}
            render={({ field }) => (
              <input
                type='text'
                value={(field.value as string) || ''}
                onChange={field.onChange}
                onBlur={field.onBlur}
                name={field.name}
                ref={field.ref}
                className='w-full rounded-xl border-2 border-gray-200 p-4'
                placeholder='Skrifaðu svar hér...'
              />
            )}
          />
        );
    }
  };

  const shouldShowSkipButton = () => {
    const currentAnswer = answers[`question${currentQuestion.id}`];
    return (
      !isLastQuestion &&
      !isComplete &&
      (!currentAnswer ||
        (Array.isArray(currentAnswer) && currentAnswer.length === 0) ||
        currentAnswer === '')
    );
  };

  const shouldShowNextButton = () => {
    const currentAnswer = answers[`question${currentQuestion.id}`];
    return (
      !isLastQuestion &&
      !isComplete &&
      currentAnswer &&
      (!Array.isArray(currentAnswer) || currentAnswer.length > 0) &&
      currentAnswer !== ''
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className='mx-auto max-w-2xl'
    >
      {renderProgressBar()}
      {renderStepButtons()}

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

          {renderQuestionContent()}

          {shouldShowSkipButton() && (
            <button
              onClick={() => handleNextStep()}
              className='mt-4 w-full rounded-xl border-2 border-gray-200 p-3 text-gray-500 transition-all hover:scale-[1.02] hover:border-gray-300 hover:text-gray-700'
            >
              Sleppa spurningu
            </button>
          )}

          {shouldShowNextButton() && (
            <motion.button
              onClick={handleNextStep}
              className='mt-4 w-full rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 p-3 text-white transition-all hover:scale-[1.02] hover:shadow-lg'
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              Áfram
            </motion.button>
          )}

          {(isComplete || isLastQuestion) && (
            <Link
              href={nextPageUrl}
              className='mt-8 flex w-full justify-center rounded-full bg-gradient-to-r from-blue-500 to-purple-600 px-10 py-4 text-xl font-bold text-white shadow-lg transition-all hover:scale-105 hover:shadow-xl'
            >
              {nextPageButtonText}
            </Link>
          )}
        </motion.div>
      </AnimatePresence>
    </motion.div>
  );
}
