# TwitX

I wanted to post about tech on X regularly, but most of my time went into scrolling Reddit and Hacker News looking for something worth writing about, not into writing. TwitX does the scrolling part for me. Twice a day it looks at what is trending on Reddit, Hacker News and GitHub, writes a few draft posts in my style, and sends them to me on Telegram. I approve, edit or skip each one. It never posts anything by itself.

It is a personal tool, not a product.

## How it works

```
GitHub Actions cron (twice a day)
        |
        v
Fetch:  Reddit top posts  +  Hacker News top stories  +  new GitHub repos
        |
        v
Score:  keyword hits for my niches + popularity  ->  keep the top 15
        |
        v
Draft:  LLM (Groq, Llama 3.3 70B by default) with my own sample tweets,
        my chosen tone, and my recent approve / edit / skip history
        |
        v
Save:   drafts stored in PostgreSQL first
        |
        v
Send:   Telegram message per draft with Approve / Skip / Edit buttons
        |
        v
My choice is saved as feedback and used in the next run's prompt
```

## Design choices

**Drafts, not auto-posting.** The model is often confidently wrong, and these posts go out under my name. Reviewing a draft on Telegram takes a few seconds, so the human check costs very little. It also gives me the feedback loop: every approve, edit or skip is a label for what my voice actually sounds like.

**Cheap filter before the LLM.** Every fetched item gets a simple score (keyword matches for my niches plus a log of its upvotes or stars). Only the top 15 are kept, and the best 10 of those go into the prompt. This keeps prompts small, avoids wasting calls on irrelevant links, and gives the model better material.

**My own tweets as the anchor.** The prompt puts my sample tweets first, then posts I approved or edited, then posts I skipped as things to avoid. It also bans patterns that make posts read as AI-written: hashtags, decorative emojis, engagement-bait questions and stock openers. Stock openers are allowed only when the tone is set to opinionated.

**Save first, deliver second.** Drafts are written to the database before the Telegram message goes out, so a failed notification never loses a draft. They still show up in the dashboard.

**GitHub Actions as the scheduler.** The backend runs on Vercel serverless functions, which are not built for long scheduled jobs. A GitHub Actions cron runs the pipeline twice a day for free.

## Stack

- **Backend:** Node.js, Express, TypeScript, Prisma
- **Database:** PostgreSQL on Supabase
- **Web dashboard:** Next.js, Clerk for login. Used to set niches, tone, sample tweets and the delivery channel, and to see past drafts.
- **AI:** any OpenAI-compatible API (Groq by default)
- **Delivery:** Telegram Bot API with inline buttons, via a webhook that checks an optional secret token
- **Scheduling:** GitHub Actions cron

## Project structure

```
apps/server     Express API, pipeline, fetchers, prompt builder, Telegram bot
apps/web        Next.js dashboard (onboarding, preferences, drafts)
.github/workflows/cron.yml   runs the pipeline at 09:00 and 19:00 UTC
```

## Running it locally

```bash
cd apps/server
cp .env.example .env        # fill in database, Clerk, Groq and Telegram keys
npm install
npm run prisma:migrate
npm run dev                 # API on http://localhost:3001

npm run test:fetchers       # check Reddit, HN and GitHub fetching
npm run pipeline:run        # run one full pipeline pass

cd ../web
cp .env.local.example .env.local   # fill in Clerk keys
npm install
npm run dev                 # dashboard on http://localhost:3000
```

Reddit blocks unauthenticated requests from most servers, so create a "script" app on Reddit and set `REDDIT_CLIENT_ID` and `REDDIT_CLIENT_SECRET`.

## What I would do next

- Replace keyword scoring with embeddings, so a post about "inference" matches my AI niche even without the exact keyword.
- Track which approved drafts I actually posted and how they did, and use that as a stronger signal than approve or skip.
- Add a simple test suite for the scoring and prompt-building functions.
