export default function Home() {
  return (
    <div className='grid min-h-screen grid-rows-[20px_1fr_20px] items-center justify-items-center gap-16 p-8 pb-20 font-[family-name:var(--font-geist-sans)] sm:p-20'>
      <header className='text-center'>
        <h1 className='mb-2 text-4xl font-bold'>Bókagreind</h1>
        <p className='text-lg text-gray-600'>
          Finndu næstu uppáhaldsbókina þína!
        </p>
      </header>

      <main className='max-w-2xl text-center'>
        <div className='rounded-lg bg-white p-8 shadow-lg'>
          <h2 className='mb-6 text-2xl font-semibold'>Rannsóknarverkefni</h2>

          <p className='mb-6'>
            Þetta er rannsóknarverkefni sem kannar hvernig gervigreind getur
            hjálpað börnum að finna bækur við hæfi. Vefurinn spyr þig nokkurra
            spurninga um hvað þér finnst gaman að lesa og gervigreindin mun
            hjálpa til við að stinga upp á bókum sem henta þér.
          </p>

          <div className='mb-8'>
            <h3 className='mb-4 text-xl font-medium'>Svona virkar þetta:</h3>
            <ul className='list-inside list-disc space-y-2 text-left'>
              <li>Þú getur svarað nokkrum spurningum um lestraráhuga</li>
              <li>Þú getur látið vefinn vita hvað þú hefur lesið áður</li>
              <li>Þú færð þá persónuleg bókameðmæli</li>
              <li>Að lokum bjóðum við þér að svara könnun um upplifun þína</li>
            </ul>
          </div>

          <button className='rounded-full bg-blue-600 px-8 py-3 text-white transition-colors hover:bg-blue-700'>
            Finnum Bækur
          </button>

          <p className='mt-6 text-sm text-gray-500'>
            Fyrir börn á aldrinum 6-11 ára. Öllum gögnum er safnað nafnlaust
            fyrir rannsóknarverkefnið.
          </p>
        </div>
      </main>
    </div>
  );
}
