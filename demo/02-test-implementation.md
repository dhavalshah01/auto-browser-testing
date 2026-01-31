[← Previous: Project Setup](./01-project-setup.md) | [↑ Back to Home](./README.md) | [Next: Authentication System →](./03-authentication-system.md)

---

# 2. Test Implementation

Comprehensive guide to implementing automated Microsoft stock price extraction tests using the Page Object Model pattern.

## Table of Contents

- [Microsoft Stock Price Automation](#microsoft-stock-price-automation)
- [Page Object Model Pattern](#page-object-model-pattern)
- [Test Scenarios](#test-scenarios)
- [Local Execution](#local-execution)
- [Test Results](#test-results)

---

## Microsoft Stock Price Automation

### Objective

Automate the extraction of Microsoft's current stock price from the official Microsoft Investor Relations page.

**Target URL:** `https://www.microsoft.com/en-us/investor/default`

### Why This Test?

This real-world test demonstrates:
- **Web scraping** capabilities of Playwright
- **Dynamic content** handling
- **Robust selector** strategies
- **Data validation** and parsing
- **Practical use case** for business intelligence

---

## Page Object Model Pattern

### What is Page Object Model?

The **Page Object Model (POM)** is a design pattern that:
- **Encapsulates** page elements and interactions
- **Separates** test logic from page structure
- **Improves** code maintainability
- **Enables** code reusability
- **Reduces** code duplication

### Implementation

#### File Structure

```
tests/
├── microsoft-stock.spec.js          # Test specification
└── pages/
    └── microsoft-investor.page.js   # Page Object
```

#### Page Object: microsoft-investor.page.js

```javascript
class MicrosoftInvestorPage {
  constructor(page) {
    this.page = page;
    this.url = 'https://www.microsoft.com/en-us/investor/default';
    
    // Multiple selector strategies for robustness
    this.stockPriceSelectors = [
      '[data-testid="stock-price"]',
      '.stock-price',
      '[class*="stock"] [class*="price"]',
      'text=/\\$\\d+\\.\\d{2}/',
      '.quote-price',
      '[aria-label*="stock price"]',
      '[aria-label*="current price"]',
    ];
  }

  async goto() {
    await this.page.goto(this.url);
    await this.page.waitForLoadState('networkidle');
  }

  async getStockPrice() {
    // Try multiple selectors to find the stock price
    for (const selector of this.stockPriceSelectors) {
      try {
        const element = this.page.locator(selector).first();
        if (await element.isVisible({ timeout: 2000 })) {
          const text = await element.textContent();
          // Extract price from text (e.g., "$123.45" or "123.45")
          const priceMatch = text.match(/\$?\d+\.?\d*/);
          if (priceMatch) {
            return priceMatch[0].replace('$', '');
          }
        }
      } catch (error) {
        continue; // Try next selector
      }
    }

    // Fallback: Search in page content
    const content = await this.page.content();
    const pricePattern = /stock price.*?\$?(\d+\.\d{2})/i;
    const match = content.match(pricePattern);
    
    if (match) return match[1];

    throw new Error('Stock price not found on the page');
  }

  async getStockPriceDetails() {
    const price = await this.getStockPrice();
    
    return {
      price: price,
      currency: 'USD',
      timestamp: new Date().toISOString(),
    };
  }

  async captureStockInfo() {
    await this.goto();
    
    const pageTitle = await this.page.title();
    const stockDetails = await this.getStockPriceDetails();
    
    return {
      source: this.url,
      pageTitle: pageTitle,
      ...stockDetails,
    };
  }
}

module.exports = { MicrosoftInvestorPage };
```

**Key Features:**
- ✅ **Multiple selector strategies** for reliability
- ✅ **Fallback mechanisms** if primary selectors fail
- ✅ **Regex patterns** for flexible text matching
- ✅ **Error handling** with graceful degradation
- ✅ **Structured data** return format

---

## Test Scenarios

### Test File: microsoft-stock.spec.js

```javascript
const { test, expect } = require('@playwright/test');
const { MicrosoftInvestorPage } = require('./pages/microsoft-investor.page');

test.describe('Microsoft Investor Page Tests', () => {
  let investorPage;

  test.beforeEach(async ({ page }) => {
    investorPage = new MicrosoftInvestorPage(page);
  });

  // Test 1: Basic stock price extraction
  test('should visit Microsoft investor page and fetch current stock price', async ({ page }) => {
    await investorPage.goto();

    // Verify page loaded
    await expect(page).toHaveURL(/.*microsoft\.com.*investor.*/);
    
    // Get stock price
    const stockPrice = await investorPage.getStockPrice();
    
    // Validate stock price
    expect(stockPrice).toBeTruthy();
    expect(stockPrice).toMatch(/^\d+\.?\d*$/);
    
    const priceValue = parseFloat(stockPrice);
    expect(priceValue).toBeGreaterThan(0);
    expect(priceValue).toBeLessThan(1000);
    
    console.log(`✓ Microsoft Current Stock Price: $${stockPrice}`);
  });

  // Test 2: Detailed stock information
  test('should fetch detailed stock information', async ({ page }) => {
    const stockInfo = await investorPage.captureStockInfo();
    
    // Verify structure
    expect(stockInfo).toHaveProperty('price');
    expect(stockInfo).toHaveProperty('currency');
    expect(stockInfo).toHaveProperty('timestamp');
    expect(stockInfo).toHaveProperty('source');
    
    // Validate price
    const priceValue = parseFloat(stockInfo.price);
    expect(priceValue).toBeGreaterThan(0);
    
    console.log('Stock Information:');
    console.log(`  Price: $${stockInfo.price} ${stockInfo.currency}`);
    console.log(`  Source: ${stockInfo.source}`);
    console.log(`  Retrieved: ${stockInfo.timestamp}`);
  });

  // Test 3: Screenshot capture
  test('should take screenshot of stock price section', async ({ page }) => {
    await investorPage.goto();
    
    // Capture full page screenshot
    await page.screenshot({ 
      path: `test-results/microsoft-stock-${Date.now()}.png`,
      fullPage: true 
    });
    
    const stockPrice = await investorPage.getStockPrice();
    expect(stockPrice).toBeTruthy();
    
    console.log(`✓ Screenshot captured with stock price: $${stockPrice}`);
  });

  // Test 4: Page title validation
  test('should verify page title contains Microsoft', async ({ page }) => {
    await investorPage.goto();
    
    const title = await page.title();
    expect(title.toLowerCase()).toContain('microsoft');
    
    console.log(`✓ Page Title: ${title}`);
  });

  // Test 5: Stock price format validation
  test('should extract and validate stock price format', async ({ page }) => {
    await investorPage.goto();
    
    const stockPrice = await investorPage.getStockPrice();
    
    // Validate format: number with up to 2 decimal places
    const priceRegex = /^\d+(\.\d{1,2})?$/;
    expect(stockPrice).toMatch(priceRegex);
    
    // Validate reasonable range
    const price = parseFloat(stockPrice);
    expect(price).toBeGreaterThan(10);   // Microsoft stock > $10
    expect(price).toBeLessThan(1000);    // Reasonable upper bound
    
    console.log(`✓ Valid stock price format: $${stockPrice}`);
  });
});
```

### Test Scenarios Summary

| Test # | Scenario | Purpose | Validates |
|--------|----------|---------|-----------|
| 1 | Fetch current stock price | Basic extraction | URL, price format, value range |
| 2 | Fetch detailed information | Structured data | Object properties, data types |
| 3 | Screenshot capture | Visual evidence | Screenshot creation, price extraction |
| 4 | Page title validation | Page loading | Title contains "Microsoft" |
| 5 | Price format validation | Data quality | Regex format, numeric range |

---

## Local Execution

### Running All Tests

```bash
# Run all tests in headless mode
npm test

# Run all tests in UI mode (interactive)
npm run test:ui

# Run all tests with browser visible
npm run test:headed
```

### Running Specific Tests

```bash
# Run only Microsoft stock tests
npm run test:stock

# Run specific test by name
npx playwright test -g "should visit Microsoft investor page"

# Run in debug mode
npm run test:debug
```

### Running with Different Options

```bash
# Run with trace enabled
npx playwright test --trace on

# Run with screenshots
npx playwright test --screenshot on

# Run with video recording
npx playwright test --video on

# Run on specific browser
npx playwright test --project=chromium
```

---

## Test Results

### Sample Output

```
Running 5 tests using 1 worker

✓ microsoft-stock.spec.js:11:3 - should visit Microsoft investor page and fetch current stock price (2.5s)
✓ Microsoft Current Stock Price: $429.29

✓ microsoft-stock.spec.js:32:3 - should fetch detailed stock information (2.1s)
Stock Information:
  Price: $429.29 USD
  Source: https://www.microsoft.com/en-us/investor/default
  Retrieved: 2024-01-31T18:00:00.000Z

✓ microsoft-stock.spec.js:54:3 - should take screenshot of stock price section (2.3s)
✓ Screenshot captured with stock price: $429.29

✓ microsoft-stock.spec.js:69:3 - should verify page title contains Microsoft (1.8s)
✓ Page Title: Microsoft Investor Relations - Home Page

✓ microsoft-stock.spec.js:78:3 - should extract and validate stock price format (1.9s)
✓ Valid stock price format: $429.29

5 passed (10.6s)
```

### Performance Metrics

| Metric | Value |
|--------|-------|
| Total Tests | 5 |
| Passed | 5 (100%) |
| Failed | 0 (0%) |
| Total Duration | ~10.6s |
| Average per test | ~2.1s |
| Workers | 1 (local) |

### Extracted Data Example

```json
{
  "price": "429.29",
  "currency": "USD",
  "timestamp": "2024-01-31T18:00:00.000Z",
  "source": "https://www.microsoft.com/en-us/investor/default",
  "pageTitle": "Microsoft Investor Relations - Home Page"
}
```

---

## Key Takeaways

### Design Patterns Applied

✅ **Page Object Model** - Separates page logic from tests  
✅ **Multiple Selectors** - Robust element location  
✅ **Fallback Strategies** - Graceful error handling  
✅ **Data Validation** - Comprehensive assertions  
✅ **Console Logging** - Enhanced visibility  

### Best Practices Demonstrated

- **beforeEach hook** for test setup
- **Descriptive test names** for clarity
- **Multiple assertion types** for comprehensive validation
- **Screenshot capture** for visual evidence
- **Structured data** extraction
- **Error handling** with fallbacks

### Test Coverage

- ✅ URL navigation
- ✅ Page load verification
- ✅ Element location
- ✅ Data extraction
- ✅ Format validation
- ✅ Range validation
- ✅ Screenshot capture
- ✅ Title verification

---

## Next Steps

✅ **Completed:**
- Test implementation with 5 scenarios
- Page Object Model creation
- Local test execution
- Result validation

🎯 **Coming Next:**
- Authentication system setup
- Environment variable configuration
- Secure credential management
- Test fixtures

---

[← Previous: Project Setup](./01-project-setup.md) | [↑ Back to Home](./README.md) | [Next: Authentication System →](./03-authentication-system.md)
