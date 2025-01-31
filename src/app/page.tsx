export default function Home() {
  return (
    <div className='grid min-h-screen grid-rows-[20px_1fr_20px] items-center justify-items-center gap-16 p-8 pb-20 font-[family-name:var(--font-geist-sans)] sm:p-20'>
      <header className='text-center'>
        <h1 className='mb-2 text-4xl font-bold'>Book Buddy AI</h1>
        <p className='text-lg text-gray-600'>Find your next favorite book!</p>
      </header>

      <main className='max-w-2xl text-center'>
        <div className='rounded-lg bg-white p-8 shadow-lg'>
          <h2 className='mb-6 text-2xl font-semibold'>
            Welcome to our Research Project
          </h2>

          <p className='mb-6'>
            This is a research project exploring how artificial intelligence can
            help children find books they&apos;ll love. We&apos;ll ask you some
            questions about what you like to read, and our AI will help suggest
            books just for you!
          </p>

          <div className='mb-8'>
            <h3 className='mb-4 text-xl font-medium'>How it works:</h3>
            <ul className='list-inside list-disc space-y-2 text-left'>
              <li>Answer a few questions about your reading interests</li>
              <li>
                Our AI will ask follow-up questions to understand you better
              </li>
              <li>Get personalized book recommendations!</li>
            </ul>
          </div>

          <button className='rounded-full bg-blue-600 px-8 py-3 text-white transition-colors hover:bg-blue-700'>
            Start Finding Books
          </button>

          <p className='mt-6 text-sm text-gray-500'>
            For children ages 5-10. All data is collected anonymously for
            research purposes.
          </p>
        </div>
      </main>
    </div>
  );
}
