import { NextResponse } from 'next/server';
import { Pinecone } from '@pinecone-database/pinecone';
import { neon } from '@neondatabase/serverless';

export const maxDuration = 150;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { vector, topK, sessionId, descriptionId } = body;

    console.log('Received search request with:', {
      hasVector: !!vector,
      topK,
      sessionId,
      descriptionId,
    });

    if (!vector) {
      return NextResponse.json(
        { error: 'Vector is required' },
        { status: 400 }
      );
    }

    if (!sessionId || !descriptionId) {
      return NextResponse.json(
        { error: 'Session ID and Description ID are required' },
        { status: 400 }
      );
    }

    const sql = neon(process.env.DATABASE_URL!);

    // Initialize Pinecone client
    const pinecone = new Pinecone({
      apiKey: process.env.PINECONE_API_KEY!,
    });

    // Get the index
    const index = pinecone.index(process.env.PINECONE_INDEX_NAME!);
    console.log('Connected to Pinecone index');

    // Query the index
    console.log('Querying Pinecone index...');
    const queryResponse = await index.query({
      vector,
      topK: topK || 10,
      includeMetadata: true,
    });
    console.log(
      'Got response from Pinecone with',
      queryResponse.matches.length,
      'matches'
    );

    // Store book metadata and search results
    for (let i = 0; i < queryResponse.matches.length; i++) {
      const match = queryResponse.matches[i];
      if (!match.metadata) {
        console.log('Skipping match without metadata');
        continue;
      }

      const { title, description, image_url, url } = match.metadata as {
        title: string;
        description: string;
        image_url: string;
        url: string;
      };

      if (!match.id) {
        console.log('Skipping match without ID:', { title, url });
        continue;
      }

      try {
        // Upsert book metadata
        await sql`
          INSERT INTO books (id, title, description, image_url, url)
          VALUES (${match.id}, ${title}, ${description}, ${image_url}, ${url})
          ON CONFLICT (id) DO UPDATE SET
            title = EXCLUDED.title,
            description = EXCLUDED.description,
            image_url = EXCLUDED.image_url,
            url = EXCLUDED.url
        `;

        // Store search result
        await sql`
          INSERT INTO search_results 
          (session_id, description_id, book_id, similarity_score, rank_position)
          VALUES 
          (${sessionId}, ${descriptionId}, ${match.id}, ${match.score}, ${i + 1})
        `;
        console.log('Stored search result for book:', match.id);
      } catch (dbError: unknown) {
        const error = dbError as {
          name?: string;
          message?: string;
          code?: string;
          detail?: string;
          hint?: string;
        };
        console.error('Error storing search result:', error);
        // Continue with next result even if storage fails
      }
    }

    return NextResponse.json(queryResponse);
  } catch (error) {
    console.error('Search error:', error);
    return NextResponse.json(
      { error: 'Failed to perform search' },
      { status: 500 }
    );
  }
}
