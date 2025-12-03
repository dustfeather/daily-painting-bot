# Daily Painting Bot

A WhatsApp bot that delivers personalized painting prompts every morning, powered by Cloudflare Workers and Perplexity AI.

## Features

- 🎨 Daily AI-generated painting prompts tailored to skill level
- 🌍 Multi-language support (11 languages)
- 📱 WhatsApp-based interaction
- ⚡ Serverless on Cloudflare Workers + D1

## Quick Start

```bash
# Install dependencies
npm install

# Create D1 database (copy the ID to wrangler.toml)
npm run db:create

# Set up environment variables
cp .dev.vars.example .dev.vars
# Edit .dev.vars with your API keys

# Run migrations
npm run db:migrate:local

# Start dev server
npm run dev

# Deploy to production
npm run deploy
```

## Required API Keys

- **WhatsApp Business API**: Get from [Meta for Developers](https://developers.facebook.com/)
- **Perplexity AI**: Get from [Perplexity Settings](https://www.perplexity.ai/settings/api)

## WhatsApp Commands

- Subscribe, Unsubscribe
- Update Skill (1/2/3 or beginner/intermediate/advanced)
- Update Language
- Get Prompt, Help

## Architecture

Cloudflare Workers + D1 (SQLite) + Perplexity AI + WhatsApp Business API

Daily prompts sent via Cron Triggers at 8:00 AM UTC.

## License

ISC
