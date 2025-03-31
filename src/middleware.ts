import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { Redis } from '@upstash/redis';

const RATE_LIMIT_WINDOW = 60; // 1 minute in seconds
const MAX_REQUESTS_PER_WINDOW = 30; // 30 requests per minute
const MAX_REQUEST_SIZE = 1024 * 1024; // 1MB

// Initialize Redis client
const redis = new Redis({
  url: process.env.UPSTASH_KV_REST_API_URL!,
  token: process.env.UPSTASH_KV_REST_API_TOKEN!,
});

// Helper function to get client IP
function getClientIp(request: NextRequest): string {
  const forwardedFor = request.headers.get('x-forwarded-for');
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim();
  }
  // Fallback to a default value if no IP is found
  return 'unknown';
}

// Helper function to check rate limit using Redis
async function isRateLimited(ip: string): Promise<boolean> {
  const key = `rate_limit:${ip}`;

  try {
    // Get current count
    const count = (await redis.get<number>(key)) || 0;

    if (count >= MAX_REQUESTS_PER_WINDOW) {
      return true;
    }

    // Increment count and set expiry if it's a new key
    if (count === 0) {
      await redis.set(key, 1, { ex: RATE_LIMIT_WINDOW });
    } else {
      await redis.incr(key);
    }

    return false;
  } catch (error) {
    console.error('Rate limiting error:', error);
    // If Redis fails, allow the request to proceed
    return false;
  }
}

// Helper function to validate session ID format
function isValidSessionId(sessionId: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
    sessionId
  );
}

export async function middleware(request: NextRequest) {
  // Only apply to API routes
  if (!request.nextUrl.pathname.startsWith('/api/')) {
    return NextResponse.next();
  }

  // Add security headers
  const response = NextResponse.next();

  // Security headers
  response.headers.set('X-DNS-Prefetch-Control', 'on');
  response.headers.set(
    'Strict-Transport-Security',
    'max-age=31536000; includeSubDomains'
  );
  response.headers.set('X-Frame-Options', 'SAMEORIGIN');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=()'
  );

  // Check rate limit
  const ip = getClientIp(request);
  const isLimited = await isRateLimited(ip);
  if (isLimited) {
    return new NextResponse(
      JSON.stringify({ error: 'Too many requests. Please try again later.' }),
      {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'Retry-After': RATE_LIMIT_WINDOW.toString(),
        },
      }
    );
  }

  // Check request size for POST requests
  if (request.method === 'POST') {
    const contentLength = request.headers.get('content-length');
    if (contentLength && parseInt(contentLength) > MAX_REQUEST_SIZE) {
      return new NextResponse(JSON.stringify({ error: 'Request too large' }), {
        status: 413,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  }

  // Validate session ID for routes that require it
  const sessionIdRoutes = [
    '/api/describe',
    '/api/recommend',
    '/api/search',
    '/api/survey/questions',
    '/api/survey/submit',
  ];
  if (sessionIdRoutes.includes(request.nextUrl.pathname)) {
    const body = await request
      .clone()
      .json()
      .catch(() => ({}));
    if (!body.sessionId || !isValidSessionId(body.sessionId)) {
      return new NextResponse(
        JSON.stringify({ error: 'Invalid or missing session ID' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }
  }

  return response;
}

// Configure which routes to run middleware on
export const config = {
  matcher: '/api/:path*',
};
