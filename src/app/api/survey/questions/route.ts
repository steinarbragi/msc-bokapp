import { NextResponse } from 'next/server';
import { Anthropic } from '@anthropic-ai/sdk';
import { neon } from '@neondatabase/serverless';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

export const maxDuration = 150;

// Helper function to delay execution
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

type AnthropicMessage = {
  role: 'user' | 'assistant';
  content: string;
};

interface Question {
  id?: string;
  text: string;
  type: 'single-choice' | 'multiple-choice';
  options: string[];
  allowTextInput?: boolean;
  key: string;
}

interface SurveyResponse {
  [key: string]: string | string[] | undefined;
}

interface ToolUseBlock {
  type: 'tool_use';
  input: {
    questions?: Question[];
  };
}

// Helper function to make API call with retries
async function createMessageWithRetry(
  messages: AnthropicMessage[],
  maxRetries = 3
): Promise<{ response: Anthropic.Message; model: string }> {
  let currentModel = 'claude-3-7-sonnet-latest';

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const response = await anthropic.messages.create({
        model: currentModel,
        max_tokens: 1000,
        messages,
        tools: [
          {
            name: 'generate_questions',
            description:
              'Generate follow-up questions based on survey responses',
            input_schema: {
              type: 'object',
              properties: {
                questions: {
                  type: 'array',
                  description: 'Array of follow-up questions',
                  items: {
                    type: 'object',
                    properties: {
                      text: {
                        type: 'string',
                        description: 'The question text in Icelandic',
                      },
                      type: {
                        type: 'string',
                        description:
                          'The type of question (single-choice or multiple-choice)',
                      },
                      options: {
                        type: 'array',
                        description: 'Array of possible answers in Icelandic',
                        items: { type: 'string' },
                      },
                      key: {
                        type: 'string',
                        description: 'Unique key for the question',
                      },
                    },
                    required: ['text', 'type', 'options', 'key'],
                  },
                },
              },
              required: ['questions'],
            },
          },
        ],
      });
      return { response, model: currentModel };
    } catch (error) {
      if (attempt === maxRetries - 1) {
        throw error;
      }

      // Keep haiku fallback logs
      console.log('Switching to Haiku model...');
      currentModel = 'claude-3-5-haiku-latest';
      const delayTime = Math.pow(2, attempt) * 1000;
      console.log(`Waiting ${delayTime / 1000} seconds before retry...`);
      await delay(delayTime);
    }
  }
  throw new Error('Failed to create message after all retries');
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { surveyResponses, sessionId, requestTimestamp } = body as {
      surveyResponses: SurveyResponse;
      sessionId: string;
      requestTimestamp?: number;
    };

    if (!sessionId) {
      console.error('No session ID provided');
      return NextResponse.json(
        { error: 'Session ID is required' },
        { status: 400 }
      );
    }

    // Log request timestamp to track unique requests
    console.log(
      `Processing questions request for session ${sessionId}${requestTimestamp ? ` (timestamp: ${requestTimestamp})` : ''}`
    );

    const sql = neon(process.env.DATABASE_URL!);

    // Check if we already have generated questions for this session
    const existingQuestions = await sql`
      SELECT * FROM generated_questions
      WHERE session_id = ${sessionId}
      ORDER BY created_at ASC
    `;

    if (existingQuestions && existingQuestions.length > 0) {
      console.log('Found existing questions for session, returning them');

      // Format existing questions
      const formattedQuestions = existingQuestions.map(q => ({
        text: q.question,
        type: 'single-choice', // Default to single-choice if not specified
        options: q.options,
        key: q.question_key,
      }));

      return NextResponse.json(
        {
          success: true,
          questions: formattedQuestions,
          cached: true,
        },
        {
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            Pragma: 'no-cache',
            Expires: '0',
          },
        }
      );
    }

    // Get questions based on responses
    const { response, model: currentModel } = await createMessageWithRetry([
      {
        role: 'user',
        content: `Based on these survey responses: ${JSON.stringify(surveyResponses, null, 2)}

Generate follow-up questions to better understand the user's preferences. The questions should:
- Be in Icelandic
- Be appropriate for children based on the age group (adults should be asked about books for children)
- Be clear and engaging
- Have 2-5 options each
- Include a mix of single-choice and multiple-choice questions
- Have unique keys for each question
- Don't include questions about book length
- Include emojis when appropriate
- Don't include questions about the user's age
- Don't include questions about the user's gender
- Don't include questions about the user's location
- Don't include questions about the user's education

Make sure the questions are engaging and help understand the user's interests better.`,
      },
    ]);

    // Process each block in the response
    let questions: Question[] | null = null;
    if (response?.content) {
      for (const block of response.content) {
        if (block.type === 'tool_use' && 'input' in block) {
          const toolUseBlock = block as ToolUseBlock;
          if (toolUseBlock.input?.questions) {
            questions = toolUseBlock.input.questions;
            break;
          }
        }
      }
    }

    // Keep fallback log
    if (!questions || questions.length === 0) {
      console.log('No valid questions found, using fallbacks');
      questions = [
        {
          text: 'Hvaða tegund af sögu myndir þú vilja lesa?',
          type: 'single-choice',
          options: [
            'Ævintýri',
            'Spennusaga',
            'Rómantík',
            'Vísindaskáldskapur',
            'Fantasía',
          ],
          key: 'fallback-story-type',
        },
        {
          text: 'Hversu löng ætti sagan að vera?',
          type: 'single-choice',
          options: [
            'Stutt saga (undir 10 mínútur)',
            'Miðlungs (10-20 mínútur)',
            'Löng saga (yfir 20 mínútur)',
          ],
          key: 'fallback-story-length',
        },
      ];
    }

    // Store the questions in the database
    if (questions) {
      try {
        for (const question of questions) {
          await sql`
            INSERT INTO generated_questions (session_id, question, question_key, options, model)
            VALUES (${sessionId}, ${question.text}, ${question.key}, ${question.options}::text[], ${currentModel})
            ON CONFLICT DO NOTHING
          `;
        }
      } catch (error) {
        console.error('Error storing questions:', error);
      }
    }

    return NextResponse.json(
      {
        success: true,
        questions,
        cached: false,
      },
      {
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          Pragma: 'no-cache',
          Expires: '0',
        },
      }
    );
  } catch (error) {
    console.error('Error generating follow-up questions:', error);
    return NextResponse.json(
      { error: 'Failed to generate follow-up questions' },
      {
        status: 500,
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          Pragma: 'no-cache',
          Expires: '0',
        },
      }
    );
  }
}
