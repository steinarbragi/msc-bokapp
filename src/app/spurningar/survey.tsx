'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface Question {
  id: number;
  text: string;
  type: 'multiple-choice' | 'slider' | 'text' | 'single-choice';
  options?: string[];
  allowTextInput?: boolean;
}

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
  const [answers, setAnswers] = useState<Record<number, string | string[]>>({});
  const [textAnswers, setTextAnswers] = useState<Record<number, string>>({});
  const router = useRouter();

  const currentQuestion = questions[currentStep];
  const isLastQuestion = currentStep === questions.length - 1;
  const isComplete =
    Object.keys(answers).length === questions.length &&
    Object.values(answers).every(
      answer =>
        answer !== undefined &&
        answer !== null &&
        (Array.isArray(answer) ? answer.length > 0 : answer !== '')
    );

  const handleNextStep = () => {
    if (!isLastQuestion) {
      setCurrentStep(prev => prev + 1);
    } else if (onComplete) {
      onComplete(answers);
      router.push(nextPageUrl);
    }
  };

  const updateAnswer = (questionId: number, answer: string | string[]) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: answer,
    }));
  };

  const handleMultiChoiceAnswer = (option: string) => {
    const currentAnswers = (answers[currentQuestion.id] as string[]) || [];
    const newAnswers = currentAnswers.includes(option)
      ? currentAnswers.filter(a => a !== option)
      : [...currentAnswers, option];

    if (newAnswers.length === 0) {
      const updatedAnswers = { ...answers };
      delete updatedAnswers[currentQuestion.id];
      setAnswers(updatedAnswers);
    } else {
      updateAnswer(currentQuestion.id, newAnswers);
    }
  };

  const handleSingleChoiceAnswer = (option: string) => {
    updateAnswer(currentQuestion.id, option);
    handleNextStep();
  };

  const handleTextSubmit = () => {
    const answer = textAnswers[currentQuestion.id];
    if (answer?.trim()) {
      updateAnswer(currentQuestion.id, answer);
      handleNextStep();
    }
  };

  const handleSkip = () => {
    const newAnswers = { ...answers };
    delete newAnswers[currentQuestion.id];
    setAnswers(newAnswers);
    handleNextStep();
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
              : answers[question.id]
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
          <div>
            <p className='mb-4 italic text-gray-600'>
              Þú getur valið fleiri en einn valmöguleika
            </p>
            <div className='grid grid-cols-1 gap-4 sm:grid-cols-2'>
              {currentQuestion.options?.map(option => {
                const currentAnswers =
                  (answers[currentQuestion.id] as string[]) || [];
                const isSelected = currentAnswers.includes(option);

                return (
                  <motion.button
                    key={option}
                    onClick={() => handleMultiChoiceAnswer(option)}
                    className={`w-full rounded-xl border-2 ${
                      isSelected
                        ? 'border-purple-300 bg-purple-50'
                        : 'border-gray-200'
                    } p-4 text-left transition-all hover:scale-[1.02] hover:border-purple-300 hover:shadow-md`}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    {option}
                  </motion.button>
                );
              })}
            </div>
          </div>
        );

      case 'single-choice':
        return (
          <div className='grid grid-cols-1 gap-4 sm:grid-cols-2'>
            {currentQuestion.options?.map(option => (
              <motion.button
                key={option}
                onClick={() => handleSingleChoiceAnswer(option)}
                className={`w-full rounded-xl border-2 ${
                  answers[currentQuestion.id] === option
                    ? 'border-purple-300 bg-purple-50'
                    : 'border-gray-200'
                } p-4 text-left transition-all hover:scale-[1.02] hover:border-purple-300 hover:shadow-md`}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {option}
              </motion.button>
            ))}
          </div>
        );

      case 'text':
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className='flex flex-col gap-4 sm:flex-row'
          >
            <input
              type='text'
              value={textAnswers[currentQuestion.id] || ''}
              onChange={e =>
                setTextAnswers(prev => ({
                  ...prev,
                  [currentQuestion.id]: e.target.value,
                }))
              }
              onKeyDown={e => e.key === 'Enter' && handleTextSubmit()}
              className='flex-1 rounded-xl border-2 border-gray-200 p-4 transition-all focus:border-purple-300 focus:outline-none focus:ring-2 focus:ring-purple-100'
              placeholder='Skrifaðu svar hér...'
            />
            <motion.button
              onClick={handleTextSubmit}
              className='rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 px-8 py-4 text-white transition-all hover:scale-105 hover:shadow-lg'
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              Svara
            </motion.button>
          </motion.div>
        );
    }
  };

  const shouldShowSkipButton = () => {
    return (
      !isLastQuestion &&
      !isComplete &&
      (!answers[currentQuestion.id] ||
        (Array.isArray(answers[currentQuestion.id]) &&
          (answers[currentQuestion.id] as string[]).length === 0))
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
              onClick={handleSkip}
              className='mt-4 w-full rounded-xl border-2 border-gray-200 p-3 text-gray-500 transition-all hover:scale-[1.02] hover:border-gray-300 hover:text-gray-700'
            >
              Sleppa spurningu
            </button>
          )}

          {!isLastQuestion && !isComplete && answers[currentQuestion.id] && (
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
