export default function Home() {
  return (
    <div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]">
      <header className="text-center">
        <h1 className="text-4xl font-bold mb-2">Book Buddy AI</h1>
        <p className="text-lg text-gray-600">Find your next favorite book!</p>
      </header>

      <main className="max-w-2xl text-center">
        <div className="bg-white p-8 rounded-lg shadow-lg">
          <h2 className="text-2xl font-semibold mb-6">Welcome to our Research Project</h2>
          
          <p className="mb-6">
            This is a research project exploring how artificial intelligence can help children
            find books they'll love. We'll ask you some questions about what you like to read,
            and our AI will help suggest books just for you!
          </p>

          <div className="mb-8">
            <h3 className="text-xl font-medium mb-4">How it works:</h3>
            <ul className="text-left list-disc list-inside space-y-2">
              <li>Answer a few questions about your reading interests</li>
              <li>Our AI will ask follow-up questions to understand you better</li>
              <li>Get personalized book recommendations!</li>
            </ul>
          </div>

          <button className="bg-blue-600 text-white px-8 py-3 rounded-full hover:bg-blue-700 transition-colors">
            Start Finding Books
          </button>

          <p className="mt-6 text-sm text-gray-500">
            For children ages 5-10. All data is collected anonymously for research purposes.
          </p>
        </div>
      </main>
    </div>
  );
}
