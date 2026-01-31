class MicrosoftInvestorPage {
  constructor(page) {
    this.page = page;
    this.url = 'https://www.microsoft.com/en-us/investor/default';
    
    // Selectors for stock price elements
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
        // Continue to next selector
        continue;
      }
    }

    // If no specific element found, search in page content
    const content = await this.page.content();
    const pricePattern = /stock price.*?\$?(\d+\.\d{2})/i;
    const match = content.match(pricePattern);
    
    if (match) {
      return match[1];
    }

    // Alternative: look for any price-like pattern near "MSFT" or "Microsoft"
    const allText = await this.page.locator('body').textContent();
    const msftPricePattern = /(?:MSFT|Microsoft).*?\$?(\d{2,3}\.\d{2})/i;
    const msftMatch = allText.match(msftPricePattern);
    
    if (msftMatch) {
      return msftMatch[1];
    }

    throw new Error('Stock price not found on the page');
  }

  async getStockPriceDetails() {
    const price = await this.getStockPrice();
    
    // Try to get additional details
    const details = {
      price: price,
      currency: 'USD',
      timestamp: new Date().toISOString(),
    };

    // Try to get change/percentage if available
    try {
      const changeElement = this.page.locator('text=/[+-]\\d+\\.\\d+/').first();
      if (await changeElement.isVisible({ timeout: 1000 })) {
        details.change = await changeElement.textContent();
      }
    } catch (error) {
      // Change not found
    }

    return details;
  }

  async captureStockInfo() {
    await this.goto();
    
    // Get page title for context
    const pageTitle = await this.page.title();
    
    // Get stock price
    const stockDetails = await this.getStockPriceDetails();
    
    return {
      source: this.url,
      pageTitle: pageTitle,
      ...stockDetails,
    };
  }
}

module.exports = { MicrosoftInvestorPage };
