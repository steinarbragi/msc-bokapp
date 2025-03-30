'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useBook } from './context/BookContext';
import { motion } from 'framer-motion';
export default function Home() {
  const { setSessionId, resetSession } = useBook();
  const router = useRouter();
  const handleStart = async (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent the default link behavior

    try {
      // Reset any existing session data
      resetSession();

      const response = await fetch('/api/survey/init', {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Failed to initialize session');
      }

      const data = await response.json();
      console.log('Setting session ID in context:', data.sessionId);
      setSessionId(data.sessionId);

      // Navigate programmatically after setting the session ID
      router.push('/spurningar');
    } catch (error) {
      console.error('Error initializing session:', error);
    }
  };

  return (
    <main className='mx-auto max-w-2xl'>
      <header className='text-center'>
        <h1
          className='mb-2 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-5xl font-bold text-transparent'
          aria-label='Bókavélin - Finndu næstu uppáhaldsbókina þína'
        >
          Bókavélin
        </h1>
        <p className='text-xl font-medium text-gray-700'>
          Finndu næstu uppáhaldsbókina þína! ✨📚
        </p>
      </header>

      <div className='mt-10 transform rounded-3xl border-4 border-purple-200 bg-white p-8 shadow-xl transition-transform hover:scale-[1.02]'>
        <h2 className='mb-6 text-3xl font-bold text-purple-600'>
          Viltu finna bók?
        </h2>

        <p className='mb-6 text-lg'>
          Við notum gervigreind til að hjálpa þér að finna bækur sem þú gætir
          haft gaman af. Við spyrjum þig nokkurra spurninga og mælum með bókum
          sem gætu hentað þér vel.
        </p>

        <div className='mb-8'>
          <h3 className='mb-4 text-2xl font-bold text-blue-600'>
            Svona virkar þetta:
          </h3>
          <ul className='list-none space-y-4 text-left' role='list'>
            <li className='flex items-center'>
              <span className='mr-2 text-2xl'>🎯</span>
              <span className='text-lg'>
                Segðu okkur hvað þér finnst skemmtilegt að lesa
              </span>
            </li>
            <li className='flex items-center'>
              <span className='mr-2 text-2xl'>📚</span>
              <span className='text-lg'>
                Deildu með okkur bókunum sem þú hefur lesið áður
              </span>
            </li>
            <li className='flex items-center'>
              <span className='mr-2 text-2xl'>✨</span>
              <span className='text-lg'>
                Töfravélin finnur bækur fyrir þig!
              </span>
            </li>
          </ul>
        </div>

        <div className='flex justify-center'>
          <motion.button
            onClick={handleStart}
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
            whileHover={{
              scale: 1.1,
              boxShadow:
                '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
            }}
            whileTap={{
              scale: 0.95,
              boxShadow:
                '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
            }}
            className='flex items-center gap-2 rounded-full px-6 py-4 text-xl font-bold text-white shadow-xl transition-all hover:brightness-110 active:brightness-90'
          >
            Hefjum ævintýrið! 🚀
          </motion.button>
        </div>

        <div className='mt-8 rounded-xl bg-purple-50 p-4 text-base text-gray-600'>
          <p>
            Vefurinn er enn í stöðugri þróun. Kerfið er ætlað börnum. Markmiðið
            er að kanna getu gervigreindar til þess auka lestraráhuga barna með
            því að veita persónuleg bókameðmæli. Gögnum verður safnað nafnlaust
            fyrir rannsóknarverkefni á vegum Háskóla Íslands.
          </p>
          <p className='mt-2'>
            <Link
              className='text-center font-bold text-blue-900 transition-colors hover:text-blue-700'
              href='/skilmalar'
            >
              skilmálar og persónuverndarstefna
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
