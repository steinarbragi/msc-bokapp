import { NextRequest, NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL!);

export async function POST(request: NextRequest) {
  try {
    const { sessionId, recommendationId, isRelevant } = await request.json();

    // Validate required fields
    if (!sessionId || !recommendationId) {
      console.error('Missing required fields:', {
        sessionId,
        recommendationId,
      });
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check if recommendation exists
    const recommendationExists = await sql`
      SELECT id FROM recommendations 
      WHERE id = ${recommendationId} AND session_id = ${sessionId}
    `;

    if (recommendationExists.length === 0) {
      console.error('Recommendation not found:', {
        recommendationId,
        sessionId,
      });
      return NextResponse.json(
        { error: 'Recommendation not found' },
        { status: 404 }
      );
    }

    try {
      // Update the is_relevant field directly in the recommendations table
      const result = await sql`
        UPDATE recommendations
        SET is_relevant = ${isRelevant}
        WHERE id = ${recommendationId} AND session_id = ${sessionId}
        RETURNING *
      `;

      return NextResponse.json({ success: true, data: result[0] });
    } catch (dbError: unknown) {
      const error = dbError as {
        name?: string;
        message?: string;
        code?: string;
        detail?: string;
        hint?: string;
      };
      console.error('Database error in updating recommendation:', {
        error,
        recommendationId,
        sessionId,
        isRelevant,
        details: {
          name: error.name,
          message: error.message,
          code: error.code,
          detail: error.detail,
          hint: error.hint,
          stack: error instanceof Error ? error.stack : undefined,
        },
      });
      return NextResponse.json(
        { error: 'Failed to update recommendation', details: error.message },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error in feedback submission:', {
      error,
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    });
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const recommendationId = searchParams.get('recommendationId');
    const sessionId = searchParams.get('sessionId');

    if (!recommendationId || !sessionId) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    const recommendation = await sql`
      SELECT id, is_relevant FROM recommendations 
      WHERE id = ${recommendationId} AND session_id = ${sessionId}
    `;

    return NextResponse.json({ recommendation: recommendation[0] || null });
  } catch (error) {
    console.error('Error in GET request:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
