
  # Full Stack System Development

  This is a code bundle for Full Stack System Development. The original project is available at https://www.figma.com/design/CAMYcfiNpXmWS8iPS3EtPJ/Full-Stack-System-Development.

  ## Running the code

  Run `npm i` to install the dependencies.

  Run `npm run dev` to start the development server.

  # Intelligent Application Screening Platform

AI-powered recruitment screening system for Emerge Livelihoods and Emerge Fund.

## Tech Stack
- React + TypeScript + Vite (frontend)
- Supabase (database + edge functions + storage)
- Claude AI / Anthropic API (CV parsing)
- Tailwind CSS + shadcn/ui (styling)

## Setup

### 1. Install dependencies
npm install

### 2. Configure Supabase
Copy your Supabase project credentials into:
utils/supabase/info.tsx

### 3. Run database setup
Run supabase_setup.sql in your Supabase SQL Editor.

### 4. Set secrets in Supabase
supabase secrets set ANTHROPIC_API_KEY=your-key-here

### 5. Deploy Edge Function
supabase functions deploy server --project-ref your-project-ref

### 6. Start development server
npm run dev
  