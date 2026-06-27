# SiteScope

Instant SEO, accessibility, and performance audits for any URL — built with Next.js, TypeScript, and Tailwind CSS.

## Overview

SiteScope analyzes a website's HTML and returns a weighted health score (0–100) along with a detailed breakdown of what's working and what isn't — covering SEO fundamentals, accessibility basics, and lightweight performance signals.

## Features

- 🔍 **SEO checks** — title tag, meta description, canonical URL, Open Graph tags, heading structure
- ♿ **Accessibility checks** — image alt text, `lang` attribute, accessible button labels
- ⚡ **Performance signals** — response time, HTTP status, inline style usage
- 📊 **Weighted scoring** — each check contributes to an overall site health score
- 🎨 **Clean, dark UI** — built with Tailwind CSS

## Tech Stack

- [Next.js 14](https://nextjs.org/) (App Router)
- [TypeScript](https://www.typescriptlang.org/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Cheerio](https://cheerio.js.org/) for server-side HTML parsing
- [Supabase](https://supabase.com/) (planned: auth + audit history)

## Getting Started

\`\`\`bash
npm install
npm run dev
\`\`\`

Open [http://localhost:3000](http://localhost:3000) and enter any URL to run an audit.

## Project Structure

\`\`\`
app/
├── api/audit/route.ts   # API route that runs the audit
├── page.tsx              # Main UI
└── layout.tsx             # Root layout
lib/
└── audit-engine.ts        # Core scoring and check logic
\`\`\`

## Roadmap

- [ ] Supabase auth (save and revisit past audits)
- [ ] Lighthouse-style performance metrics
- [ ] Exportable PDF reports

## Author

Built by [Sude Suna](https://github.com/aalasudessuna) as part of a portfolio project.
