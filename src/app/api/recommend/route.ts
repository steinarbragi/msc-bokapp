import { NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

export const maxDuration = 150;

type Book = {
  metadata: {
    title: string;
    description: string;
    image_url: string;
    url: string;
    id: string;
  };
};

export async function POST(req: Request) {
  try {
    const { searchResults, readBooks } = await req.json();

    // Filter out already read books
    const unreadBooks = searchResults.filter(
      (book: Book) => !readBooks.includes(book.metadata.id)
    );

    // Prepare the prompt for Claude
    const prompt = `Þú ert bókmenntafræðingur sem sérhæfir þig í að mæla með bókum.
    
Hér er listi af bókum sem notandi hefur ekki lesið:
${unreadBooks.map((book: Book) => `- ${book.metadata.title}: ${book.metadata.description}`).join('\n')}

Veldu 10 bestu bækurnar úr listanum og útskýrðu í STUTTU máli (hámark 2 setningar) af hverju hver bók er góður kostur.
Svarið þarf að vera á forminu:
1. [Titill bókar]: [Útskýring]
2. [Titill bókar]: [Útskýring]
osf.`;

    const completion = await anthropic.messages.create({
      messages: [{ role: 'user', content: prompt }],
      model: 'claude-3-5-haiku-20241022',
      max_tokens: 1000,
    });

    const recommendations =
      'text' in completion.content[0] ? completion.content[0].text : '';

    // Match the recommendations with the full book data
    const recommendedBooks = unreadBooks.slice(0, 10).map((book: Book) => ({
      ...book,
      reasoning:
        recommendations
          ?.split('\n')
          .find((line: string) => line.includes(book.metadata.title))
          ?.split(': ')[1] || 'Engin útskýring tiltæk',
    }));

    return NextResponse.json({ recommendations: recommendedBooks });
  } catch (error) {
    console.error('Error in recommend route:', error);
    return NextResponse.json(
      { error: 'Failed to process recommendations' },
      { status: 500 }
    );
  }
}
