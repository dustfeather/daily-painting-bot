# Implementation Plan

- [x] 1. Set up project structure and configuration
  - Initialize Cloudflare Workers project with Wrangler
  - Configure TypeScript and build settings
  - Set up D1 database binding in wrangler.toml
  - Configure cron trigger for daily delivery (8:00 AM UTC)
  - Create environment variables structure for API keys
  - _Requirements: 9.1, 9.2_

- [x] 2. Create database schema and migrations
  - Write D1 migration for users table with phone_number, skill_level, language, subscribed_at, last_prompt_sent, is_active
  - Write D1 migration for api_usage_logs table
  - Write D1 migration for delivery_logs table
  - Create indexes for performance (skill_level, language, skill_level+language composite)
  - _Requirements: 10.4_

- [x] 3. Implement core data models and types
  - Define TypeScript types for User, SkillLevel, Language, Command, PaintingPrompt
  - Define types for API responses and configuration
  - Create type guards for runtime validation
  - _Requirements: 1.1, 2.1_

- [x] 4. Implement User Repository
  - Create UserRepository class with D1 database operations
  - Implement createUser(phoneNumber, skillLevel, language) with parameterized queries
  - Implement getUser(phoneNumber) query
  - Implement updateSkillLevel(phoneNumber, skillLevel)
  - Implement updateLanguage(phoneNumber, language)
  - Implement deleteUser(phoneNumber)
  - Implement getAllActiveUsers() query
  - Implement getUsersBySkillAndLanguage(skillLevel, language) query
  - _Requirements: 1.2, 3.2, 2.5, 4.1, 10.1, 10.3_

- [x] 5. Implement internationalization (i18n) system
  - Create message templates structure for all supported languages (ro, en)
  - Implement getMessage(key, language) function
  - Add translations for: welcome, subscription_confirmed, skill_updated, language_updated, unsubscribe_confirmed, help_text, error_messages
  - Set Romanian (ro) as default language
  - _Requirements: 2.1, 2.4, 2.5_

- [x] 6. Implement Perplexity AI client for text generation
  - Create PerplexityClient class for API communication
  - Implement generateTextPrompt(skillLevel, language) method
  - Include skill level and language in API request context
  - Parse and extract painting idea from response
  - Implement exponential backoff retry logic (3 attempts, 1s, 2s, 4s delays)
  - _Requirements: 5.1, 5.2, 5.3, 2.3_

- [x] 7. Implement Perplexity AI client for image generation
  - Extend PerplexityClient with generateImage(promptText, skillLevel, language) method
  - Extract visual keywords from text prompt
  - Create image generation prompt with skill-appropriate styling
  - Implement exponential backoff retry logic for image generation
  - _Requirements: 5.1, 5.2, 5.3_

- [x] 8. Implement fallback prompt system
  - Create fallback prompts data structure with text and image URLs
  - Include fallbacks for all skill levels and languages
  - Implement getFallbackPrompt(skillLevel, language) function
  - Ensure fallback images are hosted on reliable CDN
  - _Requirements: 5.4_

- [x] 9. Implement Prompt Generator component
  - Create PromptGenerator class orchestrating text and image generation
  - Implement generatePrompt(skillLevel, language) combining text and image
  - Implement generatePromptWithRetry with fallback handling
  - Return PaintingPrompt object with text, imageUrl, skillLevel, language
  - _Requirements: 5.1, 5.2, 5.3, 5.4_

- [x] 10. Implement WhatsApp API client
  - Create WhatsAppClient class for API communication
  - Implement sendMessage(phoneNumber, message) for text-only messages
  - Implement sendMessageWithImage(phoneNumber, message, imageUrl) for messages with images
  - Implement sendBulkMessages for batch delivery
  - Handle API errors gracefully without stopping batch processing
  - _Requirements: 6.3, 6.4_

- [x] 11. Implement command parser
  - Create parseCommand(message) function to extract command type
  - Support commands: subscribe, update_skill, update_language, unsubscribe, get_prompt, help
  - Handle case-insensitive matching
  - Return Command type with parsed parameters
  - Handle unknown commands
  - _Requirements: 1.1, 3.1, 2.1, 4.1, 7.1, 8.2_

- [x] 12. Implement subscription flow handler
  - Create handleSubscribe(phoneNumber, skillLevel?, language?) function
  - Prompt for skill level if not provided
  - Prompt for language if not provided (default to Romanian)
  - Check if user already subscribed (idempotency)
  - Store user in database via UserRepository
  - Return welcome message in user's language
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 2.1, 2.2_

- [ ] 13. Implement update handlers
  - Create handleUpdateSkill(phoneNumber, newSkillLevel?) function
  - Create handleUpdateLanguage(phoneNumber, newLanguage?) function
  - Display current value and prompt for new value if not provided
  - Update database via UserRepository
  - Return confirmation message in user's language
  - _Requirements: 3.1, 3.2, 3.3, 2.5_

- [ ] 14. Implement unsubscribe handler
  - Create handleUnsubscribe(phoneNumber) function
  - Mark user as inactive in database
  - Return confirmation message in user's language
  - _Requirements: 4.1, 4.2_

- [ ] 15. Implement on-demand prompt handler
  - Create handleGetPrompt(phoneNumber) function
  - Check if user is subscribed
  - Retrieve user's skill level and language from database
  - Generate prompt using PromptGenerator
  - Send prompt with image immediately via WhatsApp
  - _Requirements: 7.1, 7.2, 7.3_

- [ ] 16. Implement help command handler
  - Create handleHelp(phoneNumber) function
  - Retrieve user's language preference (or default to Romanian)
  - Return localized help text with available commands
  - _Requirements: 8.1_

- [ ] 17. Implement message routing handler
  - Create handleIncomingMessage(request) function for webhook
  - Verify WhatsApp webhook signature
  - Parse incoming message and extract phone number
  - Route to appropriate command handler
  - Handle unknown commands with helpful message in user's language
  - Return appropriate HTTP response
  - _Requirements: 1.1, 3.1, 4.1, 7.1, 8.1, 8.2_

- [ ] 18. Implement scheduled delivery orchestrator
  - Create Scheduler class for daily delivery
  - Implement executeDailyDelivery() function
  - Retrieve all active users from database
  - Group users by skill level and language combination
  - Generate one prompt per unique skill-language combination
  - Send prompts to users via WhatsApp bulk messaging
  - Continue processing on individual message failures
  - _Requirements: 6.1, 6.2, 6.3, 6.4_

- [ ] 19. Implement API usage logging
  - Create logApiUsage(service, operation, tokensUsed, messagesSent, imagesGenerated, success, error) function
  - Log all Perplexity AI calls (text and image generation)
  - Log all WhatsApp API calls
  - Store logs in api_usage_logs table
  - _Requirements: 11.1, 11.2_

- [ ] 20. Implement delivery reporting
  - Create logDeliveryReport(totalUsers, successCount, failureCount, promptsGenerated, imagesGenerated, executionTime) function
  - Generate report after each scheduled delivery
  - Store in delivery_logs table
  - Include API usage summary
  - _Requirements: 11.3_

- [ ] 21. Implement main Worker entry point
  - Create main fetch handler for HTTP requests (webhook)
  - Create scheduled handler for cron trigger
  - Wire up all components with dependency injection
  - Handle errors gracefully with appropriate responses
  - Export Worker handlers
  - _Requirements: 9.1, 9.2_

- [ ] 22. Create configuration and secrets setup
  - Document required secrets: WHATSAPP_API_TOKEN, WHATSAPP_PHONE_NUMBER_ID, PERPLEXITY_API_KEY, WEBHOOK_VERIFY_TOKEN
  - Create wrangler.toml with all configuration variables
  - Set up D1 database binding
  - Configure cron trigger schedule
  - Document deployment process
  - _Requirements: 9.1, 9.2_

- [ ] 23. Final checkpoint - Ensure all functionality works
  - Ensure all tests pass, ask the user if questions arise
  - Test subscription flow with different languages
  - Test scheduled delivery with multiple users
  - Test on-demand prompts
  - Test error handling and fallbacks
  - Verify all API logging is working
