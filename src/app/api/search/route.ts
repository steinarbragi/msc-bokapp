import { NextResponse } from 'next/server';
import { Pinecone } from '@pinecone-database/pinecone';
import { neon } from '@neondatabase/serverless';

export const maxDuration = 150;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { vector, topK, sessionId, descriptionId } = body;

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

    // Query the index
    const queryResponse = await index.query({
      vector,
      topK: topK || 10,
      includeMetadata: true,
    });

    // Store book metadata and search results
    for (let i = 0; i < queryResponse.matches.length; i++) {
      const match = queryResponse.matches[i];
      if (!match.metadata) {
        continue;
      }

      const { title, description, image_filename, url } = match.metadata as {
        title: string;
        description: string;
        image_filename: string;
        url: string;
      };

      if (!match.id) {
        continue;
      }

      try {
        // Upsert book metadata
        await sql`
          INSERT INTO books (id, title, description, image_filename, url)
          VALUES (${match.id}, ${title}, ${description}, ${image_filename}, ${url})
          ON CONFLICT (id) DO UPDATE SET
            title = EXCLUDED.title,
            description = EXCLUDED.description,
            image_filename = EXCLUDED.image_filename,
            url = EXCLUDED.url
        `;

        // Store search result
        await sql`
          INSERT INTO search_results 
          (session_id, description_id, book_id, similarity_score, rank_position)
          VALUES 
          (${sessionId}, ${descriptionId}, ${match.id}, ${match.score}, ${i + 1})
        `;
      } catch (dbError: unknown) {
        const error = dbError as {
          name?: string;
          message?: string;
          code?: string;
          detail?: string;
          hint?: string;
        };
        console.error('Error storing book metadata or search result:', error);
      }
    }

    return NextResponse.json(queryResponse);
  } catch (error) {
    console.error('Error in search route:', error);
    return NextResponse.json(
      { error: 'Failed to perform search' },
      { status: 500 }
    );
  }
}
