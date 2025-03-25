import { NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

export const maxDuration = 150;

// Helper function to delay execution
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

type AnthropicMessage = {
  role: 'user' | 'assistant';
  content: string;
};

type Book = {
  metadata: {
    title: string;
    description: string;
    image_url: string;
    url: string;
    id: string;
  };
};

async function createMessageWithRetry(
  messages: AnthropicMessage[],
  maxRetries = 3
) {
  let currentModel = 'claude-3-5-sonnet-latest';

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await anthropic.messages.create({
        messages,
        model: currentModel,
        max_tokens: 1000,
      });
    } catch (error: unknown) {
      if (error instanceof Error && 'status' in error && error.status === 529) {
        console.log(
          `Attempt ${attempt + 1} of ${maxRetries} failed with overloaded error on model ${currentModel}, retrying...`
        );

        if (currentModel === 'claude-3-5-sonnet-latest') {
          console.log('Switching to Haiku model...');
          currentModel = 'claude-3-5-haiku-latest';
          continue;
        }

        if (attempt === maxRetries - 1) {
          throw error;
        }
        const delayTime = Math.pow(2, attempt) * 2000;
        console.log(`Waiting ${delayTime / 1000} seconds before retry...`);
        await delay(delayTime);
        continue;
      }
      throw error;
    }
  }
  throw new Error('Failed to create message after all retries');
}

export async function POST(req: Request) {
  try {
    const { searchResults, readBooks, surveyResponses } = await req.json();

    // Filter out already read books
    const unreadBooks = searchResults.filter(
      (book: Book) => !readBooks.includes(book.metadata.id)
    );

    // Prepare the prompt for Claude
    const prompt = `Þú ert bókmenntafræðingur sem sérhæfir þig í að mæla með bókum.

Hér eru svör notandans við spurningum um lestrarvenjur og áhugamál:
${Object.entries(surveyResponses || {})
  .map(([key, value]) => `- ${key}: ${value}`)
  .join('\n')}
    
Hér er listi af bókum sem notandi hefur ekki lesið:
${unreadBooks.map((book: Book) => `- ${book.metadata.title}: ${book.metadata.description}`).join('\n')}

Veldu 10 bestu bækurnar úr listanum og útskýrðu í STUTTU máli (hámark 2 setningar) af hverju hver bók er góður kostur fyrir þennan notanda, með tilliti til þeirra svara sem hann gaf.
Svarið þarf að vera á forminu:
1. [Titill bókar]: [Útskýring]
2. [Titill bókar]: [Útskýring]
osf.

Mikilvægt: Raðaðu bókunum í röð frá bestu til minnst góðrar fyrir þennan notanda, með tilliti til þeirra svara sem hann gaf.`;
    const completion = await createMessageWithRetry([
      { role: 'user', content: prompt },
    ]);

    const recommendations =
      'text' in completion.content[0] ? completion.content[0].text : '';

    // Extract book titles in order from the recommendations
    const orderedTitles = recommendations
      .split('\n')
      .filter(line => line.trim())
      .map(line =>
        line
          .split(':')[0]
          .trim()
          .replace(/^\d+\.\s*/, '')
      );

    // Match the recommendations with the full book data and reorder based on the titles
    const recommendedBooks = orderedTitles
      .map(title => {
        const book = unreadBooks.find((b: Book) => b.metadata.title === title);
        if (!book) return null;

        const reasoning =
          recommendations
            .split('\n')
            .find(line => line.includes(title))
            ?.split(': ')[1] || 'Engin útskýring tiltæk';

        return {
          ...book,
          reasoning,
        };
      })
      .filter((book): book is Book & { reasoning: string } => book !== null);

    return NextResponse.json({ recommendations: recommendedBooks });
  } catch (error) {
    console.error('Error in recommend route:', error);
    return NextResponse.json(
      { error: 'Failed to process recommendations' },
      { status: 500 }
    );
  }
}
