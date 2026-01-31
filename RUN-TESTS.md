# Running Playwright Tests

This guide provides comprehensive instructions for running tests in this project with different scenarios and modes.

## Table of Contents

- [Quick Start](#quick-start)
- [Running All Tests](#running-all-tests)
- [Running Specific Tests](#running-specific-tests)
- [Test Modes](#test-modes)
- [Microsoft Stock Price Tests](#microsoft-stock-price-tests)
- [Authentication Tests](#authentication-tests)
- [Debugging Tests](#debugging-tests)
- [Test Reports](#test-reports)
- [Advanced Options](#advanced-options)

---

## Quick Start

```bash
# Install dependencies (if not already done)
npm install

# Run all tests
npm test

# Run tests in UI mode (recommended for beginners)
npm run test:ui
```

---

## Running All Tests

### Run All Tests (Headless Mode)
```bash
npm test
```
or
```bash
npx playwright test
```

### Run All Tests in UI Mode
```bash
npm run test:ui
```
This opens an interactive UI where you can:
- Select and run individual tests
- Watch tests execute in real-time
- Inspect test steps and assertions
- View screenshots and traces

### Run All Tests with Visible Browser
```bash
npm run test:headed
```
or
```bash
npx playwright test --headed
```

---

## Running Specific Tests

### Run a Specific Test File
```bash
npx playwright test <filename>
```

**Examples:**
```bash
npx playwright test contoso.spec.js
npx playwright test microsoft-stock.spec.js
npx playwright test authenticated.spec.js
```

### Run Tests by Name/Pattern
```bash
npx playwright test -g "test name pattern"
```

**Examples:**
```bash
npx playwright test -g "stock price"
npx playwright test -g "should verify title"
```

### Run Tests in Specific Directory
```bash
npx playwright test tests/
npx playwright test tests/pages/
```

---

## Test Modes

### 1. Headless Mode (Default)
Tests run in the background without opening a browser window.
```bash
npm test
```
**Best for:** CI/CD pipelines, automated testing

### 2. Headed Mode
Tests run with a visible browser window.
```bash
npm run test:headed
npx playwright test --headed
```
**Best for:** Watching test execution, understanding test flow

### 3. UI Mode (Interactive)
Opens Playwright's interactive test runner.
```bash
npm run test:ui
npx playwright test --ui
```
**Best for:** Development, debugging, exploring tests

### 4. Debug Mode
Runs tests with Playwright Inspector for step-by-step debugging.
```bash
npm run test:debug
npx playwright test --debug
```
**Best for:** Troubleshooting failing tests, understanding issues

---

## Microsoft Stock Price Tests

### Run All Stock Tests
```bash
npm run test:stock
```
or
```bash
npx playwright test microsoft-stock.spec.js
```

### Run Stock Tests in UI Mode
```bash
npm run test:stock:ui
```
or
```bash
npx playwright test microsoft-stock.spec.js --ui
```

### Run Stock Tests with Visible Browser
```bash
npm run test:stock:headed
```
or
```bash
npx playwright test microsoft-stock.spec.js --headed
```

### Run Specific Stock Test
```bash
npx playwright test microsoft-stock.spec.js -g "fetch current stock price"
npx playwright test microsoft-stock.spec.js -g "detailed stock information"
npx playwright test microsoft-stock.spec.js -g "screenshot"
```

---

## Authentication Tests

### Run Authenticated Tests
```bash
npx playwright test authenticated.spec.js
```

### Run Setup Only (Create Auth State)
```bash
npx playwright test auth.setup.js
```

### Run with Specific Credentials
```bash
# Set environment variables first
TEST_USERNAME=user@example.com TEST_PASSWORD=pass123 npm test
```

### Run Authenticated Tests in UI Mode
```bash
npx playwright test authenticated.spec.js --ui
```

---

## Debugging Tests

### Debug Mode (Step Through Tests)
```bash
npm run test:debug
npx playwright test --debug
```

### Debug Specific Test
```bash
npx playwright test microsoft-stock.spec.js --debug
npx playwright test --debug -g "stock price"
```

### Debug from Specific Line
```bash
# Add this line in your test where you want to pause:
await page.pause();
```

### Show Browser Console
```bash
PWDEBUG=console npx playwright test
```

### Run with Verbose Logging
```bash
DEBUG=pw:api npx playwright test
```

---

## Test Reports

### View Last Test Report
```bash
npm run test:report
```
or
```bash
npx playwright show-report
```

### Generate HTML Report
```bash
npx playwright test --reporter=html
```

### View Report in Different Formats
```bash
# List format
npx playwright test --reporter=list

# Line format (minimal)
npx playwright test --reporter=line

# JSON format
npx playwright test --reporter=json
```

---

## Advanced Options

### Run Tests on Specific Browser
```bash
npx playwright test --project=chromium
npx playwright test --project=firefox
npx playwright test --project=webkit
```

### Run Tests in Parallel
```bash
npx playwright test --workers=4
```

### Run Tests with Maximum Parallelism
```bash
npx playwright test --workers=100%
```

### Run Tests Sequentially
```bash
npx playwright test --workers=1
```

### Run Failed Tests Only
```bash
npx playwright test --last-failed
```

### Update Snapshots
```bash
npx playwright test --update-snapshots
```

### Run Tests with Screenshots
```bash
npx playwright test --screenshot=on
npx playwright test --screenshot=only-on-failure
```

### Run Tests with Video Recording
```bash
npx playwright test --video=on
npx playwright test --video=retain-on-failure
```

### Run Tests with Traces
```bash
npx playwright test --trace=on
npx playwright test --trace=retain-on-failure
```

### Set Test Timeout
```bash
npx playwright test --timeout=60000
```

### Run Tests Multiple Times
```bash
npx playwright test --repeat-each=3
```

### Run with Retries
```bash
npx playwright test --retries=2
```

---

## Environment-Specific Testing

### Test Against Different Environments

**Local Environment:**
```bash
BASE_URL=http://localhost:3000 npm test
```

**Staging Environment:**
```bash
BASE_URL=https://staging.contoso.example npm test
```

**Production Environment:**
```bash
BASE_URL=https://contoso.example npm test
```

### Use .env File
1. Create `.env` file:
```bash
cp .env.example .env
```

2. Update variables:
```env
BASE_URL=https://your-site.com
TEST_USERNAME=your-username
TEST_PASSWORD=your-password
```

3. Run tests (automatically loads .env):
```bash
npm test
```

---

## Continuous Integration (CI)

### Run Tests in CI Mode
```bash
CI=true npm test
```

### GitHub Actions Example
```yaml
- name: Run Playwright tests
  run: npx playwright test
  
- name: Upload test results
  uses: actions/upload-artifact@v3
  if: always()
  with:
    name: playwright-report
    path: playwright-report/
```

---

## Common Test Scenarios

### Scenario 1: Development (Watch & Debug)
```bash
npm run test:ui
```

### Scenario 2: Quick Verification
```bash
npm run test:headed
```

### Scenario 3: CI/CD Pipeline
```bash
CI=true npx playwright test --reporter=line
```

### Scenario 4: Troubleshooting Failures
```bash
npx playwright test --debug --repeat-each=1
```

### Scenario 5: Testing Specific Feature
```bash
npx playwright test -g "feature-name" --headed
```

### Scenario 6: Full Test Suite with Reports
```bash
npx playwright test --reporter=html,line
npx playwright show-report
```

---

## Troubleshooting

### Tests Failing?
1. Run in headed mode to watch: `npm run test:headed`
2. Use debug mode: `npm run test:debug`
3. Check test reports: `npm run test:report`

### Can't Find Elements?
1. Use Playwright Inspector: `npx playwright test --debug`
2. Use Codegen to generate selectors: `npx playwright codegen https://your-site.com`

### Slow Tests?
1. Run in parallel: `npx playwright test --workers=4`
2. Reduce timeout: `npx playwright test --timeout=30000`

### Authentication Issues?
1. Verify credentials in `.env` file
2. Run setup manually: `npx playwright test auth.setup.js`
3. Delete auth state and retry: `rm -rf playwright/.auth`

---

## Useful Commands Summary

| Command | Description |
|---------|-------------|
| `npm test` | Run all tests (headless) |
| `npm run test:ui` | Run in interactive UI mode |
| `npm run test:headed` | Run with visible browser |
| `npm run test:debug` | Debug mode with inspector |
| `npm run test:report` | View test report |
| `npm run test:stock` | Run Microsoft stock tests |
| `npm run test:stock:ui` | Stock tests in UI mode |
| `npx playwright codegen` | Generate test code |
| `npx playwright show-report` | Show HTML report |
| `npx playwright test --help` | Show all options |

---

## Additional Resources

- [Playwright Documentation](https://playwright.dev/)
- [Playwright Best Practices](https://playwright.dev/docs/best-practices)
- [Playwright API Reference](https://playwright.dev/docs/api/class-playwright)
- [Test Generator Tool](https://playwright.dev/docs/codegen)

---

## Getting Help

If you encounter issues:
1. Check test reports: `npm run test:report`
2. Run in debug mode: `npm run test:debug`
3. View browser console: `PWDEBUG=console npm test`
4. Check Playwright logs: `DEBUG=pw:api npm test`

---

**Happy Testing! 🚀**
