import { neon } from '@neondatabase/serverless';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { surveyResponses } = body;

    const sql = neon(process.env.DATABASE_URL!);

    // Create a new session
    const sessionResult = await sql`
      INSERT INTO survey_sessions (id) 
      VALUES (gen_random_uuid()) 
      RETURNING id
    `;
    const sessionId = sessionResult[0].id;

    // Store survey responses
    for (const [questionKey, response] of Object.entries(surveyResponses)) {
      await sql`
        INSERT INTO survey_responses (session_id, question_key, response)
        VALUES (${sessionId}, ${questionKey}, ${response})
      `;
    }

    // Generate and store prompt (you'll implement the prompt generation logic)
    const generatedPrompt = ''; // TODO: Generate prompt based on responses
    const promptResult = await sql`
      INSERT INTO generated_prompts (session_id, prompt_text)
      VALUES (${sessionId}, ${generatedPrompt})
      RETURNING id
    `;

    return NextResponse.json({
      success: true,
      sessionId,
      promptId: promptResult[0].id,
    });
  } catch (error) {
    console.error('Error submitting survey:', error);
    return NextResponse.json(
      { error: 'Failed to submit survey' },
      { status: 500 }
    );
  }
}
