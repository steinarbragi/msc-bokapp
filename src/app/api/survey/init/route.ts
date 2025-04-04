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

    console.log(
      'Database URL format check:',
      process.env.DATABASE_URL.substring(0, 10) + '...'
    );

    try {
      console.log('Attempting to connect to database...');
      const sql = neon(process.env.DATABASE_URL);

      // Test connection with a simple query first
      console.log('Testing database connection with a simple query...');
      const testResult = await sql`SELECT 1 as test`;
      console.log('Test query result:', testResult);

      console.log('Creating new session...');
      // Create a new session with retries
      let sessionResult;
      let retries = 3;

      while (retries > 0) {
        try {
          sessionResult = await sql`
            INSERT INTO survey_sessions (id) 
            VALUES (gen_random_uuid()) 
            RETURNING id
          `;
          break; // If successful, exit the loop
        } catch (err) {
          console.error(`Database error (attempt ${4 - retries}/3):`, err);

          // Log more details about the error
          if (err instanceof Error) {
            console.error('Error details:', {
              name: err.name,
              message: err.message,
              stack: err.stack,
            });
          }

          retries--;
          if (retries <= 0) throw err; // Re-throw if all retries failed
          // Wait a bit before retrying
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }

      if (!sessionResult || sessionResult.length === 0) {
        console.error('No session result returned from database');
        throw new Error('Failed to create session');
      }

      const sessionId = sessionResult[0].id;
      console.log('Session created successfully:', sessionId);

      return NextResponse.json(
        {
          success: true,
          sessionId,
        },
        {
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            Pragma: 'no-cache',
            Expires: '0',
          },
        }
      );
    } catch (dbError) {
      console.error('Database connection error:', dbError);
      if (dbError instanceof Error) {
        console.error('Database error details:', {
          name: dbError.name,
          message: dbError.message,
          stack: dbError.stack,
        });
      }

      return NextResponse.json(
        {
          error: 'Database connection failed',
          details: dbError instanceof Error ? dbError.message : 'Unknown error',
        },
        { status: 500 }
      );
    }
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
