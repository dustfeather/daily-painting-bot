# Configuration Overview

This document provides an overview of all configuration files and settings for the Daily Painting Bot.

## Configuration Files

### wrangler.toml

Main configuration file for Cloudflare Workers deployment.

**Location**: `./wrangler.toml`

**Key Settings**:
- Worker name and entry point
- Cron trigger schedule (daily at 8:00 AM UTC)
- D1 database binding
- Non-sensitive environment variables
- API endpoints and retry settings

**Customizable Settings**:
```toml
# Change delivery time (format: minute hour day month day-of-week)
[triggers]
crons = ["0 8 * * *"]  # Currently 8:00 AM UTC

# Adjust retry behavior
[vars]
MAX_RETRIES = "3"
RETRY_DELAY_MS = "1000"
```

### .dev.vars

Local development secrets (gitignored).

**Location**: `./.dev.vars`

**Setup**:
```bash
cp .dev.vars.example .dev.vars
# Edit with your actual credentials
```

**Contains**:
- `WHATSAPP_API_TOKEN`
- `WHATSAPP_PHONE_NUMBER_ID`
- `PERPLEXITY_API_KEY`
- `WEBHOOK_VERIFY_TOKEN`

### .dev.vars.example

Template for local development secrets.

**Location**: `./.dev.vars.example`

**Purpose**: Provides a template showing which secrets are required without exposing actual values.

## Environment Variables

### Non-Sensitive (in wrangler.toml)

| Variable | Value | Purpose |
|----------|-------|---------|
| `PERPLEXITY_API_URL` | `https://api.perplexity.ai` | Perplexity AI API endpoint |
| `PERPLEXITY_TEXT_MODEL` | `llama-3.1-sonar-small-128k-online` | Model for text generation |
| `PERPLEXITY_IMAGE_MODEL` | `playground-v2.5` | Model for image generation |
| `WHATSAPP_API_URL` | `https://graph.facebook.com/v18.0` | WhatsApp API endpoint |
| `MAX_RETRIES` | `3` | Number of retry attempts for API calls |
| `RETRY_DELAY_MS` | `1000` | Initial delay between retries (ms) |

### Sensitive (secrets)

| Secret | Purpose | Set Via |
|--------|---------|---------|
| `WHATSAPP_API_TOKEN` | WhatsApp API authentication | `wrangler secret put` |
| `WHATSAPP_PHONE_NUMBER_ID` | WhatsApp phone number identifier | `wrangler secret put` |
| `PERPLEXITY_API_KEY` | Perplexity AI authentication | `wrangler secret put` |
| `WEBHOOK_VERIFY_TOKEN` | WhatsApp webhook verification | `wrangler secret put` |

## Database Configuration

### D1 Database Binding

**Binding Name**: `DB`
**Database Name**: `painting_bot_db`
**Database ID**: Set after creation with `wrangler d1 create`

### Schema

The database includes three tables:
- `users` - User subscriptions and preferences
- `api_usage_logs` - API call tracking
- `delivery_logs` - Daily delivery reports

### Migrations

**Location**: `./migrations/`

**Commands**:
```bash
# Local development
npm run db:migrate:local

# Production
npm run db:migrate
```

## Cron Trigger Configuration

### Current Schedule

**Time**: 8:00 AM UTC daily
**Cron Expression**: `0 8 * * *`

### Changing the Schedule

Edit `wrangler.toml`:

```toml
[triggers]
crons = ["0 6 * * *"]  # Example: 6:00 AM UTC
```

**Common Schedules**:
- `0 8 * * *` - Daily at 8:00 AM UTC
- `0 6 * * *` - Daily at 6:00 AM UTC
- `0 12 * * 1-5` - Weekdays at 12:00 PM UTC
- `0 9 * * 1,3,5` - Mon/Wed/Fri at 9:00 AM UTC

After changing, redeploy:
```bash
npm run deploy
```

## API Configuration

### Perplexity AI

**Text Generation**:
- Model: `llama-3.1-sonar-small-128k-online`
- Used for generating painting prompt text

**Image Generation**:
- Model: `playground-v2.5`
- Used for generating inspiration images

### WhatsApp Business API

**Version**: v18.0
**Endpoint**: `https://graph.facebook.com/v18.0`

**Required Permissions**:
- `whatsapp_business_messaging`
- `whatsapp_business_management`

## Supported Languages

The bot supports 11 languages:

| Code | Language | Default |
|------|----------|---------|
| `ro` | Romanian | ✓ |
| `en` | English | |
| `es` | Spanish | |
| `fr` | French | |
| `de` | German | |
| `it` | Italian | |
| `pt` | Portuguese | |
| `ja` | Japanese | |
| `zh` | Chinese | |
| `ar` | Arabic | |
| `hi` | Hindi | |

## Skill Levels

Three skill levels are supported:
- `beginner` - Simple subjects and basic techniques
- `intermediate` - Moderate complexity
- `advanced` - Complex compositions and advanced techniques

## Retry Configuration

### Exponential Backoff

**Initial Delay**: 1000ms (1 second)
**Max Retries**: 3
**Backoff Pattern**: Exponential (1s, 2s, 4s)

**Applies To**:
- Perplexity AI text generation
- Perplexity AI image generation
- (WhatsApp messages do not retry to avoid duplicates)

### Fallback Behavior

When all retries fail:
- **Text prompts**: Use predefined fallback prompts
- **Images**: Use predefined fallback image URLs

## Webhook Configuration

### Endpoint

**Path**: `/webhook`
**Full URL**: `https://your-worker.workers.dev/webhook`

### Verification

**Method**: Token-based verification
**Token**: Set via `WEBHOOK_VERIFY_TOKEN` secret

### Required Webhook Fields

Subscribe to these fields in Meta Console:
- `messages` (required)
- `message_status` (optional)

## Monitoring Configuration

### Logging

**Structured Logging**: Enabled
**Log Levels**: ERROR, WARN, INFO, DEBUG

**Logged Events**:
- API calls (success/failure)
- Message delivery (success/failure)
- Daily delivery reports
- Error conditions

### Metrics

Available in Cloudflare Dashboard:
- Request count
- Error rate
- CPU time
- Duration
- Cron execution status

## Security Configuration

### SQL Injection Prevention

**Method**: Parameterized queries
**Implementation**: All database queries use prepared statements

### API Authentication

**WhatsApp**: Bearer token authentication
**Perplexity**: API key authentication

### Webhook Security

**Verification**: Token-based verification
**HTTPS**: Required for all API calls

## Resource Limits

### Cloudflare Workers

**CPU Time**: 50ms per request (free tier)
**Memory**: 128MB
**Request Size**: 100MB

### D1 Database

**Storage**: 5GB (free tier)
**Reads**: 5M per day (free tier)
**Writes**: 100K per day (free tier)

## Customization Guide

### Change Delivery Time

1. Edit `wrangler.toml`
2. Update cron expression
3. Deploy: `npm run deploy`

### Add New Language

1. Update `Language` type in `src/types.ts`
2. Add translations in `src/i18n/messages.ts`
3. Add fallback prompts for new language
4. Update documentation

### Change AI Models

1. Edit `wrangler.toml`
2. Update `PERPLEXITY_TEXT_MODEL` or `PERPLEXITY_IMAGE_MODEL`
3. Deploy: `npm run deploy`

### Adjust Retry Behavior

1. Edit `wrangler.toml`
2. Update `MAX_RETRIES` or `RETRY_DELAY_MS`
3. Deploy: `npm run deploy`

## Documentation Index

- **[DEPLOYMENT.md](DEPLOYMENT.md)** - Complete deployment guide
- **[SECRETS.md](SECRETS.md)** - Secrets configuration reference
- **[README.md](README.md)** - Project overview and quick start
- **[CONFIGURATION.md](CONFIGURATION.md)** - This file

## Support

For configuration issues:
1. Check [DEPLOYMENT.md](DEPLOYMENT.md) troubleshooting section
2. Verify all secrets are set: `wrangler secret list`
3. Check Worker logs: `wrangler tail`
4. Review database: `wrangler d1 execute painting_bot_db --command "SELECT * FROM users LIMIT 5"`
