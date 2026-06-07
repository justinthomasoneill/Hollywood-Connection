# Hollywood Connections 🎬

A quiz game where you connect two movie stars by naming shared co-stars and films.

## Setup

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Add your Anthropic API key**
   ```bash
   cp .env.example .env.local
   ```
   Then edit `.env.local` and replace `your_api_key_here` with your key from https://console.anthropic.com

3. **Run locally**
   ```bash
   npm run dev
   ```
   Open http://localhost:3000

## Deploy to Vercel

1. Push this folder to a GitHub repository
2. Go to https://vercel.com and import the repo
3. In Vercel's project settings, add an environment variable:
   - Name: `ANTHROPIC_API_KEY`
   - Value: your key from https://console.anthropic.com
4. Deploy — Vercel gives you a live URL instantly

## How to play

Pick a difficulty, then connect the two displayed actors by naming:
- A **movie** they appeared in
- A **co-star** from that movie

Keep chaining until you reach the target actor. Fewer moves = better score!
