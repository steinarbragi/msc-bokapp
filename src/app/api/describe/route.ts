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

interface SurveyResponse {
  [key: string]: string | string[] | undefined;
}

interface BookDescription {
  title: string;
  description: string;
  ageGroup: string;
  readingTime: string;
  themes: string[];
}

interface ToolUseBlock {
  type: 'tool_use';
  input: {
    title?: string;
    description?: string;
    ageGroup?: string;
    readingTime?: string;
    themes?: string[];
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
            name: 'generate_book_description',
            description:
              'Generate a personalized book description based on survey responses',
            input_schema: {
              type: 'object',
              properties: {
                title: {
                  type: 'string',
                  description: 'The title of the book in Icelandic',
                },
                description: {
                  type: 'string',
                  description:
                    'A detailed description of the book in Icelandic',
                },
                ageGroup: {
                  type: 'string',
                  description: 'The recommended age group for the book',
                },
                readingTime: {
                  type: 'string',
                  description: 'Estimated reading time in minutes',
                },
                themes: {
                  type: 'array',
                  description: 'Key themes or topics in the book',
                  items: { type: 'string' },
                },
              },
              required: [
                'title',
                'description',
                'ageGroup',
                'readingTime',
                'themes',
              ],
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
      return NextResponse.json(
        { error: 'Session ID is required' },
        { status: 400 }
      );
    }

    const sql = neon(process.env.DATABASE_URL!);

    // Store all survey responses
    for (const [questionKey, response] of Object.entries(surveyResponses)) {
      try {
        await sql`
          INSERT INTO question_responses (session_id, question_key, response)
          VALUES (${sessionId}, ${questionKey}, ${typeof response === 'object' ? JSON.stringify(response) : response})
          ON CONFLICT (session_id, question_key) 
          DO UPDATE SET response = ${typeof response === 'object' ? JSON.stringify(response) : response}
        `;
      } catch (error) {
        console.error('Error storing response:', error);
        throw error;
      }
    }

    // Build preferences string from all survey responses
    const preferences = Object.entries(surveyResponses)
      .map(([key, value]) => {
        // Handle array values by joining with commas
        const formattedValue = Array.isArray(value) ? value.join(', ') : value;
        return `${key}: ${formattedValue}`;
      })
      .join('\n');

    // Get book description based on responses
    const response = await createMessageWithRetry([
      {
        role: 'user',
        content: `Based on these survey responses: ${preferences}

Generate a personalized book description that matches the user's preferences. The book should:
- Be appropriate for children aged 6-11
- Have a clear, engaging title in Icelandic
- Include a detailed description in Icelandic that highlights the key elements
- Specify the recommended age group
- Include estimated reading time
- List key themes or topics

Make sure the description is engaging and matches the user's interests and preferences.`,
      },
    ]);

    // Process each block in the response
    let bookDescription: BookDescription | null = null;
    if (response?.content) {
      for (const block of response.content) {
        if (block.type === 'tool_use' && 'input' in block) {
          const toolUseBlock = block as ToolUseBlock;
          if (toolUseBlock.input?.title) {
            bookDescription = {
              title: toolUseBlock.input.title,
              description: toolUseBlock.input.description || '',
              ageGroup: toolUseBlock.input.ageGroup || '6-11 ára',
              readingTime: toolUseBlock.input.readingTime || '15-20 mínútur',
              themes: toolUseBlock.input.themes || [],
            };
            break;
          }
        }
      }
    }

    // Keep fallback log
    if (!bookDescription) {
      console.log('No valid description found, using fallback');
      bookDescription = {
        title: 'Ævintýri í Dýragarðinum',
        description:
          'Saga um ungan dreng sem uppgötvar að hann getur talað við dýr. Með hjálp nýrra vina sinna í dýragarðinum leysir hann leyndardóm og hjálpar dýrunum að verja heimili þeirra.',
        ageGroup: '6-11 ára',
        readingTime: '15-20 mínútur',
        themes: [
          'Vinganir',
          'Ævintýri',
          'Dýr',
          'Leyndardómar',
          'Umhverfisvernd',
        ],
      };
    }

    // Store the book description in the database
    const descriptionId = crypto.randomUUID();
    try {
      await sql`
        INSERT INTO generated_descriptions (
          id,
          session_id,
          description_text
        ) VALUES (
          ${descriptionId},
          ${sessionId},
          ${JSON.stringify(bookDescription)}
        )
      `;
    } catch (error) {
      console.error('Error storing book description:', error);
      throw error;
    }

    return NextResponse.json({
      success: true,
      bookDescription,
      descriptionId,
    });
  } catch (error) {
    console.error('Error generating book description:', error);
    return NextResponse.json(
      { error: 'Failed to generate book description' },
      { status: 500 }
    );
  }
}
