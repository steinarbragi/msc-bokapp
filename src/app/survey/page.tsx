'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';

interface Question {
  id: number;
  text: string;
  type: 'multiple-choice' | 'slider' | 'text';
  options?: string[];
}

export default function QuestionsPage() {
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});

  const questions: Question[] = [
    {
      id: 1,
      text: 'Hvert er kyn þitt?',
      type: 'multiple-choice',
      options: ['Stelpa', 'Strákur', 'Annað'],
    },
    {
      id: 2,
      text: `Hvað ertu ${answers[1] === 'Stelpa' ? 'gömul' : answers[1] === 'Strákur' ? 'gamall' : 'gamalt'}?`,
      type: 'multiple-choice',
      options: ['6-7 ára', '8-9 ára', '10-11 ára'],
    },
    {
      id: 3,
      text: 'Hvaða tegund af sögum finnst þér skemmtilegast að lesa?',
      type: 'multiple-choice',
      options: ['Ævintýri', 'Fantasía', 'Húmor', 'Dýrasögur', 'Daglegt líf'],
    },
    {
      id: 4,
      text: 'Hvernig á aðalsögupersónan að vera?',
      type: 'multiple-choice',
      options: [
        'Hugmyndarík/ur og klár',
        'Hugrökk/Hugrakkur og ævintýragjörn/ævintýragjarn',
        'Fyndin/n og skemmtileg/ur',
        'Góð/ur við aðra og hjálpsöm/samur',
        'Svipuð/svipaður mér',
      ],
    },
    {
      id: 5,
      text: 'Hvað viltu að gerist í sögunni?',
      type: 'multiple-choice',
      options: [
        'Leysa dularfullt mál',
        'Fara í spennandi ferðalag',
        'Bjarga einhverjum/einhverju',
        'Eignas nýja vini',
        'Sigrast á erfiðu verkefni',
      ],
    },
    {
      id: 6,
      text: 'Hvar á sagan að gerast?',
      type: 'multiple-choice',
      options: [
        'Í töfraheimi',
        'Í venjulegum heimi',
        'Í skóla',
        'Úti í náttúrunni',
        'Í framtíðinni',
      ],
    },
    // Add more questions...
  ];

  const handleAnswer = (answer: string) => {
    setAnswers(prev => ({
      ...prev,
      [questions[currentStep].id]: answer,
    }));

    if (currentStep < questions.length - 1) {
      setCurrentStep(prev => prev + 1);
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
                    className='w-full rounded-lg border-2 border-gray-200 p-4 text-left hover:border-blue-600'
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    {option}
                  </motion.button>
                ))}
              </div>
            )}

            {isComplete && (
              <Link
                href='/search'
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
