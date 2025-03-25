import { NextResponse } from 'next/server';
import { Anthropic } from '@anthropic-ai/sdk';

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
      });
    } catch (error: unknown) {
      // Check if error is an Error object with status 529
      if (error instanceof Error && 'status' in error && error.status === 529) {
        console.log(
          `Attempt ${attempt + 1} of ${maxRetries} failed with overloaded error on model ${currentModel}, retrying...`
        );

        // If we're using Sonnet, switch to Haiku
        if (currentModel === 'claude-3-7-sonnet-latest') {
          console.log('Switching to Haiku model...');
          currentModel = 'claude-3-5-haiku-latest';
          continue;
        }

        if (attempt === maxRetries - 1) {
          throw error; // Rethrow if we're out of retries
        }
        // Exponential backoff: 2s, 4s, 8s
        const delayTime = Math.pow(2, attempt) * 2000;
        console.log(`Waiting ${delayTime / 1000} seconds before retry...`);
        await delay(delayTime);
        continue;
      }
      throw error; // Rethrow other errors
    }
  }
  throw new Error('Failed to create message after all retries');
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { surveyResponses } = body;

    // Build preferences string from all survey responses
    const preferences = Object.entries(surveyResponses)
      .map(([key, value]) => {
        // Handle array values by joining with commas
        const formattedValue = Array.isArray(value) ? value.join(', ') : value;
        return `${key}: ${formattedValue}`;
      })
      .join('\n');

    const response = await createMessageWithRetry([
      {
        role: 'user',
        content: `Generate a book back cover description in Icelandic. 
            Only return the text for the back cover. 
            Do not include any other text.
            Do not include character names.
            It's for a reader with these preferences:
            ${preferences}`,
      },
    ]);

    return NextResponse.json({
      success: true,
      coverDescription:
        'text' in response.content[0] ? response.content[0].text : '',
    });
  } catch (error) {
    console.error('Error generating book cover description:', error);
    return NextResponse.json(
      { error: 'Failed to generate book cover description' },
      { status: 500 }
    );
  }
}
