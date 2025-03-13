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
      model: 'claude-3-5-haiku-20241022',
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
                      description: 'Einkvæmur lykill fyrir spurninguna',
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

    // Extract tool calls from the response
    const block = response.content[0];
    if (!block) {
      throw new Error('Empty response content');
    }

    console.log('First content block type:', block.type);

    // Handle the response based on its type
    let questions = [];

    // Check if we have a tool_use block
    if (block.type === 'tool_use') {
      console.log('Found tool_use block');

      // Try to access input.questions directly
      // @ts-expect-error - We know this might exist based on the logs and need to bypass type checking since block.input is not typed
      if (block.input && block.input.questions) {
        // @ts-expect-error - block.input.questions is not typed but we know it exists at runtime
        questions = block.input.questions;
        console.log('Extracted questions from block.input.questions');
      }
      // Try to access tool_calls
      // @ts-expect-error - block.tool_calls is not typed in the Anthropic API types but exists at runtime
      else if (block.tool_calls && block.tool_calls.length > 0) {
        // @ts-expect-error - tool_calls array elements are not fully typed but we know they exist
        const toolCall = block.tool_calls[0];
        if (toolCall.type === 'function') {
          try {
            questions = JSON.parse(toolCall.function.arguments).questions;
            console.log('Extracted questions from tool_call arguments');
          } catch (e) {
            console.error('Error parsing tool_call arguments:', e);
          }
        }
      }
    }
    // Try to parse text content
    else if (block.type === 'text') {
      try {
        // Try to parse the text as JSON
        const textContent = (block as Anthropic.TextBlock).text;
        console.log('Text content:', textContent);

        // Check if the text contains a JSON object
        const jsonMatch = textContent.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const jsonStr = jsonMatch[0];
          const parsed = JSON.parse(jsonStr);
          questions = parsed.questions || [];
          console.log('Extracted questions from text content');
        }
      } catch (parseError) {
        console.error('Error parsing text response:', parseError);
        // Use fallback questions
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
    }

    // If we still don't have questions, use fallbacks
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
