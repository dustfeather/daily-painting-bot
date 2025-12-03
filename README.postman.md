# Postman API Testing Setup

Your Daily Painting Bot API is now configured with automated Postman testing!

## What's Been Set Up

✅ **Postman Collection**: "Daily Painting Bot API" with 4 test requests
✅ **Environment**: "Local Development" with base_url configured
✅ **Automated Hook**: Tests run automatically when you edit API code
✅ **Configuration**: `.postman.json` stores your workspace/collection IDs

## Test Requests

1. **Health Check** - Verifies the worker is running
2. **Webhook Verification** - Tests WhatsApp webhook verification
3. **Webhook - Subscribe Command** - Tests user subscription flow
4. **Webhook - Unsubscribe Command** - Tests user unsubscription
5. **Webhook - Update Skill Command** - Tests skill level update
6. **Webhook - Update Language Command** - Tests language preference update
7. **Webhook - Get Prompt Command** - Tests on-demand prompt generation
8. **Webhook - Help Command** - Tests help command response
9. **Webhook - Unknown Command** - Tests error handling for invalid commands

## Running Tests

### Manually Run Tests
```bash
# Start your dev server first
npm run dev

# Then ask Kiro to run the tests:
"Run my Postman collection tests"
```

### Automatic Testing
The hook automatically triggers when you edit:
- Any TypeScript file in `src/`
- `wrangler.toml`
- `.dev.vars`

## Environment Variables

Update `.postman.json` or the Postman environment with:
- `base_url`: Your API endpoint (default: http://localhost:8787)
- `verify_token`: Your webhook verification token

## View in Postman

Open the collection in Postman web app:
https://www.postman.com/

Navigate to: My Workspace → Daily Painting Bot API

## Next Steps

1. Start your dev server: `npm run dev`
2. Update the `verify_token` in the Postman environment
3. Run the tests to validate your API
4. Add more test requests as you build new features
