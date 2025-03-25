import { neon } from '@neondatabase/serverless';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { sessionId, responses } = await request.json();

    if (!sessionId || !responses) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const sql = neon(process.env.DATABASE_URL!);

    // Update the session with the final survey responses
    await sql`
      UPDATE survey_sessions
      SET 
        completed_at = NOW()
      WHERE id = ${sessionId}
      RETURNING id
    `;

    // Store each response in the survey_responses table
    for (const [questionKey, response] of Object.entries(responses)) {
      await sql`
        INSERT INTO survey_responses (session_id, question_key, response)
        VALUES (${sessionId}, ${questionKey}, ${response})
      `;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error submitting final survey:', error);
    return NextResponse.json(
      { error: 'Failed to submit survey' },
      { status: 500 }
    );
  }
}
