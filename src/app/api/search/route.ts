import { NextResponse } from 'next/server';
import { Pinecone } from '@pinecone-database/pinecone';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { vector, topK } = body;

    if (!vector) {
      return NextResponse.json(
        { error: 'Vector is required' },
        { status: 400 }
      );
    }

    // Initialize Pinecone client
    const pinecone = new Pinecone({
      apiKey: process.env.PINECONE_API_KEY!,
    });

    // Get the index
    const index = pinecone.index(process.env.PINECONE_INDEX_NAME!);

    // Query the index
    const queryResponse = await index.query({
      vector,
      topK: topK || 10,
      includeMetadata: true,
    });

    return NextResponse.json(queryResponse);
  } catch (error) {
    console.error('Search error:', error);
    return NextResponse.json(
      { error: 'Failed to perform search' },
      { status: 500 }
    );
  }
}
