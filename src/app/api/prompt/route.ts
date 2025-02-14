import { NextResponse } from 'next/server';
import { Anthropic } from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { surveyResponses } = body;

    // Format survey responses into a prompt for Claude
    const prompt = `Based on the following survey responses from a child reader, suggest an ideal book cover description:

Reader Profile:
- Gender: ${surveyResponses['reader-gender']}
- Age: ${surveyResponses['reader-age']} 
- Favorite Genres: ${surveyResponses['reader-favorite-genre'].join(', ')}

Character Preferences:
${surveyResponses['main-character-traits']?.join('\n')}

Plot Elements:
${surveyResponses['story-plot']?.join('\n')}

Please describe in detail what the ideal book cover should look like for this reader. Include:

- Any text treatment suggestions
Keep the description focused on the textual description of the book and it's plot.`;

    const response = await anthropic.messages.create({
      model: 'claude-3-opus-20240229',
      max_tokens: 1000,
      messages: [
        {
          role: 'user',
          content: prompt,
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
