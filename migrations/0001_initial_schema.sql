-- Migration: Initial schema for Daily Painting Bot
-- Creates users, api_usage_logs, and delivery_logs tables with appropriate indexes

-- Users table: stores subscriber information
CREATE TABLE users (
  phone_number TEXT PRIMARY KEY,
  skill_level TEXT NOT NULL CHECK(skill_level IN ('beginner', 'intermediate', 'advanced')),
  language TEXT NOT NULL CHECK(language IN ('ro', 'en', 'es', 'fr', 'de', 'it', 'pt', 'ja', 'zh', 'ar', 'hi')) DEFAULT 'ro',
  subscribed_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  last_prompt_sent DATETIME,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for users table to optimize queries
CREATE INDEX idx_users_skill_level ON users(skill_level) WHERE is_active = 1;
CREATE INDEX idx_users_language ON users(language) WHERE is_active = 1;
CREATE INDEX idx_users_skill_language ON users(skill_level, language) WHERE is_active = 1;
CREATE INDEX idx_users_active ON users(is_active);

-- API usage logs table: tracks all external API calls
CREATE TABLE api_usage_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  timestamp DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  service TEXT NOT NULL CHECK(service IN ('perplexity', 'whatsapp', 'image_generation')),
  operation TEXT NOT NULL,
  tokens_used INTEGER,
  messages_sent INTEGER,
  images_generated INTEGER,
  success INTEGER NOT NULL,
  error_message TEXT
);

-- Indexes for api_usage_logs table
CREATE INDEX idx_api_usage_timestamp ON api_usage_logs(timestamp);
CREATE INDEX idx_api_usage_service ON api_usage_logs(service);

-- Delivery logs table: tracks daily prompt delivery runs
CREATE TABLE delivery_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  timestamp DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  total_users INTEGER NOT NULL,
  success_count INTEGER NOT NULL,
  failure_count INTEGER NOT NULL,
  prompts_generated INTEGER NOT NULL,
  images_generated INTEGER NOT NULL,
  execution_time_ms INTEGER NOT NULL
);
