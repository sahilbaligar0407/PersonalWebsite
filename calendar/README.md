# SmartCal – Calendar AI Web Application

A student productivity platform that organizes academic assignments into a calendar and recommends what to work on next.

## Features

- **Calendar import** – Paste your Brightspace calendar subscription link (.ics) to auto-import assignments
- **AI parsing** – Add assignments by pasting text or uploading screenshots via the AI chat
- **Recommended tasks** – Prioritized list of assignments due in the next 14 days
- **Multiple views** – Month, Week, and Day calendar views
- **Manual entries** – Add assignments manually with course colors
- **Duplicate prevention** – No duplicate assignments (same course, name, due date)
- **Auth** – Sign up / Sign in with Supabase (optional; AI and save require login)

## Tech Stack

- Vite, React, TypeScript
- Tailwind CSS, shadcn/ui
- Supabase (Auth + PostgreSQL)
- Framer Motion, ical.js

## Setup

1. **Clone and install**

   ```sh
   git clone <YOUR_GIT_URL>
   cd smart-schedule-hub
   npm install
   ```

2. **Environment variables**

   Create a `.env` file in the project root (see `.env.example`). **Important:** use the exact names below — Vite exposes only variables prefixed with `VITE_` to the client.

   ```
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key
   VITE_OPENAI_API_KEY=your-openai-api-key
   ```

   - **Supabase** – Create a project at [supabase.com](https://supabase.com), then run the SQL in `supabase/migrations/001_initial_schema.sql` in the SQL Editor.
   - **OpenAI** – Get an API key from [platform.openai.com](https://platform.openai.com) for AI assignment parsing.

3. **Run the dev server**

   ```sh
   npm run dev
   ```

   Open http://localhost:8080

## Scripts

- `npm run dev` – Start development server
- `npm run build` – Production build
- `npm run preview` – Preview production build
- `npm run lint` – Run ESLint
