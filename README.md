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

# Set up environment variables
cp .dev.vars.example .dev.vars
# Edit .dev.vars with your API keys (see DEPLOYMENT.md for details)

# Create D1 database and run migrations
npm run db:create
npm run db:migrate:local

# Start dev server
npm run dev
```

For complete setup instructions, see **[DEPLOYMENT.md](DEPLOYMENT.md)**.

## Required Secrets

The bot requires four secrets to function:

- `WHATSAPP_API_TOKEN` - WhatsApp Business API access token
- `WHATSAPP_PHONE_NUMBER_ID` - WhatsApp Business phone number ID
- `PERPLEXITY_API_KEY` - Perplexity AI API key
- `WEBHOOK_VERIFY_TOKEN` - Custom webhook verification token

See **[DEPLOYMENT.md](DEPLOYMENT.md)** for detailed instructions on obtaining these credentials.

## WhatsApp Commands

- Subscribe, Unsubscribe
- Update Skill (1/2/3 or beginner/intermediate/advanced)
- Update Language
- Get Prompt, Help

## Architecture

Cloudflare Workers + D1 (SQLite) + Perplexity AI + WhatsApp Business API

Daily prompts sent via Cron Triggers at 8:00 AM UTC.

## Deployment

For production deployment:

```bash
# Authenticate with Cloudflare
wrangler login

# Create production database
wrangler d1 create painting_bot_db

# Run migrations
npm run db:migrate

# Set secrets
wrangler secret put WHATSAPP_API_TOKEN
wrangler secret put WHATSAPP_PHONE_NUMBER_ID
wrangler secret put PERPLEXITY_API_KEY
wrangler secret put WEBHOOK_VERIFY_TOKEN

# Deploy
npm run deploy
```

See **[DEPLOYMENT.md](DEPLOYMENT.md)** for complete deployment guide including WhatsApp webhook configuration.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## Security

See [SECURITY.md](SECURITY.md) for reporting vulnerabilities.

## License

GPL-3.0 - See [LICENSE](LICENSE) for details.
