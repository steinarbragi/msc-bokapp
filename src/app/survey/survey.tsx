'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface Question {
  id: number;
  text: string;
  type: 'multiple-choice' | 'slider' | 'text';
  options?: string[];
}

interface SurveyProps {
  questions: Question[];
  onComplete?: (answers: Record<number, string>) => void;
  nextPageUrl?: string;
}

export default function Survey({
  questions,
  onComplete,
  nextPageUrl = '/search',
}: SurveyProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [textAnswers, setTextAnswers] = useState<Record<number, string>>({});
  const router = useRouter();

  const handleAnswer = (answer: string) => {
    const newAnswers = {
      ...answers,
      [questions[currentStep].id]: answer,
    };
    setAnswers(newAnswers);

    // For text fields, only advance when the button is clicked
    // This is handled separately in handleTextSubmit
    if (questions[currentStep].type !== 'text') {
      if (currentStep < questions.length - 1) {
        setCurrentStep(prev => prev + 1);
      } else if (onComplete) {
        onComplete(newAnswers);
      }
    }
  };

  const handleTextSubmit = () => {
    const currentAnswer = textAnswers[questions[currentStep].id];
    if (currentAnswer?.trim()) {
      const newAnswers = {
        ...answers,
        [questions[currentStep].id]: currentAnswer,
      };
      setAnswers(newAnswers);

      if (currentStep < questions.length - 1) {
        setCurrentStep(prev => prev + 1);
      } else {
        if (onComplete) {
          onComplete(newAnswers);
        }
        router.push(nextPageUrl);
      }
    }
  };

  const handleSkip = () => {
    if (currentStep < questions.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      // If this is the last question, move to next page
      router.push(nextPageUrl);
    }
  };

  const isComplete = Object.keys(answers).length === questions.length;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className='min-h-screen p-8'
    >
      <div className='mx-auto max-w-2xl'>
        <div className='mb-8'>
          <div className='h-2 rounded-full bg-gray-200'>
            <motion.div
              className='h-2 rounded-full bg-blue-600'
              initial={{ width: 0 }}
              animate={{
                width: `${((currentStep + 1) / questions.length) * 100}%`,
              }}
              transition={{ duration: 0.5 }}
            />
          </div>
        </div>

        <div className='mb-6 flex flex-wrap gap-2'>
          {questions.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentStep(index)}
              className={`h-8 w-8 rounded-full ${
                index === currentStep
                  ? 'bg-blue-600 text-white'
                  : index < currentStep
                    ? 'bg-blue-200 text-blue-800'
                    : 'bg-gray-200 text-gray-600'
              } flex items-center justify-center font-medium transition-colors hover:bg-blue-500 hover:text-white`}
            >
              {index + 1}
            </button>
          ))}
        </div>

        <AnimatePresence mode='wait'>
          <motion.div
            key={currentStep}
            initial={{ x: 50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -50, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className='rounded-lg bg-white p-8 shadow-lg'
          >
            <motion.h1
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className='mb-6 text-2xl font-bold'
            >
              {questions[currentStep].text}
            </motion.h1>

            {questions[currentStep].type === 'multiple-choice' && (
              <div className='space-y-4'>
                {questions[currentStep].options?.map((option, index) => (
                  <motion.button
                    key={option}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    onClick={() => handleAnswer(option)}
                    className={`w-full rounded-lg border-2 ${
                      answers[questions[currentStep].id] === option
                        ? 'border-blue-600 bg-blue-50'
                        : 'border-gray-200'
                    } p-4 text-left hover:border-blue-600`}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    {option}
                  </motion.button>
                ))}
              </div>
            )}

            {questions[currentStep].type === 'text' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className='flex gap-4'
              >
                <input
                  type='text'
                  value={textAnswers[questions[currentStep].id] || ''}
                  onChange={e =>
                    setTextAnswers(prev => ({
                      ...prev,
                      [questions[currentStep].id]: e.target.value,
                    }))
                  }
                  onKeyDown={e => e.key === 'Enter' && handleTextSubmit()}
                  className='flex-1 rounded-lg border-2 border-gray-200 p-4 focus:border-blue-600 focus:outline-none'
                  placeholder='Skrifaðu svar hér...'
                />
                <motion.button
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  onClick={handleTextSubmit}
                  className='rounded-lg bg-blue-600 px-8 py-4 text-white hover:bg-blue-700'
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Svara
                </motion.button>
              </motion.div>
            )}

            {!isComplete && currentStep < questions.length && (
              <button
                onClick={handleSkip}
                className='mt-4 w-full rounded-lg border-2 border-gray-200 p-3 text-gray-500 hover:border-gray-300 hover:text-gray-700'
              >
                Sleppa spurningu
              </button>
            )}

            {isComplete && (
              <Link
                href={nextPageUrl}
                className='mt-12 flex w-full justify-center rounded-full bg-blue-600 px-8 py-3 text-white transition-colors hover:bg-blue-700'
              >
                Finna bækur
              </Link>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
