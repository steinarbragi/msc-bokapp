import { NextResponse } from 'next/server';
import { Anthropic } from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

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
        tools: [
          {
            name: 'get_follow_up_questions',
            description:
              'Búðu til 3 framhaldsspurningar byggðar á svörum við könnun. Spurningarnar ættu að tengjast fyrri svörum og hjálpa til við að sérsníða söguna enn frekar. Hver spurning ætti að hafa 3-8 valmöguleika og má valfrjálst leyfa sérsniðinn texta.',
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
                        description: 'unique identifier for the question',
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
    const userSurveyResponses = body.surveyResponses;

    const response = await createMessageWithRetry([
      {
        role: 'user',
        content: `Þú VERÐUR að nota uppgefna fallið til að skila skipulögðum framhaldsspurningum.
Ekki svara með texta eða útskýringum - AÐEINS nota fallið.
Fallið krefst nákvæmlega 3 spurninga, hver með 3-8 valmöguleika.
Hver spurning verður að hafa einkvæmt auðkenni, texta, tegund (single-choice eða multiple-choice) og valmöguleikafjölda.
allowTextInput reiturinn er valfrjáls og er sjálfgefið false.

Út frá þessum svörum við könnuninni: ${JSON.stringify(userSurveyResponses, null, 2)}, búðu til 3 framhaldsspurningar sem myndu hjálpa til við að sérsníða söguna enn frekar.`,
      },
    ]);

    if (!response) {
      throw new Error('No response received from API');
    }

    // Log the response structure for debugging
    console.log('Response content:', JSON.stringify(response.content, null, 2));

    // Extract questions from the response
    let questions = [];

    // First try to find questions in tool_use block
    for (const block of response.content) {
      if (block.type === 'tool_use') {
        console.log('Found tool_use block');
        // @ts-expect-error - block.input is not typed but exists at runtime
        if (block.input && block.input.questions) {
          // @ts-expect-error - block.input.questions is not typed but exists at runtime
          questions = block.input.questions;
          console.log(
            'Extracted questions from block.input.questions:',
            questions
          );
          break;
        }
      }
    }

    // If no questions found in tool_use block, try to parse JSON from text block
    if (!questions || questions.length === 0) {
      for (const block of response.content) {
        if (block.type === 'text') {
          try {
            // Extract JSON from the text block (removing markdown code block markers)
            const jsonStr = block.text.replace(/```json\n|\n```/g, '');
            const parsed = JSON.parse(jsonStr);
            if (
              parsed.followupQuestions &&
              Array.isArray(parsed.followupQuestions)
            ) {
              questions = parsed.followupQuestions;
              console.log(
                'Extracted questions from JSON text block:',
                questions
              );
              break;
            }
          } catch (e) {
            console.log('Failed to parse JSON from text block:', e);
          }
        }
      }
    }

    // If we still don't have valid questions, use fallbacks
    if (!questions || questions.length === 0) {
      console.log('No questions found, using fallbacks');
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
      questions,
      // Include the raw response for debugging
      rawResponse: response.content,
    });
  } catch (error) {
    console.error('Error generating follow-up questions:', error);
    return NextResponse.json(
      { error: 'Failed to generate follow-up questions' },
      { status: 500 }
    );
  }
}
