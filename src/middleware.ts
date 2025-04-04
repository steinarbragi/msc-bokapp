import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { Redis } from '@upstash/redis';

// Default rate limit settings
const RATE_LIMIT_WINDOW = 60; // 1 minute in seconds
const MAX_REQUESTS_PER_WINDOW = 60; // Increased from 30 to 60 requests per minute
const MAX_REQUEST_SIZE = 1024 * 1024; // 1MB

// Endpoint-specific rate limits
const endpointRateLimits: Record<string, number> = {
  '/api/describe': 100, // Allow more requests for describe API
  '/api/recommend': 80, // Recommend API gets higher limit
  '/api/search': 120, // Search API gets highest limit
  '/api/survey/questions': 30, // Lower limit for survey questions
  '/api/survey/submit': 15, // Very low limit for survey submissions
};

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

// Helper function to check if request is from localhost
function isLocalhost(request: NextRequest): boolean {
  const host = request.headers.get('host') || '';
  return host.includes('localhost') || host.includes('127.0.0.1');
}

// Helper function to check rate limit using Redis
async function isRateLimited(ip: string, pathname: string): Promise<boolean> {
  const key = `rate_limit:${ip}`;

  // Get endpoint-specific limit or use default
  const limitForEndpoint =
    endpointRateLimits[pathname] || MAX_REQUESTS_PER_WINDOW;

  try {
    // Get current count
    const count = (await redis.get<number>(key)) || 0;

    if (count >= limitForEndpoint) {
      // Log rate limit events in production
      if (process.env.NODE_ENV === 'production') {
        console.warn(
          `Rate limit exceeded for IP: ${ip}, endpoint: ${pathname}, count: ${count}`
        );
      }
      return true;
    }

    // Increment count and set expiry if it's a new key
    if (count === 0) {
      await redis.set(key, 1, { ex: RATE_LIMIT_WINDOW });
    } else {
      await redis.incr(key);
    }

    // When approaching rate limit, log a warning
    if (count >= limitForEndpoint * 0.8) {
      console.warn(
        `IP ${ip} approaching rate limit: ${count}/${limitForEndpoint} for endpoint ${pathname}`
      );
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
  // Enable DNS prefetching for better performance
  response.headers.set('X-DNS-Prefetch-Control', 'on');

  // Force HTTPS and set cache duration to 1 year (31536000 seconds)
  response.headers.set(
    'Strict-Transport-Security',
    'max-age=31536000; includeSubDomains'
  );

  // Prevent site from being embedded in iframes on other domains
  response.headers.set('X-Frame-Options', 'SAMEORIGIN');

  // Prevent MIME type sniffing security risks
  response.headers.set('X-Content-Type-Options', 'nosniff');

  // Control how much referrer information is included with requests
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

  // Explicitly disable access to sensitive device features
  response.headers.set(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=()'
  ); // deny access to camera, microphone, and geolocation

  // Skip rate limiting for localhost or development environment
  const isDevelopment = process.env.NODE_ENV === 'development';
  const isLocalRequest = isLocalhost(request);

  if (!isDevelopment && !isLocalRequest) {
    // Check rate limit
    const ip = getClientIp(request);
    const pathname = request.nextUrl.pathname;
    const isLimited = await isRateLimited(ip, pathname);
    if (isLimited) {
      // Store rate limit event for analytics
      try {
        const rateLimitKey = `rate_limit_events:${new Date().toISOString().split('T')[0]}`;
        await redis.hincrby(rateLimitKey, pathname, 1);
        await redis.expire(rateLimitKey, 60 * 60 * 24 * 7); // Keep for a week
      } catch (error) {
        console.error('Failed to log rate limit event:', error);
      }

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
