'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { useBook } from '../context/BookContext';

const MotionLink = motion(Link);

interface NextStepButtonProps {
  isFloating?: boolean;
}

export default function NextStepButton({
  isFloating = false,
}: NextStepButtonProps) {
  const { readBooks } = useBook();

  const buttonContent = (
    <>
      <span>✨</span>
      <span>NÆSTA SKREF - FÁ MEÐMÆLI</span>
      <span className='flex h-8 w-8 items-center justify-center rounded-full bg-white text-lg font-bold text-purple-600 shadow-inner'>
        {readBooks.size}
      </span>
      <span>✨</span>
    </>
  );

  if (isFloating) {
    return (
      <div className='fixed bottom-8 right-8 z-50 flex flex-col items-center md:bottom-12 md:right-12 lg:bottom-16 lg:right-28'>
        <motion.div
          animate={{
            y: [0, -10, 0],
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          className='mb-2 text-4xl font-bold text-purple-600'
        >
          ↓
        </motion.div>
        <MotionLink
          href='/medmaeli'
          animate={{
            background: [
              'linear-gradient(to right, #f97316, #2563eb, #9333ea)',
              'linear-gradient(to right, #2563eb, #9333ea, #f97316)',
              'linear-gradient(to right, #9333ea, #f97316, #2563eb)',
              'linear-gradient(to right, #f97316, #2563eb, #9333ea)',
            ],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: 'easeInOut',
            repeatType: 'loop',
          }}
          className='flex items-center gap-2 rounded-full px-6 py-4 text-lg font-bold text-white shadow-xl transition-all hover:scale-110 hover:shadow-2xl'
        >
          {buttonContent}
        </MotionLink>
      </div>
    );
  }

  return (
    <div className='mt-8 flex justify-center'>
      <MotionLink
        href='/medmaeli'
        animate={{
          background: [
            'linear-gradient(to right, #f97316, #2563eb, #9333ea)',
            'linear-gradient(to right, #2563eb, #9333ea, #f97316)',
            'linear-gradient(to right, #9333ea, #f97316, #2563eb)',
            'linear-gradient(to right, #f97316, #2563eb, #9333ea)',
          ],
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: 'easeInOut',
          repeatType: 'loop',
        }}
        className='flex items-center gap-2 rounded-full px-6 py-4 text-lg font-bold text-white shadow-xl transition-all hover:scale-110 hover:shadow-2xl'
      >
        {buttonContent}
      </MotionLink>
    </div>
  );
}
