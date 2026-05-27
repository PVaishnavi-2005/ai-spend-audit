# AI Spend Audit

This project is a founder-first AI spend audit app that helps startups spot overspend, compare lower-cost plan fits, and generate a shareable savings report in one pass. The current build focuses on a fast landing page, a finance-readable audit engine, and a public share page for lead generation.

## Screenshots
- Screenshot 1: Landing page / audit builder
- Screenshot 2: Savings summary + recommendations
- Screenshot 3: Public share page

## Quick start
1. npm install
2. npm run dev
3. npm run test
4. npm run lint

## Decisions
1. Next.js App Router was chosen to keep the audit page, API routes, and public share route in one coherent system.
2. The audit engine uses deterministic rules instead of LLM math so the savings recommendations remain explainable.
3. Local storage persists the tool rows across reloads to reduce drop-off.
4. The summary endpoint falls back to a templated summary if the Anthropic API is unavailable.
5. Lead capture uses a honeypot + rate limit instead of a heavier third-party anti-abuse stack.

## Deployed URL
The live deployment URL will be set after the Vercel or Netlify deploy step.
