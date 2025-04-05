import { NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';

// Initialize Redis client
const redis = new Redis({
  url: process.env.UPSTASH_KV_REST_API_URL!,
  token: process.env.UPSTASH_KV_REST_API_TOKEN!,
});

type RecommendationResult = {
  recommendations: Array<{
    id: string;
    book_id: string;
    reasoning: string;
    metadata: {
      title: string;
      description: string;
      image_filename: string;
      url: string;
    };
  }>;
};

export async function POST(req: Request) {
  try {
    const { sessionId } = await req.json();

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID is required' },
        { status: 400 }
      );
    }

    const inProgressKey = `in_progress:${sessionId}`;
    const result = await redis.get<RecommendationResult | 'processing'>(
      inProgressKey
    );

    if (!result) {
      return NextResponse.json({ isProcessing: false });
    }

    if (result === 'processing') {
      return NextResponse.json({ isProcessing: true });
    }

    // The result is already an object, no need to parse
    return NextResponse.json({
      isProcessing: false,
      recommendations: result.recommendations,
    });
  } catch (error) {
    console.error('Error in status endpoint:', error);
    return NextResponse.json(
      { error: 'Failed to check status' },
      { status: 500 }
    );
  }
}
