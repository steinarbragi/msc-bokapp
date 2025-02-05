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
    console.error('Error generating embedding:', error);
    return new Response('Error generating embedding', { status: 500 });
  }
}
