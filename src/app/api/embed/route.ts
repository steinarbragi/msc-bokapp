import { OpenAI } from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: Request) {
  try {
    const { text } = await request.json();

    if (!text) {
      return new Response('Missing text parameter', { status: 400 });
    }

    // Get embeddings from OpenAI
    const response = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: text,
    });

    // Return the first embedding (there will only be one since we sent one text)
    return new Response(JSON.stringify(response.data[0].embedding), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    // More detailed error logging
    console.error('Error generating embedding:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      details:
        error instanceof Error && 'response' in error
          ? (error.response as { data: unknown })?.data
          : error,
    });

    // Return more specific error message
    return new Response(
      JSON.stringify({
        error: 'Error generating embedding',
        details: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}
