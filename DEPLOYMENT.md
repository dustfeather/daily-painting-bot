# Deployment Guide

This guide covers the complete setup and deployment process for the Daily Painting Bot.

## Prerequisites

- Node.js 18+ and npm
- Cloudflare account (free tier works)
- Wrangler CLI installed (`npm install -g wrangler`)
- WhatsApp Business API access
- Perplexity AI API key

## Required Secrets

The application requires four secrets to function:

| Secret | Description | How to Obtain |
|--------|-------------|---------------|
| `WHATSAPP_API_TOKEN` | WhatsApp Business API access token | Meta for Developers Console |
| `WHATSAPP_PHONE_NUMBER_ID` | WhatsApp Business phone number ID | Meta for Developers Console |
| `PERPLEXITY_API_KEY` | Perplexity AI API key | Perplexity Settings page |
| `WEBHOOK_VERIFY_TOKEN` | Custom token for webhook verification | Generate a secure random string |

### Obtaining WhatsApp API Credentials

1. Go to [Meta for Developers](https://developers.facebook.com/)
2. Create a new app or select an existing one
3. Add the "WhatsApp" product to your app
4. Navigate to WhatsApp > Getting Started
5. Copy your **Phone Number ID** (this is `WHATSAPP_PHONE_NUMBER_ID`)
6. Generate a **Temporary Access Token** or create a **System User Token** for production
   - For production, create a System User with WhatsApp Business Management permissions
   - Generate a permanent token (this is `WHATSAPP_API_TOKEN`)

### Obtaining Perplexity AI API Key

1. Go to [Perplexity AI](https://www.perplexity.ai/)
2. Sign in or create an account
3. Navigate to Settings > API
4. Generate a new API key (this is `PERPLEXITY_API_KEY`)

### Generating Webhook Verify Token

Generate a secure random string for webhook verification:

```bash
# Using openssl (Linux/Mac)
openssl rand -hex 32

# Using Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Using PowerShell (Windows)
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Minimum 0 -Maximum 256 }))
```

Save this token as `WEBHOOK_VERIFY_TOKEN` - you'll need it when configuring the WhatsApp webhook.

## Local Development Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Create Local D1 Database

```bash
# Create the database
npm run db:create

# This will output a database ID - copy it to wrangler.toml
```

Update `wrangler.toml` with the database ID:

```toml
[[d1_databases]]
binding = "DB"
database_name = "painting_bot_db"
database_id = "your-actual-database-id-here"
```

### 3. Configure Local Secrets

```bash
# Copy the example file
cp .dev.vars.example .dev.vars

# Edit .dev.vars with your actual values
# Use your preferred text editor
```

Edit `.dev.vars` and fill in all four secrets:

```env
WHATSAPP_API_TOKEN=your_actual_token
WHATSAPP_PHONE_NUMBER_ID=your_actual_phone_id
PERPLEXITY_API_KEY=your_actual_api_key
WEBHOOK_VERIFY_TOKEN=your_generated_token
```

**Important**: Never commit `.dev.vars` to version control. It's already in `.gitignore`.

### 4. Run Database Migrations

```bash
# Run migrations locally
npm run db:migrate:local
```

### 5. Start Development Server

```bash
npm run dev
```

The server will start on `http://localhost:8787`

### 6. Test Webhook Locally (Optional)

To test WhatsApp webhooks locally, use a tunneling service like ngrok:

```bash
# Install ngrok
npm install -g ngrok

# Start tunnel
ngrok http 8787

# Use the ngrok URL in WhatsApp webhook configuration
```

## Production Deployment

### 1. Authenticate with Cloudflare

```bash
wrangler login
```

### 2. Create Production D1 Database

```bash
# Create production database
wrangler d1 create painting_bot_db

# Copy the database ID to wrangler.toml
```

### 3. Run Production Migrations

```bash
npm run db:migrate
```

### 4. Set Production Secrets

Set each secret using Wrangler:

```bash
# Set WhatsApp API token
wrangler secret put WHATSAPP_API_TOKEN
# Paste your token when prompted

# Set WhatsApp phone number ID
wrangler secret put WHATSAPP_PHONE_NUMBER_ID
# Paste your phone number ID when prompted

# Set Perplexity API key
wrangler secret put PERPLEXITY_API_KEY
# Paste your API key when prompted

# Set webhook verify token
wrangler secret put WEBHOOK_VERIFY_TOKEN
# Paste your verify token when prompted
```

**Security Note**: Secrets are encrypted and stored securely by Cloudflare. They are never visible in your code or configuration files.

### 5. Deploy to Cloudflare Workers

```bash
npm run deploy
```

After deployment, Wrangler will output your Worker URL (e.g., `https://daily-painting-bot.your-subdomain.workers.dev`).

### 6. Configure WhatsApp Webhook

1. Go to Meta for Developers Console
2. Navigate to your app > WhatsApp > Configuration
3. Click "Edit" next to Webhook
4. Enter your Worker URL with `/webhook` path:
   ```
   https://daily-painting-bot.your-subdomain.workers.dev/webhook
   ```
5. Enter your `WEBHOOK_VERIFY_TOKEN` in the "Verify Token" field
6. Click "Verify and Save"
7. Subscribe to webhook fields:
   - `messages` (required)
   - `message_status` (optional, for delivery tracking)

### 7. Verify Deployment

Test the deployment by sending a message to your WhatsApp Business number:

```
help
```

You should receive a response with available commands.

## Configuration Reference

### wrangler.toml

The `wrangler.toml` file contains all non-sensitive configuration:

```toml
name = "daily-painting-bot"
main = "src/index.ts"
compatibility_date = "2024-12-03"
node_compat = true

# Cron trigger for daily delivery at 8:00 AM UTC
[triggers]
crons = ["0 8 * * *"]

# D1 Database binding
[[d1_databases]]
binding = "DB"
database_name = "painting_bot_db"
database_id = "your-database-id"

# Environment variables (non-sensitive)
[vars]
PERPLEXITY_API_URL = "https://api.perplexity.ai"
PERPLEXITY_TEXT_MODEL = "llama-3.1-sonar-small-128k-online"
PERPLEXITY_IMAGE_MODEL = "playground-v2.5"
WHATSAPP_API_URL = "https://graph.facebook.com/v18.0"
MAX_RETRIES = "3"
RETRY_DELAY_MS = "1000"
```

### Cron Schedule

The bot runs daily at 8:00 AM UTC. To change the schedule, modify the cron expression:

```toml
[triggers]
crons = ["0 8 * * *"]  # Format: minute hour day month day-of-week
```

Examples:
- `0 8 * * *` - Daily at 8:00 AM UTC
- `0 6 * * *` - Daily at 6:00 AM UTC
- `0 12 * * 1-5` - Weekdays at 12:00 PM UTC
- `0 9 * * 1,3,5` - Monday, Wednesday, Friday at 9:00 AM UTC

After changing the schedule, redeploy:

```bash
npm run deploy
```

## Database Management

### View Database Contents

```bash
# List all users
wrangler d1 execute painting_bot_db --command "SELECT * FROM users"

# View API usage logs
wrangler d1 execute painting_bot_db --command "SELECT * FROM api_usage_logs ORDER BY timestamp DESC LIMIT 10"

# View delivery logs
wrangler d1 execute painting_bot_db --command "SELECT * FROM delivery_logs ORDER BY timestamp DESC LIMIT 10"
```

### Backup Database

```bash
# Export database to SQL file
wrangler d1 export painting_bot_db --output backup.sql
```

### Restore Database

```bash
# Import from SQL file
wrangler d1 execute painting_bot_db --file backup.sql
```

## Monitoring and Logs

### View Worker Logs

```bash
# Tail live logs
wrangler tail

# Filter by status
wrangler tail --status error
```

### View Metrics

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. Navigate to Workers & Pages > daily-painting-bot
3. View metrics for:
   - Request count
   - Error rate
   - CPU time
   - Duration

### Check Cron Execution

```bash
# View recent cron executions
wrangler tail --format json | grep "scheduled"
```

## Troubleshooting

### Webhook Not Receiving Messages

1. Verify webhook URL is correct in Meta Console
2. Check that `WEBHOOK_VERIFY_TOKEN` matches in both places
3. Ensure Worker is deployed and accessible
4. Check Worker logs: `wrangler tail`

### Prompts Not Being Delivered

1. Check cron trigger is configured correctly
2. Verify users exist in database: `wrangler d1 execute painting_bot_db --command "SELECT COUNT(*) FROM users WHERE is_active = 1"`
3. Check delivery logs for errors
4. Verify API keys are set correctly

### API Errors

1. Verify all secrets are set: `wrangler secret list`
2. Check API key validity (Perplexity, WhatsApp)
3. Review API usage logs in database
4. Check for rate limiting or quota issues

### Database Issues

1. Verify database binding in wrangler.toml
2. Ensure migrations have run: `npm run db:migrate`
3. Check database exists: `wrangler d1 list`

## Updating the Application

### Deploy Code Changes

```bash
# Pull latest changes
git pull

# Install any new dependencies
npm install

# Deploy
npm run deploy
```

### Run New Migrations

```bash
# Run migrations on production database
npm run db:migrate
```

### Update Secrets

```bash
# Update a specific secret
wrangler secret put SECRET_NAME
```

## Cost Estimation

### Cloudflare Workers

- **Free Tier**: 100,000 requests/day
- **Paid Plan**: $5/month for 10M requests

### D1 Database

- **Free Tier**: 5GB storage, 5M reads/day, 100K writes/day
- **Paid Plan**: Usage-based pricing

### Perplexity AI

- Check [Perplexity Pricing](https://www.perplexity.ai/settings/api) for current rates
- Typical usage: ~30-50 API calls per day (one per skill level + language combination)

### WhatsApp Business API

- Check [Meta Pricing](https://developers.facebook.com/docs/whatsapp/pricing) for current rates
- Varies by country and message volume
- First 1,000 conversations/month are typically free

## Security Best Practices

1. **Never commit secrets**: Always use `.dev.vars` locally and `wrangler secret` for production
2. **Rotate tokens regularly**: Update API tokens every 90 days
3. **Monitor logs**: Check for suspicious activity or unauthorized access attempts
4. **Use HTTPS**: All API calls use HTTPS by default
5. **Validate webhooks**: Webhook signature verification is implemented
6. **Limit access**: Use Cloudflare Access to restrict Worker access if needed

## Support

For issues or questions:
- Check [CONTRIBUTING.md](CONTRIBUTING.md) for contribution guidelines
- Review [SECURITY.md](SECURITY.md) for security concerns
- Open an issue on GitHub

## Additional Resources

- [Cloudflare Workers Documentation](https://developers.cloudflare.com/workers/)
- [D1 Database Documentation](https://developers.cloudflare.com/d1/)
- [WhatsApp Business API Documentation](https://developers.facebook.com/docs/whatsapp)
- [Perplexity AI Documentation](https://docs.perplexity.ai/)
