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
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { surveyResponses, sessionId } = body as {
      surveyResponses: SurveyResponse;
      sessionId: string;
    };

    if (!sessionId) {
      console.error('No session ID provided');
      return NextResponse.json(
        { error: 'Session ID is required' },
        { status: 400 }
      );
    }

    const sql = neon(process.env.DATABASE_URL!);

    // Get questions based on responses
    const response = await createMessageWithRetry([
      {
        role: 'user',
        content: `Based on these survey responses: ${JSON.stringify(surveyResponses, null, 2)}

Generate follow-up questions to better understand the user's preferences. The questions should:
- Be in Icelandic
- Be appropriate for children aged 6-11
- Be clear and engaging
- Have 2-5 options each
- Include a mix of single-choice and multiple-choice questions
- Have unique keys for each question

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
            INSERT INTO generated_questions (session_id, question, question_key, options)
            VALUES (${sessionId}, ${question.text}, ${question.key}, ${question.options}::text[])
          `;
        }
      } catch (error) {
        console.error('Error storing questions:', error);
        throw error;
      }
    }

    return NextResponse.json({
      success: true,
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
