# Twitter Copilot — Server

Express + TypeScript + Prisma backend for the Twitter Copilot MVP.

## Phase 0 setup

### 1. Create the Supabase project

1. Go to [supabase.com](https://supabase.com), create a new project.
2. Once it's ready, open **Project Settings → Database**.
3. Under **Connection string**, pick **URI** (transaction pooler is fine for Prisma migrate too, but for first migrate use the direct connection on port 5432).
4. Copy the string. It looks like:
   `postgresql://postgres:[YOUR-PASSWORD]@db.[REF].supabase.co:5432/postgres`

### 2. Create your `.env`

```bash
cp .env.example .env
```

Fill in `DATABASE_URL` with the Supabase string. Leave the other API keys blank for now — they're for later phases.

### 3. Run the migration

```bash
npm run prisma:migrate -- --name init
```

This creates all tables (`User`, `UserPreference`, `SourceContent`, `GeneratedPost`, `Feedback`) in Supabase and generates the Prisma client.

### 4. Start the dev server

```bash
npm run dev
```

Hit `http://localhost:3001/health` — you should get:

```json
{ "status": "ok", "db": "connected" }
```

If `db` is `unreachable`, the migration didn't run or `DATABASE_URL` is wrong.

## Scripts

| Script | What it does |
|---|---|
| `npm run dev` | Start with `tsx watch` (hot reload) |
| `npm run build` | Compile to `dist/` |
| `npm start` | Run compiled output |
| `npm run prisma:migrate` | Create/apply a new migration |
| `npm run prisma:generate` | Regenerate Prisma client (run after schema edits) |
| `npm run prisma:studio` | Open Prisma Studio GUI on the DB |
