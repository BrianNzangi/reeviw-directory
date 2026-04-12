# CSRF Protection Implementation

This document describes the CSRF protection implementation for the Fastify backend.

## Overview

CSRF (Cross-Site Request Forgery) protection is implemented using:
- `@fastify/cookie` for cookie-based secret storage
- `@fastify/csrf-protection` for CSRF token generation and validation

## Configuration

### Environment Variables

```bash
COOKIE_SECRET=your-secret-key-change-in-production
NODE_ENV=production # Enables secure cookies
```

### Security Features

- **Cookie-based secrets**: CSRF secrets stored in signed cookies
- **Custom token extraction**: Optimized header-based token extraction
- **Secure cookies**: HTTPS-only in production
- **SameSite protection**: Strict SameSite policy
- **HTTPOnly cookies**: Prevents JavaScript access

## Usage

### Getting CSRF Token

```bash
GET /api/csrf-token
```

Response:
```json
{
  "csrfToken": "your-csrf-token-here"
}
```

### Using CSRF Protection

#### 1. Header-based (Recommended)

```javascript
// Get token
const response = await fetch('/api/csrf-token');
const { csrfToken } = await response.json();

// Make protected request
const result = await fetch('/api/protected', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'csrf-token': csrfToken
  },
  body: JSON.stringify(data)
});
```

#### 2. Body-based

```javascript
const result = await fetch('/api/protected', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    ...data,
    _csrf: csrfToken
  })
});
```

#### 3. Supported Headers

The implementation supports these headers (in order of preference):
- `csrf-token`
- `x-csrf-token`
- `x-xsrf-token`
- `xsrf-token` (fallback)

### Route Protection

#### Protect Specific Routes

```javascript
fastify.post('/api/protected', {
  preHandler: fastify.csrfProtection,
  handler: async (request, reply) => {
    return { message: "Protected route", data: request.body };
  }
});
```

#### Protect All Routes (Global)

```javascript
fastify.addHook('onRequest', fastify.csrfProtection);
```

#### Protect with Authentication

```javascript
fastify.post('/api/auth-action', {
  preHandler: [fastify.verifyAuthSession, fastify.csrfProtection],
  handler: async (request, reply) => {
    return { message: "Authenticated and CSRF protected" };
  }
});
```

## Examples

### Authentication Routes with CSRF

```javascript
// CSRF-protected sign-in
fastify.post('/api/auth/sign-in/csrf', {
  preHandler: fastify.csrfProtection,
  handler: async (request, reply) => {
    const { email, password } = request.body as any;
    // Your authentication logic
    return { message: "Sign-in successful", email };
  }
});

// CSRF-protected sign-out
fastify.post('/api/auth/sign-out/csrf', {
  preHandler: [fastify.verifyAuthSession, fastify.csrfProtection],
  handler: async (request, reply) => {
    await reply.clearAuthCookie();
    return { message: "Sign-out successful" };
  }
});
```

### Admin Routes with CSRF

```javascript
// Protect admin actions
fastify.post('/api/admin/users', {
  preHandler: [fastify.verifyAuthSession, fastify.csrfProtection],
  handler: async (request, reply) => {
    // Admin-only logic
    return { message: "User created" };
  }
});
```

## Best Practices

1. **Always use HTTPS in production**
2. **Store secrets securely** (environment variables, vaults)
3. **Use header-based tokens** for better performance
4. **Combine with authentication** for maximum security
5. **Test CSRF protection** in development
6. **Rotate secrets periodically**

## Development vs Production

### Development
- `COOKIE_SECRET` can be a simple string
- `NODE_ENV` can be development
- Secure cookies disabled for local testing

### Production
- Use strong, randomly generated secrets
- Set `NODE_ENV=production` for secure cookies
- Store secrets in environment variables or vaults
- Enable HTTPS

## Troubleshooting

### Common Issues

1. **403 Forbidden**: Missing or invalid CSRF token
2. **Cookie not set**: Check cookie configuration
3. **Token mismatch**: Ensure token is sent correctly

### Debugging

Enable debug logging:
```javascript
fastify.register(fastifyCsrf, {
  logLevel: 'debug',
  // ... other options
});
```

## Dependencies

- `@fastify/cookie`: Cookie handling
- `@fastify/csrf-protection`: CSRF protection
- `fastify`: Web framework

## Security Notes

- Never commit secrets to version control
- Use different secrets for different environments
- Consider using a secrets management service
- Monitor for CSRF attacks in production logs