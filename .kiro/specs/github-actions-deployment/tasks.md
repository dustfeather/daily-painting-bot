# Implementation Plan

- [x] 1. Secure wrangler.toml configuration
  - Create `wrangler.toml.example` template file with `{{DATABASE_NAME}}` and `{{DATABASE_ID}}` placeholders
  - Add `wrangler.toml` to `.gitignore` to prevent committing sensitive values
  - Remove sensitive values from existing `wrangler.toml` (will be gitignored)
  - _Requirements: 2.1, 2.2_

- [ ] 2. Update database migration for idempotency
  - Modify `migrations/0001_initial_schema.sql` to use `CREATE TABLE IF NOT EXISTS` and `CREATE INDEX IF NOT EXISTS`
  - Ensure migration can run safely on both new and existing databases
  - _Requirements: 4.1_

- [ ] 3. Create GitHub Actions workflow file
  - Create `.github/workflows/deploy.yml` with workflow configuration
  - Configure trigger for push to main branch
  - Set up concurrency control to cancel in-progress deployments
  - _Requirements: 1.1_

- [ ] 4. Add checkout and setup steps
  - Add step to checkout repository code
  - Add step to setup Node.js environment (version 18 or later)
  - Add step to install npm dependencies
  - _Requirements: 1.2_

- [ ] 5. Add validation steps
  - Add step to run TypeScript type checking
  - Add step to run test suite
  - Ensure validation steps run before deployment
  - _Requirements: 6.1, 6.3_

- [ ] 6. Add wrangler.toml generation step
  - Add step to generate `wrangler.toml` from `wrangler.toml.example` template
  - Use sed to replace `{{DATABASE_NAME}}` with value from `CLOUDFLARE_DATABASE_NAME` secret
  - Use sed to replace `{{DATABASE_ID}}` with value from `CLOUDFLARE_DATABASE_ID` secret
  - Set environment variables for Cloudflare authentication
  - _Requirements: 2.1, 2.2_

- [ ] 7. Add database migration step
  - Add step to run D1 migrations using Wrangler
  - Ensure migration step runs after validation and before deployment
  - _Requirements: 4.1_

- [ ] 8. Add secret configuration steps
  - Add step to configure WHATSAPP_API_TOKEN in Cloudflare
  - Add step to configure WHATSAPP_PHONE_NUMBER_ID in Cloudflare
  - Add step to configure PERPLEXITY_API_KEY in Cloudflare
  - Add step to configure WEBHOOK_VERIFY_TOKEN in Cloudflare
  - Use piped input to set secrets non-interactively
  - _Requirements: 3.1, 3.2, 3.3, 3.4_

- [ ] 9. Add deployment step
  - Add step to deploy Worker using `wrangler deploy`
  - Ensure deployment runs after all validation, migration, and secret configuration
  - _Requirements: 1.3_

- [ ] 10. Create GitHub Actions setup documentation
  - Create `GITHUB_ACTIONS_SETUP.md` with comprehensive setup instructions
  - Document all required GitHub Secrets with descriptions (including CLOUDFLARE_DATABASE_NAME)
  - Include step-by-step instructions for adding secrets to GitHub
  - Add instructions for obtaining Cloudflare API token and account ID
  - Add instructions for obtaining database name and ID
  - Include troubleshooting section for common issues
  - _Requirements: 7.1, 7.2, 7.3, 7.4_

- [ ] 11. Update existing deployment documentation
  - Update `DEPLOYMENT.md` to reference automated GitHub Actions deployment
  - Add section explaining the automated deployment workflow
  - Add instructions for local development setup (copying wrangler.toml.example)
  - Include link to `GITHUB_ACTIONS_SETUP.md`
  - Add note about manual deployment still being available via `npm run deploy`
  - _Requirements: 7.1_

- [ ] 12. Update README with deployment status badge
  - Add GitHub Actions workflow status badge to README
  - Add brief description of automated deployment
  - Link to setup documentation
  - _Requirements: 7.1_

- [ ] 13. Final verification
  - Review all workflow steps for correct ordering
  - Verify all required secrets are referenced (including CLOUDFLARE_DATABASE_NAME)
  - Confirm documentation is complete and accurate
  - Verify wrangler.toml is gitignored and template exists
  - Ensure all tests pass, ask the user if questions arise
