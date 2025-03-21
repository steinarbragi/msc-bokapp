import { Pinecone } from '@pinecone-database/pinecone';

const pinecone = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY!,
});

export async function POST(request: Request) {
  try {
    const { text } = await request.json();

    if (!text) {
      return new Response('Missing text parameter', { status: 400 });
    }
    // Get embeddings using Pinecone's hosted E5 large model
    const response = await pinecone.inference.embed(
      'multilingual-e5-large',
      [text],
      { inputType: 'query' }
    );

    // Add detailed logging
    console.log('Raw embedding response:', JSON.stringify(response, null, 2));
    console.log('Response type:', typeof response);
    console.log('Values type:', typeof response?.data?.[0]?.values);
    console.log('Values:', response?.data?.[0]?.values);

    if (!response?.data?.[0]?.values) {
      throw new Error('Invalid embedding response structure');
    }

    const vector = response.data[0].values;

    // Return the vector directly
    return new Response(JSON.stringify({ vector }), {
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
