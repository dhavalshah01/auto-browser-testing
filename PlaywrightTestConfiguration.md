# Playwright Test Configuration Guide

Complete guide for setting up and configuring Playwright testing framework with Azure Playwright Workspaces integration.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Initial Setup](#initial-setup)
- [Local Configuration](#local-configuration)
- [Azure Playwright Workspaces Setup](#azure-playwright-workspaces-setup)
- [Environment Variables](#environment-variables)
- [Running Tests](#running-tests)
- [Troubleshooting](#troubleshooting)

---

## Prerequisites

Before starting, ensure you have:

- **Node.js** (v16 or higher)
- **npm** (comes with Node.js)
- **Git** installed and configured
- **VS Code** or your preferred IDE
- **Azure subscription** (for Azure Playwright Workspaces)
- **Azure CLI** installed ([Download](https://aka.ms/azurecli))

---

## Initial Setup

### Step 1: Initialize Project

```bash
# Navigate to your project directory
cd your-project-folder

# Initialize npm project (if not already done)
npm init -y
```

### Step 2: Install Playwright

```bash
# Install Playwright test package
npm install -D @playwright/test

# Install browsers
npx playwright install
```

### Step 3: Create Project Structure

```bash
# Create test directories
mkdir -p tests/pages tests/helpers

# Create configuration files
touch playwright.config.js
touch .env.example
touch .gitignore
```

### Step 4: Configure .gitignore

Create `.gitignore` with the following content:

```gitignore
# Dependencies
node_modules/

# Playwright Test Results
test-results/
playwright-report/
playwright/.cache/

# Authentication State
playwright/.auth/
*.auth.json

# Environment Variables
.env
.env.local
```

---

## Local Configuration

### Step 1: Create Playwright Configuration

Create `playwright.config.js`:

```javascript
const { defineConfig, devices } = require('@playwright/test');

// Load environment variables
require('dotenv').config();

module.exports = defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  
  use: {
    baseURL: process.env.BASE_URL || 'https://contoso.example',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },

  projects: [
    {
      name: 'chromium',
      use: { 
        ...devices['Desktop Chrome'],
      },
    },
  ],
});
```

### Step 2: Install dotenv

```bash
npm install -D dotenv
```

### Step 3: Create Environment Variables Template

Create `.env.example`:

```env
# Environment Variables for Testing

# Test User Credentials
TEST_USERNAME=testuser@contoso.example
TEST_PASSWORD=TestPassword123!

# Base URLs
BASE_URL=https://contoso.example
API_URL=https://api.contoso.example

# Azure Playwright Workspaces
# Get this from Azure Portal: https://portal.azure.com
# Format: https://eastus.api.playwright.microsoft.com/playwrightworkspaces/{workspace-id}
PLAYWRIGHT_SERVICE_URL=

# Feature Flags
ENABLE_SCREENSHOTS=true
HEADLESS_MODE=true
```

### Step 4: Create Local .env File

```bash
cp .env.example .env
```

Edit `.env` file with your actual values.

---

## Azure Playwright Workspaces Setup

### Step 1: Install Azure Playwright Package

```bash
npm init @azure/playwright@latest
```

This command will:
- Install `@azure/playwright` and `@azure/identity` packages
- Create `playwright.service.config.js` configuration file

### Step 2: Create Azure Playwright Workspaces Resource

1. Go to [Azure Portal](https://portal.azure.com)
2. Click **+ Create a resource**
3. Search for **Playwright Testing**
4. Click **Create**
5. Fill in the details:
   - **Subscription**: Select your subscription
   - **Resource Group**: Create new or select existing
   - **Name**: Your workspace name
   - **Region**: Choose closest region (e.g., East US)
6. Click **Review + Create**
7. Click **Create**

### Step 3: Get Workspace URL

After resource creation:

1. Navigate to your Playwright Testing resource
2. Go to **Overview** page
3. Copy the **Browser endpoint URL**
4. The URL format should be: `https://eastus.api.playwright.microsoft.com/playwrightworkspaces/{workspace-id}`

**Important:** Do NOT use the WebSocket URL (`wss://...`). Use the HTTPS URL without `/browsers` at the end.

### Step 4: Configure Environment Variables

Update your `.env` file:

```env
PLAYWRIGHT_SERVICE_URL=https://eastus.api.playwright.microsoft.com/playwrightworkspaces/your-workspace-id
```

### Step 5: Authenticate with Azure

```bash
# Login to Azure CLI
az login

# If you have multiple accounts, clear cache first
az account clear
az login
```

**Select the correct subscription** when prompted.

### Step 6: Verify Authentication

```bash
# Check current account
az account show

# List available subscriptions
az account list --output table
```

### Step 7: Set Up Azure Role Assignments

Ensure your Azure account has the required permissions:

1. Go to your Playwright Testing resource in Azure Portal
2. Click **Access control (IAM)**
3. Click **+ Add** → **Add role assignment**
4. Select **Playwright Testing Contributor** role
5. Assign to your user account
6. Click **Review + assign**

---

## Environment Variables

### Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `BASE_URL` | Base URL for your application | `https://www.microsoft.com/en-us/investor/default` |
| `PLAYWRIGHT_SERVICE_URL` | Azure Playwright Workspaces URL | `https://eastus.api.playwright.microsoft.com/playwrightworkspaces/xxx` |

### Optional Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `TEST_USERNAME` | Test user username | - |
| `TEST_PASSWORD` | Test user password | - |
| `ENABLE_SCREENSHOTS` | Enable screenshot capture | `true` |
| `HEADLESS_MODE` | Run in headless mode | `true` |

---

## Running Tests

### Local Testing

```bash
# Run all tests locally
npm test

# Run tests in UI mode
npm run test:ui

# Run tests with visible browser
npm run test:headed

# Run specific test file
npx playwright test microsoft-stock.spec.js
```

### Azure Playwright Workspaces Testing

```bash
# Run tests in Azure with 20 parallel workers
npx playwright test -c playwright.service.config.js --workers=20

# Run specific test in Azure
npx playwright test microsoft-stock.spec.js -c playwright.service.config.js

# View test report
npx playwright show-report
```

### Package.json Scripts

Add these scripts to your `package.json`:

```json
{
  "scripts": {
    "test": "playwright test",
    "test:ui": "playwright test --ui",
    "test:headed": "playwright test --headed",
    "test:debug": "playwright test --debug",
    "test:report": "playwright show-report",
    "test:azure": "playwright test -c playwright.service.config.js --workers=20",
    "test:stock": "playwright test microsoft-stock.spec.js",
    "test:stock:ui": "playwright test microsoft-stock.spec.js --ui",
    "test:stock:headed": "playwright test microsoft-stock.spec.js --headed",
    "test:stock:azure": "playwright test microsoft-stock.spec.js -c playwright.service.config.js --workers=20"
  }
}
```

---

## Troubleshooting

### Issue 1: Module 'dotenv' Not Found

**Error:**
```
Error: Cannot find module 'dotenv'
```

**Solution:**
```bash
npm install -D dotenv
```

---

### Issue 2: PLAYWRIGHT_SERVICE_URL Not Set

**Error:**
```
The value for the PLAYWRIGHT_SERVICE_URL variable is not set correctly.
```

**Solution:**
1. Verify URL format in `.env` file
2. Ensure you're using HTTPS format (not WSS)
3. Remove `/browsers` from the end of URL

**Correct format:**
```env
PLAYWRIGHT_SERVICE_URL=https://eastus.api.playwright.microsoft.com/playwrightworkspaces/0dd101bc-9839-43e5-b930-dd448be662be
```

**Incorrect formats:**
```env
# ❌ Wrong - WebSocket URL
PLAYWRIGHT_SERVICE_URL=wss://eastus.api.playwright.microsoft.com/...

# ❌ Wrong - Has /browsers at the end
PLAYWRIGHT_SERVICE_URL=https://eastus.api.playwright.microsoft.com/.../browsers
```

---

### Issue 3: 403 Forbidden - CheckAccess API Error

**Error:**
```
CheckAccess API call with non successful response. StatusCode: Forbidden
WebSocket error: 403 Forbidden
```

**Causes:**
1. Not authenticated with Azure
2. Wrong workspace URL
3. Missing permissions
4. Incorrect Azure subscription

**Solutions:**

**A. Clear Azure credentials and re-authenticate:**
```bash
az account clear
az login
```

**B. Select correct subscription:**
```bash
# List subscriptions
az account list --output table

# Set specific subscription
az account set --subscription "Your-Subscription-Name"
```

**C. Verify workspace URL:**
- Go to Azure Portal → Your Playwright Testing resource
- Copy the endpoint URL from Overview page
- Update `.env` file with correct URL

**D. Check role assignments:**
1. Azure Portal → Playwright Testing resource
2. Access control (IAM)
3. Verify you have **Playwright Testing Contributor** role
4. If not, request access from administrator

**E. Verify Azure tenant:**
```bash
# Show current account details
az account show

# Make sure you're in the correct tenant
az login --tenant YOUR-TENANT-ID
```

---

### Issue 4: Multiple Azure Accounts Conflict

**Error:**
```
Found multiple accounts with the same username
```

**Solution:**
```bash
# Clear all cached accounts
az account clear

# Login with fresh session
az login

# Select the correct subscription when prompted
```

---

### Issue 5: Authentication Requires Multi-Factor Authentication

**Error:**
```
AADSTS50076: Due to a configuration change by your administrator, you must use multi-factor authentication
```

**Solution:**
```bash
# Use device code authentication
az login --use-device-code

# Follow the instructions to authenticate via browser
```

---

### Issue 6: Missing Authentication State File

**Error:**
```
Error reading storage state from playwright/.auth/user.json:
ENOENT: no such file or directory
```

**Solution:**

**Option A:** Remove authentication requirement from config (for public tests):

Edit `playwright.config.js`:
```javascript
projects: [
  {
    name: 'chromium',
    use: { 
      ...devices['Desktop Chrome'],
      // Remove storageState if not needed
    },
  },
],
```

**Option B:** Create authentication state file:
```bash
# Create directory
mkdir -p playwright/.auth

# Run authentication setup
npx playwright test auth.setup.js
```

---

### Issue 7: Git Push Errors

**Error:**
```
error: src refspec main does not match any
```

**Solution:**
```bash
# Check current branch
git branch

# If on master, push to master
git push -u origin master

# Or rename branch to main
git branch -M main
git push -u origin main
```

---

### Issue 8: Browsers Not Installed

**Error:**
```
browserType.launch: Executable doesn't exist
```

**Solution:**
```bash
# Install Playwright browsers
npx playwright install

# Install specific browser
npx playwright install chromium
```

---

### Issue 9: Tests Timeout in Azure

**Error:**
```
Test timeout of 30000ms exceeded
```

**Solution:**

Increase timeout in `playwright.config.js`:
```javascript
module.exports = defineConfig({
  timeout: 60000, // 60 seconds
  use: {
    actionTimeout: 10000,
    navigationTimeout: 30000,
  },
});
```

---

### Issue 10: Environment Variables Not Loading

**Error:**
Variables in `.env` file are not being read.

**Solution:**
1. Verify `.env` file exists in project root
2. Ensure `dotenv` is installed
3. Check `playwright.config.js` has `require('dotenv').config()`
4. Restart terminal/IDE after changing `.env`

---

## Best Practices

### 1. Environment Management
- Never commit `.env` file to git
- Always update `.env.example` with new variables
- Use different `.env` files for different environments

### 2. Azure Credentials
- Keep Azure CLI logged in during development
- Refresh tokens if you see authentication errors
- Use service principals in CI/CD pipelines

### 3. Test Organization
- Use Page Object Model pattern
- Separate concerns (pages, tests, helpers)
- Keep test files focused and concise

### 4. Error Handling
- Always add try-catch blocks for critical operations
- Take screenshots on failures
- Log meaningful error messages

### 5. Performance
- Use parallel execution in Azure (`--workers=20`)
- Run tests locally during development
- Use Azure for CI/CD and extensive test runs

---

## Verification Checklist

Before running tests, verify:

- [ ] Node.js and npm installed
- [ ] Playwright installed (`npm install -D @playwright/test`)
- [ ] Browsers installed (`npx playwright install`)
- [ ] `dotenv` package installed
- [ ] `.env` file created with correct values
- [ ] Azure CLI installed (for Azure testing)
- [ ] Logged into Azure (`az login`)
- [ ] Correct subscription selected
- [ ] Playwright Testing resource created in Azure
- [ ] Workspace URL configured in `.env`
- [ ] Role assignments set (Playwright Testing Contributor)
- [ ] Git repository initialized and configured

---

## Quick Reference

### Essential Commands

```bash
# Setup
npm install
npx playwright install

# Local Testing
npm test                    # Run all tests
npm run test:ui            # UI mode
npm run test:headed        # Visible browser

# Azure Testing
az login                    # Authenticate
npm run test:azure         # Run in Azure

# Debugging
npm run test:debug         # Debug mode
npx playwright show-report # View report

# Git
git add .
git commit -m "message"
git push origin master
```

### Configuration Files

- `playwright.config.js` - Local Playwright configuration
- `playwright.service.config.js` - Azure Playwright configuration
- `.env` - Environment variables (not committed)
- `.env.example` - Environment variables template
- `.gitignore` - Git ignore rules
- `package.json` - Project dependencies and scripts

---

## Additional Resources

- [Playwright Documentation](https://playwright.dev/)
- [Azure Playwright Workspaces](https://aka.ms/pww/docs)
- [Azure CLI Documentation](https://docs.microsoft.com/cli/azure/)
- [dotenv Documentation](https://github.com/motdotla/dotenv)
- [Page Object Model](https://playwright.dev/docs/pom)

---

## Support

If you encounter issues not covered in this guide:

1. Check Playwright logs: `DEBUG=pw:api npm test`
2. Review Azure Portal for resource status
3. Verify Azure role assignments
4. Check network connectivity
5. Consult Azure Playwright Workspaces documentation

---

**Last Updated:** January 31, 2026

**Author:** Generated from successful Playwright setup and Azure integration
