import { NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { neon } from '@neondatabase/serverless';

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
  id: string;
  metadata: {
    title: string;
    description: string;
    image_url: string;
    url: string;
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
    const { searchResults, readBooks, surveyResponses, sessionId } =
      await req.json();

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID is required' },
        { status: 400 }
      );
    }

    const sql = neon(process.env.DATABASE_URL!);

    // Store read books
    for (const bookId of readBooks) {
      try {
        // First check if the book exists
        const bookExists = await sql`
          SELECT id FROM books WHERE id = ${bookId}
        `;

        if (bookExists.length > 0) {
          await sql`
            INSERT INTO read_books (session_id, book_id)
            VALUES (${sessionId}, ${bookId})
            ON CONFLICT DO NOTHING
          `;
          console.log('Stored read book:', bookId);
        } else {
          console.log('Skipping read book that does not exist:', bookId);
        }
      } catch (dbError: unknown) {
        const error = dbError as {
          name?: string;
          message?: string;
          code?: string;
          detail?: string;
          hint?: string;
        };
        console.error('Error storing read book:', error);
        // Continue with next book even if storage fails
      }
    }

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

Veldu 10 bestu bækurnar úr listanum fyrir þennan notanda. Fyrir hverja bók skaltu útskýra í tveimur málsgreinum af hverju þú telur að bókin henti notandanum vel, með því að tala beint við notandann (t.d. "Þessi bók mun heilla þig..."). Taktu tillit til svara notandans við spurningum um lestrarvenjur og áhugamál.

Svarið þarf að vera á forminu:
1. [Titill bókar]: [Útskýring í tveimur málsgreinum sem talar beint til notandans]
2. [Titill bókar]: [Útskýring í tveimur málsgreinum sem talar beint til notandans]
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
          .replace(/^"|"$/g, '')
      );

    // Match the recommendations with the full book data and reorder based on the titles
    const recommendedBooks = await Promise.all(
      orderedTitles.map(async (title, index) => {
        // Find the book in unreadBooks
        const book = unreadBooks.find((b: Book) => b.metadata.title === title);

        if (!book || !book.metadata) {
          console.log('No valid match found for title:', title);
          return null;
        }

        if (!book.id) {
          console.log('Book missing ID:', book);
          return null;
        }

        console.log('Found match for title:', title, 'with ID:', book.id);

        const reasoning =
          recommendations
            .split('\n')
            .find(line => line.includes(title))
            ?.split(': ')[1] || 'Engin útskýring tiltæk';

        // Store recommendation in database
        try {
          await sql`
            INSERT INTO recommendations 
            (session_id, book_id, reasoning, rank_position)
            VALUES 
            (${sessionId}, ${book.id}, ${reasoning}, ${index + 1})
          `;
          console.log('Stored recommendation for book:', book.id);
        } catch (dbError: unknown) {
          const error = dbError as {
            name?: string;
            message?: string;
            code?: string;
            detail?: string;
            hint?: string;
          };
          console.error('Error storing recommendation:', error);
          // Continue with next recommendation even if storage fails
        }

        return {
          ...book,
          reasoning,
        };
      })
    );

    // Filter out any null values before returning
    const validRecommendations = recommendedBooks.filter(
      (book): book is Book & { reasoning: string } => book !== null
    );
    return NextResponse.json({ recommendations: validRecommendations });
  } catch (error) {
    console.error('Error in recommend route:', error);
    return NextResponse.json(
      { error: 'Failed to process recommendations' },
      { status: 500 }
    );
  }
}
