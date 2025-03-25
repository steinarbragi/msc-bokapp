import { NextResponse } from 'next/server';
import { Anthropic } from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const userSurveyResponses = body.surveyResponses;

    const response = await anthropic.messages.create({
      model: 'claude-3-7-sonnet-latest',
      max_tokens: 1000,
      messages: [
        {
          role: 'user',
          content: `Út frá þessum svörum við könnuninni: ${JSON.stringify(userSurveyResponses, null, 2)}, búðu til 3 framhaldsspurningar sem myndu hjálpa til við að sérsníða söguna enn frekar.`,
        },
      ],
      system: `Þú VERÐUR að nota uppgefna fallið til að skila skipulögðum framhaldsspurningum.
Ekki svara með texta eða útskýringum - AÐEINS nota fallið.
Fallið krefst nákvæmlega 3 spurninga, hver með 3-8 valmöguleika.
Hver spurning verður að hafa einkvæmt auðkenni, texta, tegund (single-choice eða multiple-choice) og valmöguleikafjölda.
allowTextInput reiturinn er valfrjáls og er sjálfgefið false.`,
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

    // Log the response structure for debugging
    console.log('Response content:', JSON.stringify(response.content, null, 2));

    // Extract questions from the response
    let questions = [];

    // Look through all blocks to find the tool_use block with questions
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
          break; // Found questions, no need to look further
        }
      }
    }

    // If we don't have valid questions, use fallbacks
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
