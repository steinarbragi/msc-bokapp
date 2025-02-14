import Image from 'next/image';
import Link from 'next/link';

export default function Home() {
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
              <span className='text-lg'>Töfravélin finnur bækur fyrir þig</span>
            </li>
          </ul>
        </div>

        <div className='flex justify-center'>
          <Link
            href='/spurningar'
            className='inline-block animate-pulse rounded-full bg-gradient-to-r from-blue-500 to-purple-600 px-4 py-4 text-xl font-bold text-white shadow-lg transition-all hover:scale-105 hover:shadow-xl sm:px-8'
          >
            Hefjum ævintýrið! 🚀
          </Link>
        </div>

        <div className='mt-8 rounded-xl bg-purple-50 p-4 text-base text-gray-600'>
          <p>
            Vefurinn er enn í stöðugri þróun. Kerfið er ætlað börnum á aldrinum
            6-11 ára. Markmiðið er að kanna getu gervigreindar til þess að auka
            lestraráhuga barna, með því að veita persónuleg bókameðmæli. Gögnum
            verður safnað fyrir rannsóknarverkefni á vegum Háskóla Íslands.
          </p>
        </div>
      </div>
      <Image
        src='/hi/logo/Tákn blátt.svg'
        alt='Háskóli Íslands'
        width={100}
        height={100}
        className='mx-auto mt-4'
      />
    </main>
  );
}
