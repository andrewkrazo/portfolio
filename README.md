# Andrew Razo's portfolio

One page, two moods: LA at night and Providence by day. The sky follows each city's real clock, and the city is drawn on a canvas in code.

**Stack:** Next.js, React, TypeScript, Canvas 2D, Claude API.

```bash
npm install
npm run dev
```

Copy `.env.example` to `.env.local` and set `ANTHROPIC_API_KEY` to turn on the ask bar. Everything else works without it.

## Where things live

- `lib/content.ts`: all the words on the page, and the LinkedIn and resume links
- `lib/sky.ts`: the sky colors for each hour in each city
- `lib/scene.ts`: the drawn LA and Providence scenery
- `lib/knowledge.ts` and `app/api/ask/route.ts`: the ask bar, which answers only from the page's own content
