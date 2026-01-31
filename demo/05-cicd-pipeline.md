[← Previous: Azure Integration](./04-azure-integration.md) | [↑ Back to Home](./README.md) | [Next: Results and Metrics →](./06-results-and-metrics.md)

---

# 5. CI/CD Pipeline

Comprehensive guide to GitHub Actions workflows for automated testing with both local and Azure cloud execution.

## Table of Contents

- [GitHub Actions Overview](#github-actions-overview)
- [Workflow Files](#workflow-files)
- [Local Testing Workflow](#local-testing-workflow)
- [Azure Cloud Testing Workflow](#azure-cloud-testing-workflow)
- [Service Principal Setup](#service-principal-setup)
- [Manual Workflow Dispatch](#manual-workflow-dispatch)
- [Best Practices](#best-practices)

---

## GitHub Actions Overview

### What is GitHub Actions?

**GitHub Actions** is a CI/CD platform that automates:
- ✅ **Build and test** - Run tests on every push/PR
- ✅ **Deployment** - Deploy to staging/production
- ✅ **Code quality** - Linting, formatting, security scans
- ✅ **Notifications** - Slack, email, status checks

### Why Use GitHub Actions for Testing?

| Benefit | Description |
|---------|-------------|
| **Automated testing** | Tests run automatically on code changes |
| **Pull request validation** | Block merges if tests fail |
| **Fast feedback** | Developers know immediately if code breaks |
| **Consistent environment** | Same setup for all team members |
| **Cloud resources** | GitHub-hosted runners (free for public repos) |
| **Integration** | Built into GitHub workflow |

### Our Workflow Strategy

This project implements **two complementary workflows**:

1. **e2e.yml** - Local testing (1 worker, GitHub runner)
2. **e2e-azure.yml** - Azure cloud testing (20 workers, Azure Playwright Workspaces)

---

## Workflow Files

### Location

```
.github/
└── workflows/
    ├── e2e.yml         # Local testing workflow
    └── e2e-azure.yml   # Azure cloud testing workflow
```

### Triggers

Both workflows trigger on:
- **Push** to `master` branch
- **Pull requests** to any branch
- **Manual dispatch** via GitHub UI

---

## Local Testing Workflow

### File: .github/workflows/e2e.yml

```yaml
name: Playwright E2E
on:
  pull_request:
  push:
    branches: [ master ]
  workflow_dispatch:

permissions:
  contents: read

jobs:
  test:
    runs-on: ubuntu-latest
    timeout-minutes: 60
    
    steps:
      - uses: actions/checkout@v4
      
      - uses: actions/setup-node@v4
        with: 
          node-version: '20'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Install Playwright browsers
        run: npx playwright install --with-deps
      
      - name: Run Playwright tests
        run: npx playwright test
        env:
          BASE_URL: https://www.microsoft.com/en-us/investor/default
          CI: true
      
      - name: Upload Playwright report
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: playwright-report
          path: playwright-report
```

### Workflow Breakdown

#### Step 1: Checkout Code
```yaml
- uses: actions/checkout@v4
```
- Downloads repository code to runner
- Uses latest checkout action (v4)

#### Step 2: Setup Node.js
```yaml
- uses: actions/setup-node@v4
  with: 
    node-version: '20'
```
- Installs Node.js version 20
- Required for running npm and Playwright

#### Step 3: Install Dependencies
```yaml
- name: Install dependencies
  run: npm ci
```
- `npm ci` (clean install) is faster and more reliable than `npm install`
- Uses exact versions from `package-lock.json`
- Ensures consistent dependencies

#### Step 4: Install Playwright Browsers
```yaml
- name: Install Playwright browsers
  run: npx playwright install --with-deps
```
- Downloads Chromium, Firefox, WebKit
- `--with-deps` installs system dependencies (fonts, libraries)

#### Step 5: Run Tests
```yaml
- name: Run Playwright tests
  run: npx playwright test
  env:
    BASE_URL: https://www.microsoft.com/en-us/investor/default
    CI: true
```
- Runs all tests in headless mode
- Sets environment variables
- `CI: true` enables CI-specific settings (retries, parallel workers)

#### Step 6: Upload Report
```yaml
- name: Upload Playwright report
  if: always()
  uses: actions/upload-artifact@v4
  with:
    name: playwright-report
    path: playwright-report
```
- `if: always()` uploads even if tests fail
- Creates downloadable artifact with HTML report
- Available in Actions run summary

### Configuration

| Setting | Value | Purpose |
|---------|-------|---------|
| `runs-on` | `ubuntu-latest` | GitHub-hosted Linux runner |
| `timeout-minutes` | `60` | Fail if workflow exceeds 1 hour |
| `permissions` | `contents: read` | Minimal required permissions |
| `workers` | `1` (via CI flag) | Single worker in CI environment |

---

## Azure Cloud Testing Workflow

### File: .github/workflows/e2e-azure.yml

```yaml
name: Playwright E2E (Azure Workspaces)
on:
  pull_request:
  push:
    branches: [ master ]
  workflow_dispatch:

permissions:
  contents: read
  id-token: write
  
jobs:
  test:
    runs-on: ubuntu-latest
    timeout-minutes: 60
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with: 
          node-version: '20'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Azure Login
        uses: azure/login@v1
        with:
          creds: ${{ secrets.AZURE_CREDENTIALS }}
      
      - name: Verify Azure login
        run: |
          echo "Logged in to Azure"
          az account show
      
      - name: Run Playwright tests in Azure Workspaces
        run: npx playwright test -c playwright.service.config.js --workers=20
        env:
          PLAYWRIGHT_SERVICE_URL: ${{ secrets.PLAYWRIGHT_SERVICE_URL }}
          BASE_URL: https://www.microsoft.com/en-us/investor/default
          CI: true
      
      - name: Upload Playwright report
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: playwright-report-azure
          path: playwright-report/
          retention-days: 30
      
      - name: Upload test results
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: test-results
          path: test-results/
          retention-days: 30
      
      - name: Azure Logout
        if: always()
        run: az logout
```

### Key Differences from Local Workflow

#### 1. Permissions
```yaml
permissions:
  contents: read
  id-token: write  # Required for Azure authentication
```

#### 2. Node.js Caching
```yaml
- name: Setup Node.js
  uses: actions/setup-node@v4
  with:
    cache: 'npm'  # Cache node_modules
```
- Speeds up workflow by caching dependencies

#### 3. Azure Authentication
```yaml
- name: Azure Login
  uses: azure/login@v1
  with:
    creds: ${{ secrets.AZURE_CREDENTIALS }}
```
- Authenticates with Azure using service principal
- Credentials stored in GitHub Secrets

#### 4. Azure-Specific Test Command
```yaml
- name: Run Playwright tests in Azure Workspaces
  run: npx playwright test -c playwright.service.config.js --workers=20
  env:
    PLAYWRIGHT_SERVICE_URL: ${{ secrets.PLAYWRIGHT_SERVICE_URL }}
```
- Uses Azure configuration file
- Runs with 20 parallel workers
- Requires workspace URL from secrets

#### 5. Multiple Artifacts
```yaml
- name: Upload Playwright report
  with:
    name: playwright-report-azure
    retention-days: 30

- name: Upload test results
  with:
    name: test-results
    retention-days: 30
```
- Separate artifacts for reports and results
- 30-day retention (configurable)

#### 6. Cleanup
```yaml
- name: Azure Logout
  if: always()
  run: az logout
```
- Always logout, even if tests fail
- Security best practice

---

## Service Principal Setup

### What is a Service Principal?

A **service principal** is an Azure identity for applications/automation that:
- Authenticates without human intervention
- Has specific permissions (least privilege)
- Can be rotated/revoked independently

### Step 1: Create Service Principal

```bash
# Login to Azure CLI
az login

# Create service principal for GitHub Actions
az ad sp create-for-rbac \
  --name "github-actions-playwright" \
  --role contributor \
  --scopes /subscriptions/{subscription-id}/resourceGroups/{resource-group} \
  --sdk-auth
```

**Output (save this):**
```json
{
  "clientId": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
  "clientSecret": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
  "subscriptionId": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
  "tenantId": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
  "activeDirectoryEndpointUrl": "https://login.microsoftonline.com",
  "resourceManagerEndpointUrl": "https://management.azure.com/",
  "activeDirectoryGraphResourceId": "https://graph.windows.net/",
  "sqlManagementEndpointUrl": "https://management.core.windows.net:8443/",
  "galleryEndpointUrl": "https://gallery.azure.com/",
  "managementEndpointUrl": "https://management.core.windows.net/"
}
```

### Step 2: Configure GitHub Secrets

1. Go to your GitHub repository
2. Navigate to **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**

#### Secret 1: AZURE_CREDENTIALS
- **Name:** `AZURE_CREDENTIALS`
- **Value:** Paste the entire JSON output from Step 1

#### Secret 2: PLAYWRIGHT_SERVICE_URL
- **Name:** `PLAYWRIGHT_SERVICE_URL`
- **Value:** Your Azure Playwright Workspaces URL
  ```
  https://eastus.api.playwright.microsoft.com/playwrightworkspaces/your-workspace-id
  ```

#### Optional Secrets

Add these if your tests require authentication:

| Secret Name | Description | Example |
|-------------|-------------|---------|
| `TEST_USERNAME` | Test user email | `test@example.com` |
| `TEST_PASSWORD` | Test user password | `SecurePass123!` |
| `API_KEY` | API authentication key | `sk_test_xxxxxxxxxxxx` |

### Step 3: Verify Secrets

```yaml
# Add verification step to workflow
- name: Verify secrets are configured
  run: |
    if [ -z "${{ secrets.AZURE_CREDENTIALS }}" ]; then
      echo "❌ AZURE_CREDENTIALS not set"
      exit 1
    fi
    if [ -z "${{ secrets.PLAYWRIGHT_SERVICE_URL }}" ]; then
      echo "❌ PLAYWRIGHT_SERVICE_URL not set"
      exit 1
    fi
    echo "✅ All required secrets are configured"
```

---

## Manual Workflow Dispatch

### Triggering Workflows Manually

Both workflows support manual triggering via GitHub UI.

#### Step 1: Navigate to Actions Tab
1. Go to your repository
2. Click **Actions** tab
3. Select workflow (e.g., "Playwright E2E (Azure Workspaces)")

#### Step 2: Run Workflow
1. Click **Run workflow** button
2. Select branch (default: master)
3. Click **Run workflow**

#### Step 3: Monitor Progress
- View real-time logs
- Download artifacts when complete
- Check test results

### Workflow Dispatch with Inputs

Enhance workflows with custom inputs:

```yaml
on:
  workflow_dispatch:
    inputs:
      browser:
        description: 'Browser to test'
        required: true
        default: 'chromium'
        type: choice
        options:
          - chromium
          - firefox
          - webkit
      workers:
        description: 'Number of parallel workers'
        required: false
        default: '20'

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - name: Run tests
        run: |
          npx playwright test \
            -c playwright.service.config.js \
            --project=${{ inputs.browser }} \
            --workers=${{ inputs.workers }}
```

---

## Best Practices

### ✅ DO

1. **Use `npm ci` in CI/CD** - Faster and more reliable
   ```yaml
   run: npm ci
   ```

2. **Set timeout limits** - Prevent stuck workflows
   ```yaml
   timeout-minutes: 60
   ```

3. **Always upload artifacts** - Even on failure
   ```yaml
   if: always()
   ```

4. **Use caching** - Speed up workflows
   ```yaml
   with:
     cache: 'npm'
   ```

5. **Secure secrets** - Never log or expose
   ```yaml
   env:
     PASSWORD: ${{ secrets.PASSWORD }}
   ```

6. **Clean up resources** - Logout, cleanup
   ```yaml
   if: always()
   run: az logout
   ```

7. **Use specific versions** - Pin action versions
   ```yaml
   uses: actions/checkout@v4  # Not @latest
   ```

### ❌ DON'T

1. **Don't use `npm install`** - Use `npm ci` instead
2. **Don't hardcode secrets** - Use GitHub Secrets
3. **Don't skip error handling** - Use `if: always()`
4. **Don't run unnecessary steps** - Optimize for speed
5. **Don't forget to logout** - Clean up sessions

---

## Workflow Comparison

| Feature | Local Workflow | Azure Workflow |
|---------|----------------|----------------|
| **Workers** | 1 | 20 |
| **Duration** | ~10.6s | ~2.3s |
| **Browser Install** | Required | Not required |
| **Azure Auth** | No | Yes |
| **Artifacts** | HTML report | Report + results |
| **Cost** | Free (GitHub) | Azure usage |
| **Use Case** | Quick validation | Full suite |

### When to Use Each

**Local Workflow (e2e.yml):**
- ✅ Pull request validation
- ✅ Quick smoke tests
- ✅ Development branches
- ✅ Cost-sensitive scenarios

**Azure Workflow (e2e-azure.yml):**
- ✅ Master branch pushes
- ✅ Release candidates
- ✅ Full regression testing
- ✅ Performance-critical scenarios

---

## Monitoring and Debugging

### View Workflow Runs

1. Go to **Actions** tab
2. Click on workflow run
3. View job logs
4. Download artifacts

### Debug Failed Runs

```yaml
# Enable debug logging
- name: Run tests with debug
  run: npx playwright test --debug
  env:
    DEBUG: pw:api
```

### Check Status Badge

Add to README.md:

```markdown
![Playwright E2E](https://github.com/dhavalshah01/auto-browser-testing/actions/workflows/e2e.yml/badge.svg)

![Azure E2E](https://github.com/dhavalshah01/auto-browser-testing/actions/workflows/e2e-azure.yml/badge.svg)
```

---

## Next Steps

✅ **Completed:**
- GitHub Actions workflows created
- Local testing pipeline
- Azure cloud testing pipeline
- Service principal configuration
- Manual workflow dispatch

🎯 **Coming Next:**
- View test execution results
- Analyze performance metrics
- Review HTML reports
- Examine artifacts

---

[← Previous: Azure Integration](./04-azure-integration.md) | [↑ Back to Home](./README.md) | [Next: Results and Metrics →](./06-results-and-metrics.md)
