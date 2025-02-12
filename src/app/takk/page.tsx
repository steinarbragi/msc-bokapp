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
      <div className='max-w-2xl'>
        <h1 className='mb-6 text-3xl font-bold'>Takk fyrir þátttökuna!</h1>

        <p className='mb-8 text-xl'>
          Við kunnum virkilega vel að meta að þú tókst þátt í þessu verkefni með
          okkur. Svörin þín munu hjálpa okkur að gera vefsíðuna enn betri.
        </p>

        <Link
          href='/'
          className='inline-block rounded-lg bg-blue-600 px-8 py-3 text-white transition-colors hover:bg-blue-700'
        >
          Fara aftur á forsíðu
        </Link>
      </div>
    </motion.div>
  );
}
