const { test, expect } = require('@playwright/test');
const { MicrosoftInvestorPage } = require('./pages/microsoft-investor.page');

test.describe('Microsoft Investor Page Tests', () => {
  let investorPage;

  test.beforeEach(async ({ page }) => {
    investorPage = new MicrosoftInvestorPage(page);
  });

  test('should visit Microsoft investor page and fetch current stock price', async ({ page }) => {
    // Navigate to Microsoft investor page
    await investorPage.goto();

    // Verify page loaded
    await expect(page).toHaveURL(/.*microsoft\.com.*investor.*/);
    
    // Get stock price
    const stockPrice = await investorPage.getStockPrice();
    
    // Verify stock price is valid
    expect(stockPrice).toBeTruthy();
    expect(stockPrice).toMatch(/^\d+\.?\d*$/);
    
    const priceValue = parseFloat(stockPrice);
    expect(priceValue).toBeGreaterThan(0);
    expect(priceValue).toBeLessThan(1000); // Sanity check
    
    console.log(`✓ Microsoft Current Stock Price: $${stockPrice}`);
  });

  test('should fetch detailed stock information', async ({ page }) => {
    const stockInfo = await investorPage.captureStockInfo();
    
    // Verify stock info structure
    expect(stockInfo).toHaveProperty('price');
    expect(stockInfo).toHaveProperty('currency');
    expect(stockInfo).toHaveProperty('timestamp');
    expect(stockInfo).toHaveProperty('source');
    
    // Verify price is valid
    const priceValue = parseFloat(stockInfo.price);
    expect(priceValue).toBeGreaterThan(0);
    
    console.log('Stock Information:');
    console.log(`  Price: $${stockInfo.price} ${stockInfo.currency}`);
    console.log(`  Source: ${stockInfo.source}`);
    console.log(`  Retrieved: ${stockInfo.timestamp}`);
    if (stockInfo.change) {
      console.log(`  Change: ${stockInfo.change}`);
    }
  });

  test('should take screenshot of stock price section', async ({ page }) => {
    await investorPage.goto();
    
    // Take screenshot of the page
    await page.screenshot({ 
      path: `test-results/microsoft-stock-${Date.now()}.png`,
      fullPage: true 
    });
    
    const stockPrice = await investorPage.getStockPrice();
    expect(stockPrice).toBeTruthy();
    
    console.log(`✓ Screenshot captured with stock price: $${stockPrice}`);
  });

  test('should verify page title contains Microsoft', async ({ page }) => {
    await investorPage.goto();
    
    const title = await page.title();
    expect(title.toLowerCase()).toContain('microsoft');
    
    console.log(`✓ Page Title: ${title}`);
  });

  test('should extract and validate stock price format', async ({ page }) => {
    await investorPage.goto();
    
    const stockPrice = await investorPage.getStockPrice();
    
    // Validate format: should be a number with up to 2 decimal places
    const priceRegex = /^\d+(\.\d{1,2})?$/;
    expect(stockPrice).toMatch(priceRegex);
    
    // Convert to number and validate range
    const price = parseFloat(stockPrice);
    expect(price).toBeGreaterThan(10);  // Microsoft stock should be > $10
    expect(price).toBeLessThan(1000);   // Reasonable upper bound
    
    console.log(`✓ Valid stock price format: $${stockPrice}`);
  });
});
