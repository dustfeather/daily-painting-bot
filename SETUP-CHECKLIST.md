# Setup Checklist

Use this checklist to ensure your Daily Painting Bot is properly configured and deployed.

## Prerequisites

- [ ] Node.js 18+ installed
- [ ] npm installed
- [ ] Cloudflare account created (free tier works)
- [ ] Wrangler CLI installed globally: `npm install -g wrangler`
- [ ] WhatsApp Business API access obtained
- [ ] Perplexity AI account created

## Obtain API Credentials

### WhatsApp Business API

- [ ] Created or selected app in [Meta for Developers](https://developers.facebook.com/)
- [ ] Added "WhatsApp" product to app
- [ ] Copied Phone Number ID → `WHATSAPP_PHONE_NUMBER_ID`
- [ ] Generated access token → `WHATSAPP_API_TOKEN`
  - [ ] For production: Created System User with permanent token

### Perplexity AI

- [ ] Signed in to [Perplexity AI](https://www.perplexity.ai/)
- [ ] Navigated to Settings > API
- [ ] Generated API key → `PERPLEXITY_API_KEY`

### Webhook Verify Token

- [ ] Generated secure random string → `WEBHOOK_VERIFY_TOKEN`
  - Command: `openssl rand -hex 32` or `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`

## Local Development Setup

- [ ] Cloned repository
- [ ] Installed dependencies: `npm install`
- [ ] Created `.dev.vars` file: `cp .dev.vars.example .dev.vars`
- [ ] Added all four secrets to `.dev.vars`:
  - [ ] `WHATSAPP_API_TOKEN`
  - [ ] `WHATSAPP_PHONE_NUMBER_ID`
  - [ ] `PERPLEXITY_API_KEY`
  - [ ] `WEBHOOK_VERIFY_TOKEN`
- [ ] Created local D1 database: `npm run db:create`
- [ ] Updated `wrangler.toml` with database ID
- [ ] Ran migrations: `npm run db:migrate:local`
- [ ] Started dev server: `npm run dev`
- [ ] Verified server runs without errors

## Production Deployment

### Cloudflare Setup

- [ ] Authenticated with Cloudflare: `wrangler login`
- [ ] Created production D1 database: `wrangler d1 create painting_bot_db`
- [ ] Updated `wrangler.toml` with production database ID
- [ ] Ran production migrations: `npm run db:migrate`

### Set Production Secrets

- [ ] Set `WHATSAPP_API_TOKEN`: `wrangler secret put WHATSAPP_API_TOKEN`
- [ ] Set `WHATSAPP_PHONE_NUMBER_ID`: `wrangler secret put WHATSAPP_PHONE_NUMBER_ID`
- [ ] Set `PERPLEXITY_API_KEY`: `wrangler secret put PERPLEXITY_API_KEY`
- [ ] Set `WEBHOOK_VERIFY_TOKEN`: `wrangler secret put WEBHOOK_VERIFY_TOKEN`
- [ ] Verified secrets are set: `wrangler secret list`

### Deploy Worker

- [ ] Deployed to Cloudflare: `npm run deploy`
- [ ] Noted Worker URL from deployment output
- [ ] Verified Worker is accessible (visit URL in browser)

## WhatsApp Webhook Configuration

- [ ] Opened Meta for Developers Console
- [ ] Navigated to app > WhatsApp > Configuration
- [ ] Clicked "Edit" next to Webhook
- [ ] Entered Worker URL with `/webhook` path
- [ ] Entered `WEBHOOK_VERIFY_TOKEN` in "Verify Token" field
- [ ] Clicked "Verify and Save"
- [ ] Verified webhook verification succeeded
- [ ] Subscribed to webhook fields:
  - [ ] `messages` (required)
  - [ ] `message_status` (optional)

## Testing

### Basic Functionality

- [ ] Sent "help" message to WhatsApp number
- [ ] Received help response with available commands
- [ ] Tested subscription flow:
  - [ ] Sent subscription command
  - [ ] Selected skill level
  - [ ] Selected language
  - [ ] Received welcome message
- [ ] Tested on-demand prompt:
  - [ ] Sent "get prompt" command
  - [ ] Received painting prompt with image
- [ ] Tested update commands:
  - [ ] Updated skill level
  - [ ] Updated language
  - [ ] Received confirmation messages

### Database Verification

- [ ] Verified user was created: `wrangler d1 execute painting_bot_db --command "SELECT * FROM users"`
- [ ] Checked API usage logs: `wrangler d1 execute painting_bot_db --command "SELECT * FROM api_usage_logs ORDER BY timestamp DESC LIMIT 5"`

### Monitoring

- [ ] Checked Worker logs: `wrangler tail`
- [ ] Verified no errors in logs
- [ ] Checked Cloudflare Dashboard metrics
- [ ] Verified cron trigger is scheduled

## Scheduled Delivery Testing

### Wait for First Delivery

- [ ] Noted current cron schedule (default: 8:00 AM UTC)
- [ ] Waited for scheduled delivery time
- [ ] Verified users received daily prompts
- [ ] Checked delivery logs: `wrangler d1 execute painting_bot_db --command "SELECT * FROM delivery_logs ORDER BY timestamp DESC LIMIT 1"`

### Or Test Manually

- [ ] Triggered cron manually (if available in Cloudflare Dashboard)
- [ ] Verified delivery completed successfully
- [ ] Checked delivery report in logs

## Post-Deployment

### Documentation

- [ ] Reviewed [DEPLOYMENT.md](DEPLOYMENT.md) for additional configuration options
- [ ] Reviewed [SECRETS.md](SECRETS.md) for security best practices
- [ ] Reviewed [CONFIGURATION.md](CONFIGURATION.md) for customization options

### Security

- [ ] Verified `.dev.vars` is in `.gitignore`
- [ ] Confirmed no secrets are committed to version control
- [ ] Set up token rotation schedule (recommended: every 90 days)
- [ ] Configured monitoring alerts (optional)

### Monitoring Setup

- [ ] Set up log monitoring
- [ ] Configured error alerts (optional)
- [ ] Set up API usage tracking
- [ ] Documented on-call procedures (if applicable)

## Troubleshooting

If any step fails, refer to:

- **[DEPLOYMENT.md](DEPLOYMENT.md)** - Troubleshooting section
- **Worker logs**: `wrangler tail`
- **Database contents**: `wrangler d1 execute painting_bot_db --command "SELECT * FROM users"`
- **Secrets list**: `wrangler secret list`

## Common Issues

### Webhook Verification Fails

- [ ] Verified `WEBHOOK_VERIFY_TOKEN` matches in both places
- [ ] Checked Worker URL is correct
- [ ] Ensured Worker is deployed and accessible

### No Messages Received

- [ ] Verified webhook is configured and verified
- [ ] Checked Worker logs for errors
- [ ] Verified WhatsApp phone number is correct
- [ ] Checked user is subscribed in database

### API Errors

- [ ] Verified all secrets are set correctly
- [ ] Checked API keys are valid and not expired
- [ ] Reviewed API usage logs for error details
- [ ] Checked for rate limiting or quota issues

### Scheduled Delivery Not Working

- [ ] Verified cron trigger is configured in `wrangler.toml`
- [ ] Checked Worker logs at scheduled time
- [ ] Verified users exist in database with `is_active = 1`
- [ ] Checked delivery logs for error messages

## Success Criteria

Your setup is complete when:

- [ ] Users can subscribe via WhatsApp
- [ ] Users receive immediate confirmation messages
- [ ] On-demand prompts work correctly
- [ ] Update commands function properly
- [ ] Scheduled delivery runs daily at configured time
- [ ] All API calls succeed (or use fallbacks gracefully)
- [ ] Logs show no critical errors
- [ ] Database contains user records and logs

## Next Steps

After completing setup:

1. **Monitor**: Check logs daily for the first week
2. **Optimize**: Adjust cron schedule based on user feedback
3. **Scale**: Monitor API usage and costs
4. **Maintain**: Rotate tokens every 90 days
5. **Improve**: Collect user feedback and iterate

## Support

Need help? Check:

- [DEPLOYMENT.md](DEPLOYMENT.md) - Complete deployment guide
- [SECRETS.md](SECRETS.md) - Secrets configuration
- [CONFIGURATION.md](CONFIGURATION.md) - Configuration reference
- [README.md](README.md) - Project overview

For issues, open a GitHub issue or refer to [CONTRIBUTING.md](CONTRIBUTING.md).
