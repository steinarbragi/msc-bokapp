import { NextResponse } from 'next/server';
import { Anthropic } from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

const surveyResponses = {
  'main-character-traits': ['Sterk 💪', 'asdf'],
  'reader-age': '6-7 ára 🌱',
  'reader-favorite-genre': ['Húmor 😄', 'Vísindasögur 🔬', 'Íþróttasögur ⚽'],
  'reader-gender': 'Annað 🦸',
  'story-location': ['Úti í náttúrunni 🌲', 'Í skóla 📚', 'Í framtíðinni 🚀'],
  'story-plot': [
    'Bjarga einhverjum/einhverju 🦸',
    'Eignast nýja vini 🤝',
    'Sigrast á erfiðu verkefni ⭐',
  ],
};

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const userSurveyResponses = body.surveyResponses || surveyResponses;

    const response = await anthropic.messages.create({
      model: 'claude-3-5-haiku-20241022',
      max_tokens: 1000,
      messages: [
        {
          role: 'user',
          content: `Based on these survey responses: ${JSON.stringify(userSurveyResponses, null, 2)}, generate 3 follow-up questions that would help personalize the story further.`,
        },
      ],
      system: 'Use the function to return structured follow-up questions.',
      tools: [
        {
          type: 'function',
          function: {
            name: 'get_follow_up_questions',
            description:
              'Generate 3 follow-up questions based on survey responses. The questions should be relevant to the previous responses and help further personalize the story. Each question should have 3-8 options and may optionally allow custom text input.',
            parameters: {
              type: 'object',
              properties: {
                questions: {
                  type: 'array',
                  description: 'List of follow-up questions',
                  items: {
                    type: 'object',
                    properties: {
                      text: {
                        type: 'string',
                        description: 'The question text',
                      },
                      id: {
                        type: 'string',
                        description: 'Unique key for the question',
                      },
                      type: {
                        type: 'string',
                        enum: ['single-choice', 'multiple-choice'],
                        description: 'Type of question',
                      },
                      options: {
                        type: 'array',
                        description: 'Answer options for the question',
                        items: { type: 'string' },
                        minItems: 3,
                        maxItems: 8,
                      },
                      allowTextInput: {
                        type: 'boolean',
                        description: 'Whether to allow custom text input',
                      },
                    },
                    required: ['id', 'text', 'type', 'options'],
                  },
                },
              },
              required: ['questions'],
            },
          },
        },
      ],
    });

    // Log the response structure for debugging
    console.log('Response content:', JSON.stringify(response.content, null, 2));

    // Extract tool calls from the response
    const block = response.content[0];
    if (!block) {
      throw new Error('Empty response content');
    }

    // Handle the response based on its type
    let questions;
    if (block.type === 'tool_use') {
      const toolCall = (block as any).tool_calls?.[0];
      if (toolCall?.type === 'function') {
        questions = JSON.parse(toolCall.function.arguments).questions;
      }
    } else if (block.type === 'text') {
      questions = JSON.parse((block as any).text).questions;
    }

    if (!questions) {
      questions = [];
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
