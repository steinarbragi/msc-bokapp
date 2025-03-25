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

type Question = {
  text: string;
  id: string;
  type: 'single-choice' | 'multiple-choice';
  options: string[];
  allowTextInput?: boolean;
};

type ToolUseResponse = {
  input: {
    questions: Question[];
  };
};

// Helper function to make API call with retries
async function createMessageWithRetry(
  messages: AnthropicMessage[],
  maxRetries = 3
) {
  let currentModel = 'claude-3-7-sonnet-latest';

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await anthropic.messages.create({
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
                  description: 'Listi af framhaldsspurningum',
                  items: {
                    type: 'object',
                    properties: {
                      text: {
                        type: 'string',
                        description: 'Spurningartextinn',
                      },
                      id: {
                        type: 'string',
                        description:
                          'descriptive hyphenated short identifier for the question',
                      },
                      type: {
                        type: 'string',
                        enum: ['single-choice', 'multiple-choice'],
                        description: 'Tegund spurningar',
                      },
                      options: {
                        type: 'array',
                        description: 'Svarmöguleikar fyrir spurninguna',
                        items: { type: 'string' },
                        minItems: 3,
                        maxItems: 8,
                      },
                      allowTextInput: {
                        type: 'boolean',
                        description: 'Hvort leyfa eigi sérsniðinn texta',
                      },
                    },
                    required: ['id', 'text', 'type', 'options'],
                  },
                },
              },
              required: ['questions'],
            },
          },
        ],
      });
    } catch (error: unknown) {
      if (error instanceof Error && 'status' in error && error.status === 529) {
        console.log(
          `Attempt ${attempt + 1} of ${maxRetries} failed with overloaded error on model ${currentModel}, retrying...`
        );

        if (currentModel === 'claude-3-7-sonnet-latest') {
          console.log('Switching to Haiku model...');
          currentModel = 'claude-3-5-haiku-latest';
          continue;
        }

        if (attempt === maxRetries - 1) {
          throw error;
        }
        const delayTime = Math.pow(2, attempt) * 2000;
        await delay(delayTime);
        console.log(`Waiting ${delayTime / 1000} seconds before retry...`);
        continue;
      }
      throw error;
    }
  }
  throw new Error('Failed to create message after all retries');
}

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

    // Store pre-generation survey responses
    for (const [questionKey, response] of Object.entries(surveyResponses)) {
      await sql`
        INSERT INTO pre_generation_responses (session_id, question_key, response)
        VALUES (${sessionId}, ${questionKey}, ${response})
      `;
    }

    // Get follow-up questions based on responses
    const response = await createMessageWithRetry([
      {
        role: 'user',
        content: `Based on these survey responses: ${JSON.stringify(surveyResponses, null, 2)}

Generate 3 follow-up questions to help customize the story further. Each question should:
- Have a unique ID (e.g., 'question1', 'question2', etc.)
- Have clear text in Icelandic
- Be either single-choice or multiple-choice
- Have 3-8 options in Icelandic
- Optionally allow text input (default to false)

Make sure the questions are relevant to the user's previous responses and help narrow down their preferences for the story.`,
      },
    ]);

    // Extract questions from the response
    let questions: Question[] = [];
    for (const block of response.content) {
      if (block.type === 'tool_use') {
        const toolUse = block as unknown as ToolUseResponse;
        if (toolUse.input?.questions) {
          questions = toolUse.input.questions;
          break;
        }
      }
    }

    // If no questions found, use fallbacks
    if (!questions || questions.length === 0) {
      questions = [
        {
          id: 'fallback1',
          text: 'Hvaða tegund af sögu myndir þú vilja lesa?',
          type: 'single-choice',
          options: [
            'Ævintýri',
            'Spennusaga',
            'Rómantík',
            'Vísindaskáldskapur',
            'Fantasía',
          ],
          allowTextInput: false,
        },
        {
          id: 'fallback2',
          text: 'Hversu löng ætti sagan að vera?',
          type: 'single-choice',
          options: [
            'Stutt saga (undir 10 mínútur)',
            'Miðlungs (10-20 mínútur)',
            'Löng saga (yfir 20 mínútur)',
          ],
          allowTextInput: false,
        },
        {
          id: 'fallback3',
          text: 'Hvað er mikilvægast í góðri sögu að þínu mati?',
          type: 'multiple-choice',
          options: [
            'Áhugaverðir persónuleikar',
            'Spennandi söguþráður',
            'Góður endi',
            'Óvæntar vendingar',
            'Falleg lýsing á umhverfi',
          ],
          allowTextInput: true,
        },
      ];
    }

    return NextResponse.json({
      success: true,
      sessionId,
      questions,
    });
  } catch (error) {
    console.error('Error generating follow-up questions:', error);
    return NextResponse.json(
      { error: 'Failed to generate follow-up questions' },
      { status: 500 }
    );
  }
}
