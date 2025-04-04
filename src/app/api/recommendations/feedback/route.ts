import { NextRequest, NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL!);

export async function POST(request: NextRequest) {
  try {
    const {
      sessionId,
      recommendationId,
      rating,
      isRelevant,
      feedbackText,
      feedbackType,
    } = await request.json();

    // Validate required fields
    if (!sessionId || !recommendationId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate feedback type if provided
    if (feedbackType && !['yes', 'maybe', 'no'].includes(feedbackType)) {
      return NextResponse.json(
        { error: 'Invalid feedback type' },
        { status: 400 }
      );
    }

    // Validate rating if provided
    if (rating && (rating < 1 || rating > 5)) {
      return NextResponse.json(
        { error: 'Rating must be between 1 and 5' },
        { status: 400 }
      );
    }

    const recommendationExists = await sql`
      SELECT id, book_id FROM recommendations 
      WHERE id = ${recommendationId} AND session_id = ${sessionId}
    `;

    if (recommendationExists.length === 0) {
      return NextResponse.json(
        { error: 'Recommendation not found' },
        { status: 404 }
      );
    }

    // Get existing feedback
    const existingFeedback = await sql`
      SELECT * FROM recommendation_feedback 
      WHERE session_id = ${sessionId} 
      AND recommendation_id = ${recommendationId}
    `;

    try {
      let result;
      if (existingFeedback.length > 0) {
        // Update existing feedback
        result = await sql`
          UPDATE recommendation_feedback 
          SET 
            rating = COALESCE(${rating}, rating),
            is_relevant = COALESCE(${isRelevant}, is_relevant),
            feedback_text = COALESCE(${feedbackText}, feedback_text),
            feedback_type = COALESCE(${feedbackType}, feedback_type)
          WHERE session_id = ${sessionId} 
          AND recommendation_id = ${recommendationId}
          RETURNING *
        `;
      } else {
        // Insert new feedback
        result = await sql`
          INSERT INTO recommendation_feedback 
          (session_id, recommendation_id, rating, is_relevant, feedback_text, feedback_type)
          VALUES 
          (${sessionId}, ${recommendationId}, ${rating}, ${isRelevant}, ${feedbackText}, ${feedbackType})
          RETURNING *
        `;
      }

      return NextResponse.json({ success: true, data: result[0] });
    } catch (dbError: unknown) {
      const error = dbError as {
        name?: string;
        message?: string;
        code?: string;
        detail?: string;
        hint?: string;
      };
      return NextResponse.json(
        { error: 'Failed to save feedback', details: error.message },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error in feedback submission:', error);
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

    const feedback = await sql`
      SELECT * FROM recommendation_feedback 
      WHERE session_id = ${sessionId} 
      AND recommendation_id = ${recommendationId}
    `;

    return NextResponse.json({ feedback: feedback[0] || null });
  } catch (error) {
    console.error('Error in GET request:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
