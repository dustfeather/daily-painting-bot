# Security Policy

## Reporting a Vulnerability

If you discover a security vulnerability, please email the maintainer directly instead of opening a public issue.

Include:
- Description of the vulnerability
- Steps to reproduce
- Potential impact
- Suggested fix (if any)

## Supported Versions

Only the latest version receives security updates.

## Security Best Practices

- Never commit API keys or secrets to the repository
- Use Cloudflare Workers secrets for production credentials
- Keep dependencies updated: `npm audit` and `npm update`
- Follow the principle of least privilege for API tokens
