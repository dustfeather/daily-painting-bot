# Secrets Configuration Reference

This document provides a quick reference for all required secrets and how to configure them.

## Required Secrets

| Secret Name | Purpose | Where to Get It |
|-------------|---------|-----------------|
| `WHATSAPP_API_TOKEN` | Authenticate with WhatsApp Business API | [Meta for Developers Console](https://developers.facebook.com/) |
| `WHATSAPP_PHONE_NUMBER_ID` | Identify your WhatsApp Business phone number | [Meta for Developers Console](https://developers.facebook.com/) |
| `PERPLEXITY_API_KEY` | Authenticate with Perplexity AI for prompt generation | [Perplexity Settings](https://www.perplexity.ai/settings/api) |
| `WEBHOOK_VERIFY_TOKEN` | Verify WhatsApp webhook requests | Generate a secure random string |

## Local Development

For local development, create a `.dev.vars` file:

```bash
# Copy the example file
cp .dev.vars.example .dev.vars
```

Edit `.dev.vars` with your actual values:

```env
WHATSAPP_API_TOKEN=your_actual_token
WHATSAPP_PHONE_NUMBER_ID=your_actual_phone_id
PERPLEXITY_API_KEY=your_actual_api_key
WEBHOOK_VERIFY_TOKEN=your_generated_token
```

**Important**: `.dev.vars` is gitignored and should never be committed.

## Production Deployment

For production, set secrets using Wrangler CLI:

```bash
# Set each secret individually
wrangler secret put WHATSAPP_API_TOKEN
wrangler secret put WHATSAPP_PHONE_NUMBER_ID
wrangler secret put PERPLEXITY_API_KEY
wrangler secret put WEBHOOK_VERIFY_TOKEN
```

You'll be prompted to paste the value for each secret.

## Obtaining Credentials

### WhatsApp Business API

1. Go to [Meta for Developers](https://developers.facebook.com/)
2. Create or select an app
3. Add "WhatsApp" product
4. Navigate to WhatsApp > Getting Started
5. Copy your **Phone Number ID** → `WHATSAPP_PHONE_NUMBER_ID`
6. Generate a token:
   - **Development**: Use the temporary token (expires in 24 hours)
   - **Production**: Create a System User with WhatsApp permissions and generate a permanent token → `WHATSAPP_API_TOKEN`

### Perplexity AI

1. Go to [Perplexity AI](https://www.perplexity.ai/)
2. Sign in or create an account
3. Navigate to Settings > API
4. Generate a new API key → `PERPLEXITY_API_KEY`

### Webhook Verify Token

Generate a secure random string:

```bash
# Using openssl (Linux/Mac)
openssl rand -hex 32

# Using Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Using PowerShell (Windows)
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Minimum 0 -Maximum 256 }))
```

Save this as `WEBHOOK_VERIFY_TOKEN` and use it when configuring the WhatsApp webhook.

## Verifying Secrets

### Local Development

Secrets in `.dev.vars` are automatically loaded when running `npm run dev`.

### Production

List configured secrets (values are hidden):

```bash
wrangler secret list
```

## Updating Secrets

### Local Development

Edit `.dev.vars` and restart the dev server.

### Production

Use `wrangler secret put` to update:

```bash
wrangler secret put SECRET_NAME
```

## Security Best Practices

1. **Never commit secrets** to version control
2. **Rotate tokens regularly** (every 90 days recommended)
3. **Use different tokens** for development and production
4. **Limit token permissions** to only what's needed
5. **Monitor usage** for suspicious activity
6. **Revoke compromised tokens** immediately

## Troubleshooting

### "Unauthorized" errors

- Verify tokens are set correctly
- Check token hasn't expired (WhatsApp temporary tokens expire in 24 hours)
- Ensure token has correct permissions

### Webhook verification fails

- Verify `WEBHOOK_VERIFY_TOKEN` matches in both:
  - Your Worker secrets
  - WhatsApp webhook configuration in Meta Console

### Secrets not loading

- **Local**: Ensure `.dev.vars` exists and is in the project root
- **Production**: Run `wrangler secret list` to verify secrets are set

## Additional Resources

- [Cloudflare Workers Secrets Documentation](https://developers.cloudflare.com/workers/configuration/secrets/)
- [WhatsApp Business API Documentation](https://developers.facebook.com/docs/whatsapp)
- [Perplexity AI Documentation](https://docs.perplexity.ai/)

For complete deployment instructions, see [DEPLOYMENT.md](DEPLOYMENT.md).
