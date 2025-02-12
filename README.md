# AI-Powered Children's Book Recommendation System

A web application that uses artificial intelligence for personalized children's book recommendations. The system employs a conversational approach, asking users questions about their interests and reading history, then uses AI to formulate follow-up questions for better understanding. Based on these interactions, it provides personalized book recommendations.

## Technical Stack

- **Frontend**: [Next.js](https://nextjs.org) with [Tailwind CSS](https://tailwindcss.com)
- **Forms**: [React Hook Form](https://react-hook-form.com)
- **Backend**: [Next.js API routes](https://nextjs.org/docs/api-routes/introduction), [Pinecone API](https://www.pinecone.io), [Anthropic Claude API](https://www.anthropic.com), [OpenAI API](https://openai.com/api)
- **Databases**: 
  - [PostgreSQL](https://www.postgresql.org) for book metadata and user information
  - [Redis](https://redis.io) for caching and performance optimization (TODO)
- **AI/ML**:
  - [Anthropic Claude API](https://www.anthropic.com) for natural language processing and question generation
  - [Pinecone](https://www.pinecone.io) for vector similarity search and recommendation engine
- **Data Source**: Scraped book data from [Forlagid's website](https://www.forlagid.is)

## Key Features

- [x] Custom child-friendly survey UI
- [ ] AI assisted question personalization
- [ ] User response analysis for personalized recommendations
- [x] Semantic search capabilities for book matching
- [ ] Performance optimization through Redis caching
- [ ] Anonymous data collection for research purposes

This project is being developed as part of a master's thesis to explore how AI can assist children in finding appropriate reading material.


## Next.js introduction

This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.
