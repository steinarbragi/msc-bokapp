import { NextResponse } from 'next/server';
import { Anthropic } from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { surveyResponses } = body;

    const response = await anthropic.messages.create({
      model: 'claude-3-5-haiku-20241022',
      max_tokens: 1000,
      messages: [
        {
          role: 'user',
          content: `Generate a book back cover description in Icelandic. 
            Only return the text for the back cover. 
            Do not include any other text.
            Do not include character names. 
            It's for a reader with these preferences:
            Gender: ${surveyResponses['reader-gender']}
            Age: ${surveyResponses['reader-age']}
            Favorite Genres: ${surveyResponses['reader-favorite-genre'].join(', ')}
            Character Traits: ${surveyResponses['main-character-traits'].join(', ')}
            Plot Elements: ${surveyResponses['story-plot'].join(', ')}`,
        },
      ],
    });

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
