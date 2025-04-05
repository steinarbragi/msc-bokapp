import { NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { neon } from '@neondatabase/serverless';
import { Redis } from '@upstash/redis';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

// Initialize Redis client
const redis = new Redis({
  url: process.env.UPSTASH_KV_REST_API_URL!,
  token: process.env.UPSTASH_KV_REST_API_TOKEN!,
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
    image_filename: string;
    url: string;
  };
};

async function createMessageWithRetry(
  messages: AnthropicMessage[],
  maxRetries = 3
): Promise<{ response: Anthropic.Message; model: string }> {
  let currentModel = 'claude-3-7-sonnet-latest';

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      console.log('Attempting to create message with model:', currentModel);
      const response = await anthropic.messages.create({
        model: currentModel,
        max_tokens: 4000,
        messages,
        tools: [
          {
            name: 'generate_recommendations',
            description:
              'Generate personalized book recommendations based on survey responses and read books',
            input_schema: {
              type: 'object',
              properties: {
                recommendations: {
                  type: 'array',
                  description: 'Array of book recommendations',
                  items: {
                    type: 'object',
                    properties: {
                      title: {
                        type: 'string',
                        description:
                          'The exact title of the book as it appears in the unreadBooks list',
                      },
                      reasoning: {
                        type: 'string',
                        description:
                          'A two-sentence explanation in Icelandic for why this book is recommended, speaking directly to the user',
                      },
                    },
                    required: ['title', 'reasoning'],
                  },
                },
              },
              required: ['recommendations'],
            },
          },
        ],
      });
      return { response, model: currentModel };
    } catch (error) {
      console.error('Error in createMessageWithRetry:', error);
      if (attempt === maxRetries - 1) {
        throw error;
      }

      console.log('Switching to Haiku model...');
      currentModel = 'claude-3-haiku-latest';
      const delayTime = Math.pow(2, attempt) * 1000;
      console.log(`Waiting ${delayTime / 1000} seconds before retry...`);
      await delay(delayTime);
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

    // Check if we already have a request in progress for this session
    const inProgressKey = `in_progress:${sessionId}`;
    console.log(`Checking in-progress status for session: ${sessionId}`);

    // Try to set the in-progress status atomically
    const wasSet = await redis.set(inProgressKey, 'processing', {
      ex: maxDuration,
      nx: true, // Only set if key does not exist
    });

    if (!wasSet) {
      console.log(
        `Request already in progress for session ${sessionId}, waiting for it to complete`
      );
      // Wait for the result to be available
      let attempts = 0;
      const maxAttempts = 30; // Wait up to 30 seconds
      while (attempts < maxAttempts) {
        const result = await redis.get(inProgressKey);
        if (result && result !== 'processing') {
          // The result is already an object, no need to parse
          return NextResponse.json(result);
        }
        await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
        attempts++;
      }
      // If we couldn't get the result, clean up and continue
      await redis.del(inProgressKey);
    }

    const sql = neon(process.env.DATABASE_URL!);

    // Check if recommendations already exist for this session
    const existingRecommendations = await sql`
      SELECT id FROM recommendations 
      WHERE session_id = ${sessionId}
      LIMIT 1
    `;

    // If recommendations already exist, return them instead of creating new ones
    if (existingRecommendations.length > 0) {
      console.log(
        'Found existing recommendations, fetching them instead of generating new ones'
      );

      const recommendations = await sql`
        SELECT r.id, r.book_id, r.reasoning, b.title, b.description, b.image_filename, b.url 
        FROM recommendations r
        JOIN books b ON r.book_id = b.id
        WHERE r.session_id = ${sessionId}
        ORDER BY r.rank_position ASC
      `;

      // Format the recommendations in the expected structure
      const formattedRecommendations = recommendations.map(rec => ({
        id: rec.id,
        book_id: rec.book_id,
        reasoning: rec.reasoning,
        metadata: {
          title: rec.title,
          description: rec.description,
          image_filename: rec.image_filename,
          url: rec.url,
        },
      }));

      const result = { recommendations: formattedRecommendations };
      // Store the result in Redis
      await redis.set(inProgressKey, result, {
        ex: maxDuration,
      });
      return NextResponse.json(result);
    }

    // Create a promise to track this request
    const requestPromise = (async () => {
      // Store read books
      for (const bookId of readBooks) {
        try {
          console.log(
            `Attempting to store read book with ID: ${bookId} for session: ${sessionId}`
          );
          // First check if the book exists
          const bookExists = await sql`
            SELECT id FROM books WHERE id = ${bookId}
          `;

          console.log(`Book exists check result for ${bookId}:`, bookExists);

          if (bookExists.length > 0) {
            const result = await sql`
              INSERT INTO read_books (session_id, book_id)
              VALUES (${sessionId}, ${bookId})
              ON CONFLICT DO NOTHING
              RETURNING id
            `;
            console.log(`Successfully stored read book. Result:`, result);
          } else {
            console.warn(`Book with ID ${bookId} not found in books table`);
          }
        } catch (dbError: unknown) {
          const error = dbError as {
            name?: string;
            message?: string;
            code?: string;
            detail?: string;
            hint?: string;
          };
          console.error('Error storing read book:', {
            error,
            bookId,
            sessionId,
            details: {
              name: error.name,
              message: error.message,
              code: error.code,
              detail: error.detail,
              hint: error.hint,
              stack: error instanceof Error ? error.stack : undefined,
            },
          });
          // Throw the error to stop processing if we can't store read books
          throw new Error(`Failed to store read book: ${error.message}`);
        }
      }

      // Filter out already read books
      const unreadBooks = searchResults.filter(
        (book: Book) => !readBooks.includes(book.id)
      );

      console.log('Unread books count:', unreadBooks.length);

      // Prepare the prompt for Claude
      const prompt = `Þú ert bókmenntafræðingur sem sérhæfir þig í að mæla með bókum.

Notandinn hefur svarað þessum spurningum:
${Object.entries(surveyResponses || {})
  .map(([key, value]) => `- ${key}: ${value}`)
  .join('\n')}
    
Hér er listi af bókum sem notandi hefur ekki lesið:
${unreadBooks.map((book: Book) => `- ${book.metadata.title}`).join('\n')}

Veldu 20 bestu bækurnar úr listanum fyrir þennan notanda. Fyrir hverja bók skaltu útskýra í tveimur málsgreinum af hverju þú telur að bókin henti notandanum vel, með því að tala beint við notandann (t.d. "Þessi bók mun heilla þig..."). Taktu tillit til svara notandans við spurningum um lestrarvenjur og áhugamál.

Mikilvægt: 
1. Raðaðu bókunum í röð frá bestu til minnst góðrar fyrir þennan notanda
2. Notaðu nákvæmlega sama titil og bókin hefur í listanum
3. Skrifaðu útskýringar sem tala beint til notandans
4. Taktu tillit til svara notandans við spurningum um lestrarvenjur og áhugamál`;

      console.log('Sending prompt to Claude');
      const { response: completion, model: currentModel } =
        await createMessageWithRetry([{ role: 'user', content: prompt }]);

      // Initialize recommendations array
      let recommendations: { title: string; reasoning: string }[] = [];

      // Extract recommendations from the tool use response
      if (completion?.content) {
        for (const block of completion.content) {
          if (block.type === 'tool_use' && 'input' in block) {
            const toolUseBlock = block as {
              input: {
                recommendations: { title: string; reasoning: string }[];
              };
            };
            if (toolUseBlock.input?.recommendations?.length > 0) {
              recommendations = toolUseBlock.input.recommendations;
              break;
            }
          }
        }
      }

      // If no recommendations were found, return an error
      if (recommendations.length === 0) {
        console.error('No valid recommendations found in Claude response');
        throw new Error('No recommendations generated');
      }

      // Match the recommendations with the full book data and reorder based on the titles
      const recommendedBooks = await Promise.all(
        recommendations.map(async (rec, index) => {
          // Find the book in unreadBooks
          const book = unreadBooks.find(
            (b: Book) => b.metadata.title === rec.title
          );

          if (!book || !book.metadata) {
            console.log('No book found for title:', rec.title);
            return null;
          }

          if (!book.id) {
            console.log('Book found but no ID:', rec.title);
            return null;
          }

          // Store recommendation in database
          try {
            console.log(
              `Attempting to store recommendation for book ${book.id} in session ${sessionId}`
            );
            const result = await sql`
              INSERT INTO recommendations 
              (session_id, book_id, reasoning, rank_position, model)
              VALUES 
              (${sessionId}, ${book.id}, ${rec.reasoning}, ${index + 1}, ${currentModel})
              RETURNING id
            `;
            console.log(`Successfully stored recommendation. Result:`, result);

            return {
              ...book,
              id: result[0].id,
              book_id: book.id,
              reasoning: rec.reasoning,
            };
          } catch (dbError: unknown) {
            const error = dbError as {
              name?: string;
              message?: string;
              code?: string;
              detail?: string;
              hint?: string;
            };
            console.error('Error storing recommendation:', {
              error,
              bookId: book.id,
              sessionId,
              details: {
                name: error.name,
                message: error.message,
                code: error.code,
                detail: error.detail,
                hint: error.hint,
                stack: error instanceof Error ? error.stack : undefined,
              },
            });
            // Throw the error to stop processing if we can't store recommendations
            throw new Error(`Failed to store recommendation: ${error.message}`);
          }
        })
      );

      // Filter out any null values before returning
      const validRecommendations = recommendedBooks.filter(
        (book): book is Book & { reasoning: string } => book !== null
      );

      return { recommendations: validRecommendations };
    })();

    try {
      // Wait for the request to complete
      const result = await requestPromise;
      // Store the final result in Redis
      await redis.set(inProgressKey, JSON.stringify(result), {
        ex: maxDuration,
      });
      return NextResponse.json(result);
    } catch (error) {
      // Clean up on error
      await redis.del(inProgressKey);
      throw error;
    }
  } catch (error) {
    console.error('Error in recommend route:', error);
    return NextResponse.json(
      { error: 'Failed to process recommendations' },
      { status: 500 }
    );
  }
}

// Add new status endpoint
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const sessionId = searchParams.get('sessionId');

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID is required' },
        { status: 400 }
      );
    }

    const inProgressKey = `in_progress:${sessionId}`;
    const result = await redis.get(inProgressKey);

    if (!result) {
      return NextResponse.json({ isProcessing: false });
    }

    if (result === 'processing') {
      return NextResponse.json({ isProcessing: true });
    }

    try {
      const parsedResult = JSON.parse(result as string);
      return NextResponse.json({
        isProcessing: false,
        recommendations: parsedResult.recommendations,
      });
    } catch (error) {
      console.error('Error parsing result:', error);
      return NextResponse.json({ isProcessing: false });
    }
  } catch (error) {
    console.error('Error in status endpoint:', error);
    return NextResponse.json(
      { error: 'Failed to check status' },
      { status: 500 }
    );
  }
}
