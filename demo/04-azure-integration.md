[← Previous: Authentication System](./03-authentication-system.md) | [↑ Back to Home](./README.md) | [Next: CI/CD Pipeline →](./05-cicd-pipeline.md)

---

# 4. Azure Integration

Complete guide to integrating Azure Playwright Workspaces for cloud-based, scalable parallel testing.

## Table of Contents

- [Azure Playwright Workspaces Overview](#azure-playwright-workspaces-overview)
- [Setup and Configuration](#setup-and-configuration)
- [Service Configuration](#service-configuration)
- [Cloud-Based Parallel Testing](#cloud-based-parallel-testing)
- [Performance Comparison](#performance-comparison)
- [Cost and Benefits](#cost-and-benefits)

---

## Azure Playwright Workspaces Overview

### What is Azure Playwright Workspaces?

**Azure Playwright Workspaces** is a cloud-based testing service that provides:

- ☁️ **Cloud browser infrastructure** - No local browser installation needed
- ⚡ **Massive parallelization** - Run tests on 20+ workers simultaneously
- 🌍 **Global availability** - Test from multiple regions
- 📊 **Centralized reporting** - View all test results in Azure Portal
- 🔐 **Enterprise security** - Azure-managed authentication and compliance
- 💰 **Pay-per-use** - Only pay for test execution time

### Why Use Azure Playwright Workspaces?

| Local Testing | Azure Cloud Testing |
|---------------|---------------------|
| 1 worker (limited CPU) | 20+ workers (scalable) |
| ~10.6s for 5 tests | ~2-3s for same tests |
| Local machine resources | Cloud infrastructure |
| Manual browser setup | Browsers pre-configured |
| Single location | Multi-region testing |

### Use Cases

✅ **Large test suites** - Hundreds of tests running in minutes  
✅ **Cross-browser testing** - Multiple browsers in parallel  
✅ **CI/CD pipelines** - Fast feedback on pull requests  
✅ **Performance testing** - Simulate multiple concurrent users  
✅ **Geographic testing** - Test from different regions  

---

## Setup and Configuration

### Prerequisites

1. **Azure Subscription** - Active Azure account
2. **Azure CLI** - Installed and authenticated
3. **Azure Playwright Workspaces** - Created in Azure Portal
4. **Service Principal** - For GitHub Actions authentication

### Step 1: Create Azure Playwright Workspaces

#### Using Azure Portal

1. Go to [Azure Portal](https://portal.azure.com)
2. Search for "Playwright Testing"
3. Click **+ Create**
4. Fill in details:
   - **Subscription**: Your subscription
   - **Resource Group**: Create new or select existing
   - **Name**: `playwright-workspace-demo`
   - **Region**: Choose closest region (e.g., East US)
   - **Pricing Tier**: Select based on needs
5. Click **Review + Create**
6. Click **Create**

#### Using Azure CLI

```bash
# Login to Azure
az login

# Set subscription
az account set --subscription "Your Subscription Name"

# Create resource group
az group create \
  --name playwright-testing-rg \
  --location eastus

# Create Playwright Workspaces
az playwright create \
  --name playwright-workspace-demo \
  --resource-group playwright-testing-rg \
  --location eastus
```

### Step 2: Get Service URL

After creation, retrieve your workspace URL:

#### From Azure Portal
1. Navigate to your Playwright Testing resource
2. Go to **Overview** section
3. Copy the **Browser endpoint** URL

#### Using Azure CLI
```bash
az playwright show \
  --name playwright-workspace-demo \
  --resource-group playwright-testing-rg \
  --query "properties.endpoint" \
  --output tsv
```

**Example URL:**
```
https://eastus.api.playwright.microsoft.com/playwrightworkspaces/0dd101bc-9839-43e5-b930-dd448be662be
```

### Step 3: Install Dependencies

```bash
# Install Azure Playwright packages
npm install -D @azure/playwright @azure/identity

# Verify installation
npm list @azure/playwright
```

---

## Service Configuration

### playwright.service.config.js

Create configuration file for Azure Playwright Workspaces:

```javascript
const { defineConfig } = require('@playwright/test');
const { createAzurePlaywrightConfig, ServiceOS } = require('@azure/playwright');
const { DefaultAzureCredential } = require('@azure/identity');
const config = require('./playwright.config');

/**
 * Azure Playwright Workspaces Configuration
 * 
 * This configuration extends the base Playwright config with Azure-specific settings
 * enabling cloud-based test execution with massive parallelization.
 */
export default defineConfig(
  config,
  createAzurePlaywrightConfig(config, {
    // Network Configuration
    exposeNetwork: '<loopback>',
    
    // Timeout Configuration
    connectTimeout: 3 * 60 * 1000, // 3 minutes (180,000ms)
    
    // Operating System
    os: ServiceOS.LINUX,
    
    // Authentication
    credential: new DefaultAzureCredential(),
  }),
  {
    /*
    Optional: Enable Playwright Workspaces Reporter
    
    Uncomment to upload test results and reports to Azure Portal.
    Note: HTML reporter must be included before Azure reporter.
    */
    // reporter: [
    //   ["html", { open: "never" }],
    //   ["@azure/playwright/reporter"],
    // ],
  }
);
```

### Configuration Options Explained

| Option | Value | Purpose |
|--------|-------|---------|
| `exposeNetwork` | `<loopback>` | Allows tests to access localhost services |
| `connectTimeout` | `180000` | 3-minute timeout for cloud connection |
| `os` | `ServiceOS.LINUX` | Run tests on Linux VMs |
| `credential` | `DefaultAzureCredential()` | Auto-authenticate with Azure |

### Authentication Setup

The `DefaultAzureCredential()` tries authentication in this order:

1. **Environment variables** - `AZURE_CLIENT_ID`, `AZURE_TENANT_ID`, `AZURE_CLIENT_SECRET`
2. **Managed Identity** - For Azure VMs and services
3. **Azure CLI** - If `az login` is active
4. **Visual Studio Code** - If signed into Azure extension
5. **Azure PowerShell** - If signed in

For **local development**:
```bash
# Authenticate using Azure CLI
az login

# Verify authentication
az account show
```

For **GitHub Actions** (covered in next section):
```yaml
- name: Azure Login
  uses: azure/login@v1
  with:
    creds: ${{ secrets.AZURE_CREDENTIALS }}
```

---

## Cloud-Based Parallel Testing

### Running Tests in Azure

#### Command

```bash
# Run tests with Azure configuration
npx playwright test -c playwright.service.config.js

# Run with 20 parallel workers
npx playwright test -c playwright.service.config.js --workers=20

# Run specific test suite
npx playwright test microsoft-stock.spec.js -c playwright.service.config.js --workers=20
```

#### Environment Variables

Set the workspace URL:

```bash
# In .env file
PLAYWRIGHT_SERVICE_URL=https://eastus.api.playwright.microsoft.com/playwrightworkspaces/your-workspace-id

# Or export directly
export PLAYWRIGHT_SERVICE_URL="https://eastus.api.playwright.microsoft.com/playwrightworkspaces/your-workspace-id"
```

### Worker Configuration

| Workers | Use Case | Expected Performance |
|---------|----------|---------------------|
| 1 | Single test, debugging | Similar to local |
| 5 | Small suites | 5x faster |
| 10 | Medium suites | 10x faster |
| 20 | Large suites (recommended) | 20x faster |
| 50+ | Massive suites | Contact Azure support |

### Example: 20-Worker Execution

```bash
npx playwright test -c playwright.service.config.js --workers=20
```

**Output:**
```
Running 5 tests using 20 workers (5 concurrent)

✓ [chromium] › microsoft-stock.spec.js:11 - fetch current stock price (1.2s)
✓ [chromium] › microsoft-stock.spec.js:32 - fetch detailed information (1.1s)
✓ [chromium] › microsoft-stock.spec.js:54 - take screenshot (1.3s)
✓ [chromium] › microsoft-stock.spec.js:69 - verify page title (0.9s)
✓ [chromium] › microsoft-stock.spec.js:78 - validate stock price format (1.0s)

5 passed (2.3s)
```

---

## Performance Comparison

### Test Suite: 5 Microsoft Stock Tests

#### Local Execution (1 Worker)

```bash
npm test
```

| Metric | Value |
|--------|-------|
| Workers | 1 |
| Total Duration | ~10.6s |
| Average per Test | ~2.1s |
| Infrastructure | Local machine |
| Browser Install | Required |

**Output:**
```
5 passed (10.6s)
```

#### Azure Cloud Execution (20 Workers)

```bash
npx playwright test -c playwright.service.config.js --workers=20
```

| Metric | Value |
|--------|-------|
| Workers | 20 |
| Total Duration | ~2.3s |
| Average per Test | ~1.1s |
| Infrastructure | Azure cloud |
| Browser Install | Not required |

**Output:**
```
5 passed (2.3s)
```

### Performance Improvement

| Metric | Local | Azure | Improvement |
|--------|-------|-------|-------------|
| Duration | 10.6s | 2.3s | **78% faster** |
| Workers | 1 | 20 | **20x parallelization** |
| Per Test | 2.1s | 1.1s | **48% faster** |

### Scaling Impact

**100 Tests Projection:**

| Workers | Estimated Duration |
|---------|-------------------|
| 1 (local) | ~210 seconds (3.5 min) |
| 5 (cloud) | ~42 seconds |
| 10 (cloud) | ~21 seconds |
| 20 (cloud) | ~11 seconds |

**Formula:** `Total Duration ≈ (Tests × Avg Time) / Workers`

---

## Cost and Benefits

### Azure Pricing

Azure Playwright Workspaces uses **pay-per-use** pricing:

- **Test execution** - Per minute of browser runtime
- **No idle costs** - Only charged during active testing
- **Free tier** - Limited free minutes per month
- **Enterprise tier** - Volume discounts available

**Example Calculation:**
```
5 tests × 1.1s per test = 5.5s total
5.5s / 60s = 0.092 minutes
0.092 minutes × $X per minute = Cost per run
```

### Cost vs. Benefit Analysis

#### Benefits

✅ **Time savings** - 78% faster execution  
✅ **Developer productivity** - Faster feedback loops  
✅ **CI/CD efficiency** - Rapid pull request validation  
✅ **Infrastructure** - No local setup or maintenance  
✅ **Scalability** - Handle massive test suites  
✅ **Multi-region** - Test from different locations  

#### Considerations

⚠️ **Usage costs** - Per-minute charges  
⚠️ **Network dependency** - Requires internet connection  
⚠️ **Learning curve** - Azure portal and configuration  

### When to Use Azure vs. Local

**Use Azure for:**
- CI/CD pipelines
- Large test suites (100+ tests)
- Cross-region testing
- Team collaboration
- Production validation

**Use Local for:**
- Test development
- Debugging
- Single test runs
- Offline work
- Cost-sensitive scenarios

---

## Troubleshooting

### Common Issues

#### 1. Authentication Failed

```
Error: DefaultAzureCredential authentication failed
```

**Solution:**
```bash
# Re-authenticate
az login
az account show
```

#### 2. Service URL Not Found

```
Error: PLAYWRIGHT_SERVICE_URL is not set
```

**Solution:**
```bash
# Add to .env
echo "PLAYWRIGHT_SERVICE_URL=https://your-workspace-url" >> .env
```

#### 3. Connection Timeout

```
Error: Could not connect to Azure Playwright service
```

**Solution:**
- Check internet connection
- Verify workspace URL is correct
- Increase `connectTimeout` in config
- Check Azure service status

#### 4. Worker Limit Exceeded

```
Error: Requested 50 workers but limit is 20
```

**Solution:**
- Reduce workers to 20 or less
- Contact Azure support for higher limits

---

## Best Practices

### ✅ DO

1. **Use Azure for CI/CD** - Maximum speed and reliability
2. **Set appropriate workers** - 20 for large suites, 5-10 for smaller
3. **Monitor costs** - Track usage in Azure Portal
4. **Cache dependencies** - Speed up CI/CD setup
5. **Use regions strategically** - Choose closest to users
6. **Enable reporters** - Upload results to Azure Portal

### ❌ DON'T

1. **Don't over-provision workers** - More isn't always better
2. **Don't share credentials** - Use service principals
3. **Don't hardcode URLs** - Use environment variables
4. **Don't skip local testing** - Validate before cloud runs

---

## Next Steps

✅ **Completed:**
- Azure Playwright Workspaces setup
- Service configuration
- Cloud-based parallel testing
- Performance benchmarking

🎯 **Coming Next:**
- GitHub Actions workflows
- CI/CD pipeline configuration
- Automated testing on push/PR
- Service principal setup

---

[← Previous: Authentication System](./03-authentication-system.md) | [↑ Back to Home](./README.md) | [Next: CI/CD Pipeline →](./05-cicd-pipeline.md)
