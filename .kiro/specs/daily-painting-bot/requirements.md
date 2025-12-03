# Requirements Document

## Introduction

The Daily Painting Bot is a WhatsApp-based application that delivers personalized painting ideas to users every morning. The system generates creative painting prompts using Perplexity AI's API, tailored to different skill levels (beginner, intermediate, advanced), helping artists maintain a consistent creative practice and overcome creative blocks.

## Glossary

- **Daily Painting Bot**: The WhatsApp bot system that sends painting ideas to subscribed users
- **Painting Prompt**: A creative suggestion for what to paint, including subject matter, style, or technique recommendations
- **Skill Level**: User's self-reported painting proficiency (beginner, intermediate, or advanced)
- **Perplexity AI**: The external AI service used to generate creative painting ideas
- **WhatsApp API**: The messaging platform interface used to communicate with users
- **Scheduled Delivery**: The automated process of sending messages at a predetermined time each morning
- **User Subscription**: A user's active registration to receive daily painting prompts
- **Cloudflare Workers**: The serverless compute platform hosting the bot application
- **D1 Database**: The SQL database service used to store user subscriptions and system data
- **Cron Trigger**: The Cloudflare Workers scheduled event that initiates daily prompt delivery
- **Language Preference**: User's preferred language for receiving bot communications and painting prompts

## Requirements

### Requirement 1

**User Story:** As a user, I want to subscribe to the bot with my skill level, so that I receive painting ideas appropriate for my abilities.

#### Acceptance Criteria

1. WHEN a user sends a subscription command to the bot, THEN the Daily Painting Bot SHALL prompt the user to select their skill level from beginner, intermediate, or advanced
2. WHEN a user selects a skill level, THEN the Daily Painting Bot SHALL store the user's phone number and skill level in the system
3. WHEN a user is already subscribed, THEN the Daily Painting Bot SHALL inform them of their current subscription status
4. WHEN subscription data is stored, THEN the Daily Painting Bot SHALL confirm successful subscription with a welcome message

### Requirement 2

**User Story:** As a user, I want to set my preferred language, so that I receive all communications and painting prompts in my native language.

#### Acceptance Criteria

1. WHEN a user subscribes, THEN the Daily Painting Bot SHALL prompt the user to select their preferred language
2. WHEN a user selects a language, THEN the Daily Painting Bot SHALL store the language preference with the user's subscription
3. WHEN generating painting prompts, THEN the Daily Painting Bot SHALL request prompts in the user's preferred language from Perplexity AI
4. WHEN sending bot messages, THEN the Daily Painting Bot SHALL use the user's preferred language for all communications
5. WHEN a user updates their language preference, THEN the Daily Painting Bot SHALL update the stored language and confirm the change

### Requirement 3

**User Story:** As a user, I want to update my skill level, so that I can receive more appropriate painting ideas as I improve.

#### Acceptance Criteria

1. WHEN a user sends an update skill level command, THEN the Daily Painting Bot SHALL display their current skill level and prompt for a new selection
2. WHEN a user selects a new skill level, THEN the Daily Painting Bot SHALL update the stored skill level for that user
3. WHEN the skill level is updated, THEN the Daily Painting Bot SHALL confirm the change with a success message

### Requirement 4

**User Story:** As a user, I want to unsubscribe from the bot, so that I can stop receiving daily messages when I no longer need them.

#### Acceptance Criteria

1. WHEN a user sends an unsubscribe command, THEN the Daily Painting Bot SHALL remove the user from the active subscription list
2. WHEN a user is unsubscribed, THEN the Daily Painting Bot SHALL send a confirmation message
3. WHEN an unsubscribed user sends a message, THEN the Daily Painting Bot SHALL not send them scheduled painting prompts

### Requirement 5

**User Story:** As the system, I want to generate skill-appropriate painting ideas using Perplexity AI, so that users receive relevant and inspiring prompts.

#### Acceptance Criteria

1. WHEN generating a painting prompt, THEN the Daily Painting Bot SHALL send a request to Perplexity AI API with the user's skill level as context
2. WHEN Perplexity AI returns a response, THEN the Daily Painting Bot SHALL extract the painting idea from the response
3. WHEN the API request fails, THEN the Daily Painting Bot SHALL retry up to three times with exponential backoff
4. WHEN all retry attempts fail, THEN the Daily Painting Bot SHALL log the error and use a fallback prompt from a predefined list
5. WHEN generating prompts for different skill levels, THEN the Daily Painting Bot SHALL ensure beginner prompts focus on basic techniques and simple subjects, intermediate prompts include moderate complexity, and advanced prompts challenge with complex compositions or techniques

### Requirement 6

**User Story:** As the system, I want to send painting prompts to all subscribed users every morning, so that they receive consistent daily inspiration.

#### Acceptance Criteria

1. WHEN the scheduled time arrives each morning, THEN the Daily Painting Bot SHALL retrieve all active subscriptions from storage
2. WHEN processing subscriptions, THEN the Daily Painting Bot SHALL generate a unique painting prompt for each skill level
3. WHEN a prompt is generated, THEN the Daily Painting Bot SHALL send it via WhatsApp API to all users with that skill level
4. WHEN a message fails to send, THEN the Daily Painting Bot SHALL log the failure and continue processing remaining users
5. WHEN all messages are processed, THEN the Daily Painting Bot SHALL log the completion status with success and failure counts

### Requirement 7

**User Story:** As a user, I want to request a painting idea on demand, so that I can get inspiration whenever I need it, not just in the morning.

#### Acceptance Criteria

1. WHEN a subscribed user sends a request prompt command, THEN the Daily Painting Bot SHALL generate a new painting idea based on their skill level
2. WHEN the prompt is generated, THEN the Daily Painting Bot SHALL send it immediately to the requesting user
3. WHEN an unsubscribed user requests a prompt, THEN the Daily Painting Bot SHALL inform them they need to subscribe first

### Requirement 8

**User Story:** As a user, I want to receive help information, so that I understand what commands are available and how to use the bot.

#### Acceptance Criteria

1. WHEN a user sends a help command, THEN the Daily Painting Bot SHALL respond with a list of available commands and their descriptions
2. WHEN a user sends an unrecognized command, THEN the Daily Painting Bot SHALL respond with a helpful message suggesting the help command

### Requirement 9

**User Story:** As a system administrator, I want to configure the daily delivery time using Cloudflare Workers cron triggers, so that messages are sent at an appropriate time for the target audience.

#### Acceptance Criteria

1. WHEN the Cron Trigger fires at the scheduled time, THEN the Daily Painting Bot SHALL initiate the daily prompt delivery process
2. WHEN the cron schedule is configured, THEN the Daily Painting Bot SHALL use the schedule defined in the wrangler.toml configuration file
3. WHEN no cron schedule is configured, THEN the Daily Painting Bot SHALL default to 8:00 AM UTC daily execution

### Requirement 10

**User Story:** As a system administrator, I want to store user data securely in D1 Database, so that user privacy is protected.

#### Acceptance Criteria

1. WHEN storing user data in D1 Database, THEN the Daily Painting Bot SHALL use parameterized queries to prevent SQL injection
2. WHEN accessing the D1 Database, THEN the Daily Painting Bot SHALL use Cloudflare Workers bindings for secure authentication
3. WHEN user data is no longer needed, THEN the Daily Painting Bot SHALL provide a mechanism to permanently delete records from D1 Database
4. WHEN the D1 Database is initialized, THEN the Daily Painting Bot SHALL create tables with appropriate schema and indexes

### Requirement 11

**User Story:** As a system administrator, I want to monitor API usage and costs, so that I can manage the service within budget constraints.

#### Acceptance Criteria

1. WHEN making API calls to Perplexity AI, THEN the Daily Painting Bot SHALL log the request timestamp and token usage
2. WHEN making API calls to WhatsApp API, THEN the Daily Painting Bot SHALL log the message count and delivery status
3. WHEN daily processing completes, THEN the Daily Painting Bot SHALL generate a summary report of API usage
