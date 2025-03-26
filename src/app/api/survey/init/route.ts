import { NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';

export async function POST() {
  try {
    if (!process.env.DATABASE_URL) {
      console.error('DATABASE_URL is not set in environment variables');
      return NextResponse.json(
        { error: 'Database configuration is missing' },
        { status: 500 }
      );
    }

    console.log('Attempting to connect to database...');
    const sql = neon(process.env.DATABASE_URL);

    console.log('Creating new session...');
    // Create a new session
    const sessionResult = await sql`
      INSERT INTO survey_sessions (id) 
      VALUES (gen_random_uuid()) 
      RETURNING id
    `;

    if (!sessionResult || sessionResult.length === 0) {
      console.error('No session result returned from database');
      throw new Error('Failed to create session');
    }

    console.log('Session created successfully:', sessionResult[0].id);
    return NextResponse.json({
      success: true,
      sessionId: sessionResult[0].id,
    });
  } catch (error) {
    console.error('Error creating session:', error);
    if (error instanceof Error) {
      console.error('Error details:', {
        name: error.name,
        message: error.message,
        stack: error.stack,
      });
    }
    return NextResponse.json(
      { error: 'Failed to create session' },
      { status: 500 }
    );
  }
}
