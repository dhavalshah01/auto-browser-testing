[← Previous: Test Implementation](./02-test-implementation.md) | [↑ Back to Home](./README.md) | [Next: Azure Integration →](./04-azure-integration.md)

---

# 3. Authentication System

Comprehensive guide to setting up authentication helpers, fixtures, and secure credential management for Playwright tests.

## Table of Contents

- [Authentication Overview](#authentication-overview)
- [Environment Variables Setup](#environment-variables-setup)
- [Authentication Helpers](#authentication-helpers)
- [Test Fixtures](#test-fixtures)
- [Secure Credential Management](#secure-credential-management)
- [Best Practices](#best-practices)

---

## Authentication Overview

### Why Authentication Matters

In real-world testing scenarios, many applications require:
- **User authentication** before accessing features
- **Role-based access** control
- **Session management** across tests
- **Secure credential** handling

### Authentication Strategies

This project supports multiple authentication approaches:

1. **Environment Variables** - Store credentials securely
2. **Test Fixtures** - Reusable authentication setup
3. **dotenv** - Load environment configuration
4. **Azure Integration** - Cloud-based authentication

---

## Environment Variables Setup

### Step 1: Create .env File

The project includes a `.env.example` template. Create your local `.env` file:

```bash
# Copy the example file
cp .env.example .env

# Edit with your credentials (never commit this file!)
nano .env
```

### Step 2: .env.example Template

```bash
# Environment Variables for Testing

# Test User Credentials
TEST_USERNAME=testuser@contoso.example
TEST_PASSWORD=TestPassword123!

# Base URLs
BASE_URL=https://contoso.example
API_URL=https://api.contoso.example

# Azure Playwright Workspaces
# Get this from Azure Portal: https://portal.azure.com
# Format: https://your-workspace.playwright.azure.com
PLAYWRIGHT_SERVICE_URL=

# Feature Flags
ENABLE_SCREENSHOTS=true
HEADLESS_MODE=true
```

### Step 3: .env Configuration

Your local `.env` file (excluded from Git):

```bash
# Test User Credentials - REAL VALUES
TEST_USERNAME=your-test-user@example.com
TEST_PASSWORD=YourSecurePassword123!

# Base URLs - ACTUAL ENDPOINTS
BASE_URL=https://www.microsoft.com/en-us/investor/default
API_URL=https://api.microsoft.com

# Azure Playwright Workspaces - YOUR WORKSPACE
PLAYWRIGHT_SERVICE_URL=https://eastus.api.playwright.microsoft.com/playwrightworkspaces/your-workspace-id

# Feature Flags
ENABLE_SCREENSHOTS=true
HEADLESS_MODE=false
```

### Step 4: Load Environment Variables

```javascript
// At the top of playwright.config.js
require('dotenv').config();

module.exports = defineConfig({
  use: {
    baseURL: process.env.BASE_URL || 'https://contoso.example',
    // ... other configurations
  },
});
```

### Step 5: Git Security

Ensure `.env` is in `.gitignore`:

```
# .gitignore
.env
node_modules/
/test-results/
/playwright-report/
```

**⚠️ CRITICAL:** Never commit `.env` files with real credentials to Git!

---

## Authentication Helpers

### Basic Authentication Helper

Create `tests/helpers/auth.helper.js`:

```javascript
class AuthHelper {
  constructor(page) {
    this.page = page;
  }

  async login(username, password) {
    // Navigate to login page
    await this.page.goto('/login');
    
    // Fill credentials
    await this.page.fill('[name="username"]', username);
    await this.page.fill('[name="password"]', password);
    
    // Submit form
    await this.page.click('[type="submit"]');
    
    // Wait for navigation
    await this.page.waitForURL('/dashboard');
  }

  async loginWithEnv() {
    const username = process.env.TEST_USERNAME;
    const password = process.env.TEST_PASSWORD;
    
    if (!username || !password) {
      throw new Error('TEST_USERNAME and TEST_PASSWORD must be set in .env');
    }
    
    await this.login(username, password);
  }

  async logout() {
    await this.page.click('[data-testid="logout-button"]');
    await this.page.waitForURL('/login');
  }

  async isLoggedIn() {
    return await this.page.locator('[data-testid="user-menu"]').isVisible();
  }
}

module.exports = { AuthHelper };
```

### Usage in Tests

```javascript
const { test, expect } = require('@playwright/test');
const { AuthHelper } = require('./helpers/auth.helper');

test('should login and access dashboard', async ({ page }) => {
  const auth = new AuthHelper(page);
  
  // Login using environment variables
  await auth.loginWithEnv();
  
  // Verify logged in
  expect(await auth.isLoggedIn()).toBe(true);
  
  // Test protected functionality
  await expect(page).toHaveURL('/dashboard');
});
```

---

## Test Fixtures

### What are Fixtures?

Fixtures in Playwright provide:
- **Reusable setup** code
- **Automatic cleanup** after tests
- **Dependency injection** for tests
- **Shared state** management

### Custom Authentication Fixture

Create `tests/fixtures/auth.fixture.js`:

```javascript
const { test as base } = require('@playwright/test');
const { AuthHelper } = require('../helpers/auth.helper');

// Extend base test with authentication
export const test = base.extend({
  // Authenticated page fixture
  authenticatedPage: async ({ page }, use) => {
    const auth = new AuthHelper(page);
    
    // Setup: Login before test
    await auth.loginWithEnv();
    
    // Provide authenticated page to test
    await use(page);
    
    // Teardown: Logout after test (optional)
    await auth.logout();
  },
});

export { expect } from '@playwright/test';
```

### Using Fixtures in Tests

```javascript
const { test, expect } = require('./fixtures/auth.fixture');

test('authenticated user can access profile', async ({ authenticatedPage }) => {
  // Page is already authenticated
  await authenticatedPage.goto('/profile');
  
  await expect(authenticatedPage).toHaveURL('/profile');
  await expect(authenticatedPage.locator('h1')).toHaveText('My Profile');
});

test('authenticated user can view settings', async ({ authenticatedPage }) => {
  await authenticatedPage.goto('/settings');
  
  await expect(authenticatedPage.locator('[data-testid="settings-panel"]'))
    .toBeVisible();
});
```

### Advanced Fixture with Storage State

Save authentication state for reuse:

```javascript
const { test: setup } = require('@playwright/test');

// Setup authentication state
setup('authenticate', async ({ page }) => {
  const auth = new AuthHelper(page);
  await auth.loginWithEnv();
  
  // Save authentication state
  await page.context().storageState({ 
    path: 'tests/.auth/user.json' 
  });
});

// Use saved authentication state
const { test, expect } = require('@playwright/test');

test.use({ 
  storageState: 'tests/.auth/user.json' 
});

test('user is already authenticated', async ({ page }) => {
  await page.goto('/dashboard');
  // Already logged in!
});
```

---

## Secure Credential Management

### 1. Local Development

**Use .env file:**
```bash
# .env (local only, never commit)
TEST_USERNAME=dev-user@example.com
TEST_PASSWORD=DevPassword123!
```

### 2. CI/CD Environments

**Use GitHub Secrets:**

```yaml
# .github/workflows/e2e.yml
env:
  TEST_USERNAME: ${{ secrets.TEST_USERNAME }}
  TEST_PASSWORD: ${{ secrets.TEST_PASSWORD }}
```

**Setting GitHub Secrets:**
1. Go to repository Settings
2. Navigate to Secrets and variables → Actions
3. Click "New repository secret"
4. Add `TEST_USERNAME` and `TEST_PASSWORD`

### 3. Azure Integration

**Use Azure Key Vault:**

```javascript
const { SecretClient } = require('@azure/keyvault-secrets');
const { DefaultAzureCredential } = require('@azure/identity');

async function getCredentials() {
  const credential = new DefaultAzureCredential();
  const client = new SecretClient(
    'https://your-vault.vault.azure.net',
    credential
  );
  
  const username = await client.getSecret('test-username');
  const password = await client.getSecret('test-password');
  
  return {
    username: username.value,
    password: password.value
  };
}
```

### 4. Environment-Specific Configuration

```javascript
// config/env.config.js
const environments = {
  development: {
    baseURL: 'http://localhost:3000',
    username: process.env.DEV_USERNAME,
    password: process.env.DEV_PASSWORD,
  },
  staging: {
    baseURL: 'https://staging.example.com',
    username: process.env.STAGING_USERNAME,
    password: process.env.STAGING_PASSWORD,
  },
  production: {
    baseURL: 'https://www.example.com',
    username: process.env.PROD_USERNAME,
    password: process.env.PROD_PASSWORD,
  }
};

const env = process.env.NODE_ENV || 'development';
module.exports = environments[env];
```

---

## Best Practices

### ✅ DO

1. **Use environment variables** for credentials
   ```javascript
   const username = process.env.TEST_USERNAME;
   ```

2. **Add .env to .gitignore** immediately
   ```
   echo ".env" >> .gitignore
   ```

3. **Provide .env.example** as a template
   ```bash
   # Example file with placeholder values
   TEST_USERNAME=example@example.com
   ```

4. **Use GitHub Secrets** for CI/CD
   ```yaml
   env:
     USERNAME: ${{ secrets.TEST_USERNAME }}
   ```

5. **Rotate credentials** regularly
   - Update passwords monthly
   - Use different credentials per environment
   - Audit access logs

6. **Validate environment variables** before use
   ```javascript
   if (!process.env.TEST_USERNAME) {
     throw new Error('TEST_USERNAME is required');
   }
   ```

7. **Use storage state** for faster tests
   ```javascript
   await page.context().storageState({ path: 'auth.json' });
   ```

### ❌ DON'T

1. **Never hardcode credentials** in test files
   ```javascript
   // ❌ BAD
   await login('user@example.com', 'password123');
   ```

2. **Never commit .env** files
   ```bash
   # Check if .env is tracked
   git status
   ```

3. **Never log sensitive data**
   ```javascript
   // ❌ BAD
   console.log('Password:', password);
   ```

4. **Never use production credentials** in tests
   - Create dedicated test accounts
   - Use test/staging environments

5. **Never share credentials** in plain text
   - Use secure password managers
   - Encrypt if transmission needed

---

## Environment Variables Reference

| Variable | Purpose | Example | Required |
|----------|---------|---------|----------|
| `TEST_USERNAME` | Test user email | `test@example.com` | ✅ |
| `TEST_PASSWORD` | Test user password | `SecurePass123!` | ✅ |
| `BASE_URL` | Application URL | `https://example.com` | ✅ |
| `API_URL` | API endpoint | `https://api.example.com` | ⚠️ |
| `PLAYWRIGHT_SERVICE_URL` | Azure workspace URL | `https://eastus...` | ⚠️ |
| `ENABLE_SCREENSHOTS` | Screenshot flag | `true` / `false` | ❌ |
| `HEADLESS_MODE` | Browser visibility | `true` / `false` | ❌ |

**Legend:**
- ✅ Required for basic tests
- ⚠️ Required for specific features (API tests, Azure)
- ❌ Optional feature flags

---

## Validation Checklist

✅ `.env` file created and configured  
✅ `.env` added to `.gitignore`  
✅ `.env.example` provided for team  
✅ Environment variables loaded with `dotenv`  
✅ GitHub Secrets configured for CI/CD  
✅ Test credentials validated  
✅ Authentication helpers created  
✅ Test fixtures implemented  
✅ No hardcoded credentials in code  
✅ Credentials rotation plan in place  

---

## Next Steps

✅ **Completed:**
- Environment variables configuration
- .env file setup
- Authentication helpers
- Test fixtures
- Secure credential management

🎯 **Coming Next:**
- Azure Playwright Workspaces integration
- Cloud-based parallel testing
- Service configuration
- Performance comparison

---

[← Previous: Test Implementation](./02-test-implementation.md) | [↑ Back to Home](./README.md) | [Next: Azure Integration →](./04-azure-integration.md)
