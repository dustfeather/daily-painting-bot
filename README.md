# Daily Painting Bot

A WhatsApp bot that delivers personalized painting prompts every morning, powered by Cloudflare Workers and Perplexity AI.

## Features

- 🎨 Daily painting prompts tailored to skill level (beginner, intermediate, advanced)
- 🌍 Multi-language support (11 languages including Romanian, English, Spanish, French, etc.)
- 🖼️ AI-generated inspiration images with each prompt
- 📱 WhatsApp-based interaction
- ⚡ Serverless architecture on Cloudflare Workers
- 💾 D1 database for user management

## Setup

### Prerequisites

- Node.js 18+ installed
- Cloudflare account
- WhatsApp Business API access
- Perplexity AI API key

### Obtaining WhatsApp API Keys

The bot requires WhatsApp Business API credentials. Follow these steps to obtain them:

#### Option 1: WhatsApp Cloud API (Recommended for Development)

1. **Create a Meta Developer Account**
   - Go to [Meta for Developers](https://developers.facebook.com/)
   - Sign up or log in with your Facebook account

2. **Create a New App**
   - Click "My Apps" → "Create App"
   - Select "Business" as the app type
   - Fill in app details (name, contact email)
   - Click "Create App"

3. **Add WhatsApp Product**
   - In your app dashboard, find "WhatsApp" in the products list
   - Click "Set up" to add WhatsApp to your app

4. **Get Your Credentials**
   - Navigate to WhatsApp → Getting Started
   - You'll see:
     - **Temporary Access Token** (valid for 24 hours - for testing only)
     - **Phone Number ID** (the test number provided by Meta)
     - **WhatsApp Business Account ID**

5. **Get a Permanent Access Token**
   - Go to WhatsApp → Configuration
   - Click "Generate Token" or use System User tokens
   - For production, create a System User:
     - Go to Business Settings → System Users
     - Create a new system user
     - Assign it to your app with WhatsApp permissions
     - Generate a permanent token

6. **Set Up Your Phone Number (Production)**
   - For production use, you need to:
     - Verify your business
     - Add your own phone number (not the test number)
     - Go through Meta's Business Verification process
   - Test number limitations:
     - Can only send to 5 pre-registered numbers
     - Messages have "Test" watermark
     - Not suitable for production

7. **Configure Webhook (Later Step)**
   - You'll configure this after deploying your Worker
   - Webhook URL: `https://your-worker.workers.dev/webhook`
   - Webhook fields: `messages`

#### Option 2: WhatsApp Business API via BSP (Business Solution Provider)

For production deployments with higher volume:

1. **Choose a BSP Provider**
   - Examples: Twilio, MessageBird, Vonage, 360dialog
   - Each has their own pricing and features

2. **Sign Up and Verify**
   - Create an account with your chosen BSP
   - Complete business verification
   - Connect your WhatsApp Business phone number

3. **Get API Credentials**
   - Each BSP provides their own API credentials
   - You may need to adapt the WhatsApp client code for BSP-specific APIs
   - Most BSPs follow similar patterns to the Cloud API

#### Required Values for `.dev.vars`

After obtaining your credentials, you'll need:

```bash
# From WhatsApp Cloud API Dashboard
WHATSAPP_API_TOKEN=your_access_token_here
WHATSAPP_PHONE_NUMBER_ID=your_phone_number_id_here

# Create a random secure string for webhook verification
WEBHOOK_VERIFY_TOKEN=your_random_secure_string_here

# From Perplexity AI (https://www.perplexity.ai/settings/api)
PERPLEXITY_API_KEY=your_perplexity_api_key_here
```

#### Testing with WhatsApp

1. **Add Test Numbers** (for Cloud API test number)
   - Go to WhatsApp → API Setup → Phone Numbers
   - Click "Add phone number"
   - Enter phone numbers that can receive test messages
   - Verify via SMS code

2. **Send a Test Message**
   - Use the API test tool in Meta dashboard
   - Or deploy your worker and send a message to the bot

3. **Monitor Messages**
   - Check the "Webhooks" section for incoming messages
   - View logs in Cloudflare Workers dashboard

#### Important Notes

- **Test Number Limitations**: Meta's test number can only message 5 pre-registered numbers
- **Production Requirements**: You need business verification and your own phone number
- **Rate Limits**: Cloud API has rate limits (1000 messages/day for test, higher for production)
- **Costs**: WhatsApp Cloud API is free for first 1000 conversations/month, then paid
- **Phone Number Format**: Use E.164 format (e.g., +1234567890)

### Installation

1. Clone the repository and install dependencies:

```bash
npm install
```

2. Create a D1 database:

```bash
npm run db:create
```

This will output a database ID. Copy it and update the `database_id` in `wrangler.toml`.

3. Set up environment variables:

Copy `.dev.vars.example` to `.dev.vars` and fill in your credentials:

```bash
cp .dev.vars.example .dev.vars
```

Required secrets:
- `WHATSAPP_API_TOKEN`: Your WhatsApp Business API token
- `WHATSAPP_PHONE_NUMBER_ID`: Your WhatsApp phone number ID
- `PERPLEXITY_API_KEY`: Your Perplexity AI API key
- `WEBHOOK_VERIFY_TOKEN`: A secure random string for webhook verification

4. Run database migrations:

```bash
npm run db:migrate:local  # For local development
npm run db:migrate        # For production
```

### Development

Start the local development server:

```bash
npm run dev
```

The worker will be available at `http://localhost:8787`.

### Deployment

Deploy to Cloudflare Workers:

```bash
npm run deploy
```

After deployment, set up your secrets:

```bash
wrangler secret put WHATSAPP_API_TOKEN
wrangler secret put WHATSAPP_PHONE_NUMBER_ID
wrangler secret put PERPLEXITY_API_KEY
wrangler secret put WEBHOOK_VERIFY_TOKEN
```

### WhatsApp Webhook Configuration

Configure your WhatsApp webhook to point to:
- URL: `https://your-worker.workers.dev/webhook`
- Verify Token: The value you set for `WEBHOOK_VERIFY_TOKEN`

### Fallback Images Setup

The bot uses fallback prompts with images when AI generation fails. Currently, placeholder URLs are configured that need to be replaced with actual CDN-hosted images.

**Required Images**: 18 total (3 prompts × 3 skill levels × 2 languages)

**Recommended CDN Options**:
- **Cloudflare R2 + Images** (recommended for this project)
- Cloudinary
- AWS S3 + CloudFront
- Any other reliable CDN service

**To set up fallback images**:

1. Create or source 18 painting reference images matching the prompts in `src/services/fallback-prompts.ts`
2. Upload images to your chosen CDN service
3. Update the `imageUrl` values in `src/services/fallback-prompts.ts` with your actual CDN URLs

**Image Requirements**:
- Format: JPEG or PNG (WebP recommended for better compression)
- Size: 800x600px to 1200x900px recommended
- Quality: High quality, suitable for painting reference
- Accessibility: Publicly accessible URLs (no authentication required)

**Example with Cloudflare R2**:
```bash
# Create bucket
wrangler r2 bucket create painting-bot-images

# Upload images
wrangler r2 object put painting-bot-images/beginner-sunset-en.jpg --file ./images/beginner-sunset-en.jpg

# Update URLs in src/services/fallback-prompts.ts to use your R2/Images URLs
```

## Usage

Users can interact with the bot via WhatsApp commands:

- **Subscribe**: Start receiving daily prompts
- **Update Skill**: Change skill level (beginner/intermediate/advanced or 1/2/3)
- **Update Language**: Change preferred language
- **Get Prompt**: Request an immediate painting prompt
- **Help**: View available commands
- **Unsubscribe**: Stop receiving prompts

### Skill Level Input

Users can specify their skill level using either numbers or words:
- **Numbers**: `1` (beginner), `2` (intermediate), `3` (advanced)
- **Words**: `beginner`, `intermediate`, `advanced` (case-insensitive)

Examples: `"1"`, `"beginner"`, `"INTERMEDIATE"`, `"3"` are all valid inputs.

## Architecture

- **Runtime**: Cloudflare Workers (Node.js)
- **Database**: Cloudflare D1 (SQLite)
- **AI**: Perplexity AI (text and image generation)
- **Messaging**: WhatsApp Business API
- **Scheduling**: Cloudflare Cron Triggers (daily at 8:00 AM UTC)

## Project Structure

```
.
├── src/
│   ├── index.ts              # Worker entry point
│   ├── types.ts              # Shared type definitions
│   ├── config/
│   │   └── env.ts            # Environment configuration
│   ├── handlers/
│   │   ├── webhook.handler.ts    # WhatsApp webhook handler
│   │   └── scheduled.handler.ts  # Cron job handler
│   ├── services/             # Business logic services
│   ├── repositories/         # Data access layer
│   └── utils/
│       └── logger.ts         # Logging utility
├── migrations/               # D1 database migrations
├── wrangler.toml            # Cloudflare Workers configuration
├── tsconfig.json            # TypeScript configuration
└── package.json             # Project dependencies
```

## Database Schema

### Users Table
Stores subscriber information with phone numbers, skill levels, and language preferences.

**Columns:**
- `phone_number` (TEXT, PRIMARY KEY) - User's WhatsApp phone number
- `skill_level` (TEXT) - User's painting skill level (beginner, intermediate, advanced)
- `language` (TEXT) - User's preferred language (ro, en, es, fr, de, it, pt, ja, zh, ar, hi)
- `subscribed_at` (DATETIME) - When the user subscribed
- `last_prompt_sent` (DATETIME) - Last time a prompt was sent to this user
- `is_active` (INTEGER) - Whether the subscription is active (1) or inactive (0)
- `created_at` (DATETIME) - Record creation timestamp
- `updated_at` (DATETIME) - Record last update timestamp

**Indexes:**
- `idx_users_skill_level` - Optimizes queries by skill level for active users
- `idx_users_language` - Optimizes queries by language for active users
- `idx_users_skill_language` - Composite index for skill level + language queries
- `idx_users_active` - Optimizes queries filtering by active status

### API Usage Logs Table
Tracks all external API calls for monitoring and cost management.

**Columns:**
- `id` (INTEGER, PRIMARY KEY, AUTOINCREMENT)
- `timestamp` (DATETIME) - When the API call was made
- `service` (TEXT) - Service name (perplexity, whatsapp, image_generation)
- `operation` (TEXT) - Operation performed
- `tokens_used` (INTEGER) - Number of tokens used (for AI APIs)
- `messages_sent` (INTEGER) - Number of messages sent (for WhatsApp)
- `images_generated` (INTEGER) - Number of images generated
- `success` (INTEGER) - Whether the call succeeded (1) or failed (0)
- `error_message` (TEXT) - Error message if the call failed

### Delivery Logs Table
Tracks daily prompt delivery runs for monitoring and reporting.

**Columns:**
- `id` (INTEGER, PRIMARY KEY, AUTOINCREMENT)
- `timestamp` (DATETIME) - When the delivery run started
- `total_users` (INTEGER) - Total number of active users
- `success_count` (INTEGER) - Number of successful deliveries
- `failure_count` (INTEGER) - Number of failed deliveries
- `prompts_generated` (INTEGER) - Number of unique prompts generated
- `images_generated` (INTEGER) - Number of images generated
- `execution_time_ms` (INTEGER) - Total execution time in milliseconds

## Development Notes

### Perplexity AI Client

The `PerplexityClient` class (`src/services/perplexity.client.ts`) handles text generation for painting prompts.

**Key Features:**
- Generates skill-appropriate prompts (beginner, intermediate, advanced)
- Multi-language support (includes language context in API requests)
- Exponential backoff retry logic (3 attempts: 1s, 2s, 4s delays)
- Comprehensive error handling and logging

**Skill Level Context:**
- **Beginner**: Simple subjects, basic techniques, clear guidance
- **Intermediate**: Moderate complexity, interesting techniques, artistic considerations
- **Advanced**: Sophisticated concepts, complex compositions, advanced techniques

**Configuration:**
- `PERPLEXITY_API_KEY` (required secret)
- `PERPLEXITY_API_URL` (default: https://api.perplexity.ai)
- `PERPLEXITY_TEXT_MODEL` (default: llama-3.1-sonar-small-128k-online)
- `MAX_RETRIES` (default: 3)
- `RETRY_DELAY_MS` (default: 1000)

**Usage Example:**
```typescript
import { PerplexityClient } from './services';

const client = new PerplexityClient({
  apiUrl: env.PERPLEXITY_API_URL,
  apiKey: env.PERPLEXITY_API_KEY,
  textModel: env.PERPLEXITY_TEXT_MODEL,
  maxTokens: 500,
});

const prompt = await client.generateTextPrompt('beginner', 'en');
```

### Fallback Prompt System

The fallback system (`src/services/fallback-prompts.ts`) provides pre-defined prompts when AI generation fails.

**Features:**
- 18 pre-defined prompts (3 per skill level × 2 languages)
- Random selection from available prompts
- Graceful fallback if language not found
- Exported functions: `getFallbackPrompt()`, `getAllFallbackPrompts()`, `hasFallbackPrompts()`

**Usage Example:**
```typescript
import { getFallbackPrompt } from './services';

try {
  const prompt = await client.generateTextPrompt(skillLevel, language);
} catch (error) {
  // Use fallback on failure
  const fallbackPrompt = getFallbackPrompt(skillLevel, language);
}
```

### Skill Level Parsing

The system provides utility functions in `src/types.ts` for parsing skill level input:

- `parseSkillLevel(value)` - Main function accepting both numbers and words
- `numberToSkillLevel(value)` - Converts numbers (1, 2, 3) to skill levels
- `skillLevelToNumber(skillLevel)` - Converts skill levels to numbers

**Benefits:**
- Easier for users (typing "1" is faster than "beginner")
- Language agnostic (numbers work across all languages)
- Backward compatible (word-based input still works)
- Flexible (case-insensitive, handles whitespace)

**Usage Example:**
```typescript
import { parseSkillLevel } from './types';

const skillLevel = parseSkillLevel(userInput); // Accepts '1', 'beginner', etc.
if (skillLevel === null) {
  // Handle invalid input
  return getMessage('error_invalid_skill', language);
}

// Use the validated skill level
await userRepository.updateSkillLevel(phoneNumber, skillLevel);
```

### Database Migrations

All migrations are in the `migrations/` directory and are versioned with a 4-digit prefix (e.g., 0001, 0002).

**Important**: Never modify existing migration files after they've been applied to production. Create new migration files for schema changes.

## License

ISC
