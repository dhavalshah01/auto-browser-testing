[↑ Back to Home](./README.md) | [Next: Test Implementation →](./02-test-implementation.md)

---

# 1. Project Setup

Complete guide to initializing the Auto Browser Testing project with Playwright.

## Table of Contents

- [Repository Initialization](#repository-initialization)
- [Playwright Installation](#playwright-installation)
- [Dependencies Configuration](#dependencies-configuration)
- [Project Structure Overview](#project-structure-overview)
- [Configuration Files](#configuration-files)
- [Verification](#verification)

---

## Repository Initialization

### Step 1: Create Repository

```bash
# Create project directory
mkdir auto-browser-testing
cd auto-browser-testing

# Initialize Git repository
git init

# Create package.json
npm init -y
```

### Step 2: Initialize Node.js Project

The project uses Node.js with CommonJS module system for maximum compatibility.

**Generated package.json:**
```json
{
  "name": "auto-browser-testing",
  "version": "1.0.0",
  "type": "commonjs",
  "description": "Automated browser testing with Playwright",
  "main": "index.js",
  "keywords": ["playwright", "testing", "automation"],
  "author": "",
  "license": "ISC"
}
```

---

## Playwright Installation

### Step 1: Install Playwright

```bash
# Install Playwright and test runner
npm install -D @playwright/test

# Install Playwright browsers
npx playwright install
```

This installs:
- `@playwright/test` - Playwright Test runner
- Chromium, Firefox, and WebKit browsers
- Browser dependencies

### Step 2: Install Additional Dependencies

```bash
# Install Azure Playwright integration
npm install -D @azure/playwright @azure/identity

# Install environment variables support
npm install -D dotenv
```

**Why these dependencies?**
- `@azure/playwright` - Enables cloud-based testing in Azure Playwright Workspaces
- `@azure/identity` - Handles Azure authentication
- `dotenv` - Manages environment variables securely

---

## Dependencies Configuration

### Final package.json

```json
{
  "name": "auto-browser-testing",
  "version": "1.0.0",
  "description": "Automated browser testing with Playwright and Azure integration",
  "main": "index.js",
  "scripts": {
    "test": "playwright test",
    "test:ui": "playwright test --ui",
    "test:headed": "playwright test --headed",
    "test:debug": "playwright test --debug",
    "test:report": "playwright show-report",
    "test:stock": "playwright test microsoft-stock.spec.js",
    "test:stock:ui": "playwright test microsoft-stock.spec.js --ui",
    "test:stock:headed": "playwright test microsoft-stock.spec.js --headed"
  },
  "repository": {
    "type": "git",
    "url": "git+https://github.com/dhavalshah01/auto-browser-testing.git"
  },
  "keywords": [],
  "author": "",
  "license": "ISC",
  "type": "commonjs",
  "devDependencies": {
    "@azure/identity": "^4.13.0",
    "@azure/playwright": "^1.1.1",
    "@playwright/test": "^1.58.1",
    "dotenv": "^17.2.3"
  }
}
```

### NPM Scripts Explained

| Script | Command | Purpose |
|--------|---------|---------|
| `npm test` | `playwright test` | Run all tests in headless mode |
| `npm run test:ui` | `playwright test --ui` | Interactive UI mode for test development |
| `npm run test:headed` | `playwright test --headed` | Run tests with browser UI visible |
| `npm run test:debug` | `playwright test --debug` | Debug mode with breakpoints |
| `npm run test:report` | `playwright show-report` | View HTML test report |
| `npm run test:stock` | Run only Microsoft stock tests | Focused test execution |

---

## Project Structure Overview

```
auto-browser-testing/
├── .github/
│   └── workflows/
│       ├── e2e.yml                    # Local testing workflow
│       └── e2e-azure.yml              # Azure cloud testing workflow
├── demo/                              # Demo documentation
│   ├── README.md                      # Navigation hub
│   ├── 01-project-setup.md           # This file
│   ├── 02-test-implementation.md
│   ├── 03-authentication-system.md
│   ├── 04-azure-integration.md
│   ├── 05-cicd-pipeline.md
│   └── 06-results-and-metrics.md
├── tests/
│   ├── microsoft-stock.spec.js       # Test specification
│   └── pages/
│       └── microsoft-investor.page.js # Page Object Model
├── .env.example                       # Environment variables template
├── .gitignore                         # Git ignore rules
├── package.json                       # Project dependencies
├── playwright.config.js              # Playwright configuration
├── playwright.service.config.js      # Azure Playwright config
└── README.md                          # Project overview
```

### Directory Purpose

- **`.github/workflows/`** - CI/CD pipeline definitions
- **`tests/`** - Test specifications and Page Objects
- **`tests/pages/`** - Page Object Model implementations
- **`demo/`** - Comprehensive demo documentation
- **Root files** - Configuration and documentation

---

## Configuration Files

### 1. playwright.config.js

Main Playwright configuration for local testing:

```javascript
const { defineConfig, devices } = require('@playwright/test');
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
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
```

**Key settings:**
- `fullyParallel: true` - Run tests in parallel
- `retries: 2` - Retry failed tests in CI
- `reporter: 'html'` - Generate HTML report
- `trace: 'on-first-retry'` - Capture trace on retry

### 2. playwright.service.config.js

Azure Playwright Workspaces configuration:

```javascript
const { defineConfig } = require('@playwright/test');
const { createAzurePlaywrightConfig, ServiceOS } = require('@azure/playwright');
const { DefaultAzureCredential } = require('@azure/identity');
const config = require('./playwright.config');

export default defineConfig(
  config,
  createAzurePlaywrightConfig(config, {
    exposeNetwork: '<loopback>',
    connectTimeout: 3 * 60 * 1000, // 3 minutes
    os: ServiceOS.LINUX,
    credential: new DefaultAzureCredential(),
  })
);
```

**Azure-specific settings:**
- `exposeNetwork: '<loopback>'` - Local service access
- `connectTimeout: 180000ms` - 3-minute connection timeout
- `os: ServiceOS.LINUX` - Run tests on Linux
- `DefaultAzureCredential()` - Azure authentication

### 3. .env.example

Environment variables template:

```bash
# Test User Credentials
TEST_USERNAME=testuser@contoso.example
TEST_PASSWORD=TestPassword123!

# Base URLs
BASE_URL=https://contoso.example
API_URL=https://api.contoso.example

# Azure Playwright Workspaces
PLAYWRIGHT_SERVICE_URL=

# Feature Flags
ENABLE_SCREENSHOTS=true
HEADLESS_MODE=true
```

### 4. .gitignore

```
node_modules/
/test-results/
/playwright-report/
/blob-report/
/playwright/.cache/
.env
```

---

## Verification

### Verify Installation

```bash
# Check Node.js version
node --version
# Expected: v20.x.x or higher

# Check npm version
npm --version
# Expected: 10.x.x or higher

# Check Playwright installation
npx playwright --version
# Expected: Version 1.58.1 or higher
```

### Verify Project Structure

```bash
# List project files
ls -la

# Verify node_modules
ls node_modules/@playwright

# Check test directory
ls tests/
```

### Test Configuration

```bash
# Validate Playwright config
npx playwright test --list

# Expected output:
# Listing tests:
#   microsoft-stock.spec.js:11:3 - Microsoft Investor Page Tests
#   ...
```

---

## Next Steps

✅ **Completed:**
- Repository initialized
- Playwright installed
- Dependencies configured
- Project structure created
- Configuration files set up

🎯 **Coming Next:**
- Implement test scenarios
- Create Page Object Models
- Set up authentication
- Configure Azure integration

---

[↑ Back to Home](./README.md) | [Next: Test Implementation →](./02-test-implementation.md)
