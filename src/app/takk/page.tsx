'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';

export default function ThanksPage() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className='flex min-h-screen flex-col items-center justify-center p-8 text-center'
    >
      <div className='mb-20 max-w-2xl'>
        <h1 className='mb-6 text-3xl font-bold'>Takk fyrir þátttökuna!</h1>

        <p className='mb-8 text-xl'>
          Við kunnum virkilega vel að meta að þú tókst þátt í þessu verkefni með
          okkur. Svörin þín munu hjálpa okkur að gera vefsíðuna enn betri.
        </p>

        <Link
          href='/'
          className='mb-8 rounded-xl border-2 border-purple-300 bg-purple-50 px-6 py-4 text-center text-lg font-bold text-purple-700 transition-all hover:scale-105 hover:border-purple-400 hover:bg-purple-100'
        >
          Fara aftur á forsíðu
        </Link>
      </div>
    </motion.div>
  );
}
