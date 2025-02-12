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
      className='mx-auto max-w-2xl'
    >
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

      <div className='mb-6 flex flex-wrap gap-2'>
        {questions.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentStep(index)}
            className={`h-8 w-8 rounded-full ${
              index === currentStep
                ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white'
                : index < currentStep
                  ? 'bg-white/80 text-purple-600'
                  : 'bg-white/50 text-gray-600'
            } flex items-center justify-center font-medium transition-all hover:scale-105`}
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
          className='transform rounded-3xl border-4 border-purple-200 bg-white p-8 shadow-xl'
        >
          <motion.h1
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className='mb-6 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-2xl font-bold text-transparent'
          >
            {questions[currentStep].text}
          </motion.h1>

          {questions[currentStep].type === 'multiple-choice' && (
            <div className='space-y-4'>
              {questions[currentStep].options?.map(option => (
                <motion.button
                  key={option}
                  onClick={() => handleAnswer(option)}
                  className={`w-full rounded-xl border-2 ${
                    answers[questions[currentStep].id] === option
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
          )}

          {!isComplete && currentStep < questions.length && (
            <button
              onClick={handleSkip}
              className='mt-4 w-full rounded-xl border-2 border-gray-200 p-3 text-gray-500 transition-all hover:scale-[1.02] hover:border-gray-300 hover:text-gray-700'
            >
              Sleppa spurningu
            </button>
          )}

          {isComplete && (
            <Link
              href={nextPageUrl}
              className='mt-8 flex w-full justify-center rounded-full bg-gradient-to-r from-blue-500 to-purple-600 px-10 py-4 text-xl font-bold text-white shadow-lg transition-all hover:scale-105 hover:shadow-xl'
            >
              Finna bækur 🚀
            </Link>
          )}
        </motion.div>
      </AnimatePresence>
    </motion.div>
  );
}
