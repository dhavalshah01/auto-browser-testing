# Configure GitHub Actions for Azure Playwright Workspaces

Complete guide for setting up GitHub Actions to run Playwright tests in Azure Playwright Workspaces.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Step-by-Step Setup](#step-by-step-setup)
- [GitHub Secrets Configuration](#github-secrets-configuration)
- [Workflow File](#workflow-file)
- [Testing the Setup](#testing-the-setup)
- [Troubleshooting](#troubleshooting)
- [Best Practices](#best-practices)

---

## Prerequisites

Before starting, ensure you have:

- **Azure subscription** with access to create resources
- **Azure Playwright Workspaces** resource created
- **GitHub repository** with Playwright tests
- **Azure CLI** installed locally
- **Git** configured and authenticated
- **Repository admin access** to configure secrets

---

## Step-by-Step Setup

### Step 1: Gather Azure Resource Information

#### 1.1 Get Your Playwright Workspace URL

1. Login to [Azure Portal](https://portal.azure.com)
2. Navigate to your **Playwright Testing** resource
3. Go to **Overview** page
4. Copy the **Browser endpoint** URL

**Format:** `https://eastus.api.playwright.microsoft.com/playwrightworkspaces/{workspace-id}`

**Example:** `https://eastus.api.playwright.microsoft.com/playwrightworkspaces/0dd101bc-9839-43e5-b930-dd448be662be`

#### 1.2 Get Your Subscription ID

```bash
# List all subscriptions
az account list --output table

# Get current subscription ID
az account show --query id -o tsv
```

#### 1.3 Identify Your Resource Group

```bash
# List all resource groups
az group list --output table

# Or get resource group of your Playwright resource
az resource list --resource-type "Microsoft.AzurePlaywrightService/accounts" --query "[0].resourceGroup" -o tsv
```

---

### Step 2: Create Azure Service Principal

Service Principal allows GitHub Actions to authenticate with Azure.

#### 2.1 Login to Azure CLI

```bash
az login
```

#### 2.2 Select Correct Subscription

```bash
# List subscriptions
az account list --output table

# Set specific subscription
az account set --subscription "YOUR-SUBSCRIPTION-ID"
```

#### 2.3 Create Service Principal

```bash
az ad sp create-for-rbac \
  --name "github-actions-playwright" \
  --role contributor \
  --scopes /subscriptions/YOUR-SUBSCRIPTION-ID/resourceGroups/YOUR-RESOURCE-GROUP \
  --sdk-auth
```

**Replace:**
- `YOUR-SUBSCRIPTION-ID` with your actual subscription ID
- `YOUR-RESOURCE-GROUP` with your Playwright resource group name

**Expected Output:**
```json
{
  "clientId": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
  "clientSecret": "xxxxx~xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
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

**⚠️ IMPORTANT:** 
- Save this entire JSON output securely
- Never commit these credentials to git
- You'll need this for GitHub Secrets setup

#### 2.4 Grant Playwright Testing Permissions

**Option A: Using Azure CLI**

```bash
# Get service principal object ID
SP_ID=$(az ad sp show --id "YOUR-CLIENT-ID" --query id -o tsv)

# Assign Playwright Testing Contributor role
az role assignment create \
  --role "Playwright Testing Contributor" \
  --assignee $SP_ID \
  --scope /subscriptions/YOUR-SUBSCRIPTION-ID/resourceGroups/YOUR-RESOURCE-GROUP
```

**Option B: Using Azure Portal**

1. Go to your **Playwright Testing** resource
2. Click **Access control (IAM)**
3. Click **+ Add** → **Add role assignment**
4. Search and select **"Playwright Testing Contributor"**
5. Click **Next**
6. Select **User, group, or service principal**
7. Click **+ Select members**
8. Search for **"github-actions-playwright"**
9. Select it and click **Select**
10. Click **Review + assign**

---

## GitHub Secrets Configuration

### Step 3: Add Secrets to GitHub Repository

1. Go to your GitHub repository
2. Click **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**

#### Secret 1: AZURE_CREDENTIALS

1. Click **New repository secret**
2. **Name:** `AZURE_CREDENTIALS`
3. **Value:** Paste the entire JSON output from Step 2.3 (service principal creation)
4. Click **Add secret**

**Example Value:**
```json
{
  "clientId": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
  "clientSecret": "xxxxx~xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
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

**⚠️ Important:** Replace the `xxxxxxxx` values with your actual service principal credentials from Step 2.3.

#### Secret 2: PLAYWRIGHT_SERVICE_URL

1. Click **New repository secret**
2. **Name:** `PLAYWRIGHT_SERVICE_URL`
3. **Value:** Your Playwright workspace URL from Step 1.1
4. Click **Add secret**

**Example:** `https://eastus.api.playwright.microsoft.com/playwrightworkspaces/0dd101bc-9839-43e5-b930-dd448be662be`

#### Secret 3: AZURE_SUBSCRIPTION_ID (Optional)

1. Click **New repository secret**
2. **Name:** `AZURE_SUBSCRIPTION_ID`
3. **Value:** Your subscription ID
4. Click **Add secret**

---

## Workflow File

### Step 4: Create GitHub Actions Workflow

Create `.github/workflows/e2e-azure.yml`:

```yaml
name: Playwright E2E (Azure Workspaces)
on:
  pull_request:
  push:
    branches: [ master ]  # Change to 'main' if that's your default branch
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

### Step 5: Commit and Push Workflow

```bash
# Add the workflow file
git add .github/workflows/e2e-azure.yml

# Commit
git commit -m "ci: Add Azure Playwright Workspaces workflow"

# Push to repository
git push origin master
```

---

## Testing the Setup

### Step 6: Verify Workflow Execution

#### Option A: Manual Trigger

1. Go to your GitHub repository
2. Click **Actions** tab
3. Select **"Playwright E2E (Azure Workspaces)"** workflow
4. Click **Run workflow** dropdown
5. Select branch and click **Run workflow**

#### Option B: Push Trigger

```bash
# Make a small change
echo "# Test" >> README.md

# Commit and push
git add README.md
git commit -m "test: Trigger workflow"
git push origin master
```

### Step 7: Monitor Execution

1. Go to **Actions** tab in your repository
2. Click on the running workflow
3. Watch the logs in real-time
4. Look for "Running tests using Playwright workspaces"
5. Verify tests complete successfully

### Step 8: Download Test Results

1. After workflow completes, scroll to bottom of workflow page
2. Find **Artifacts** section
3. Download:
   - `playwright-report-azure` - HTML test report
   - `test-results` - Raw test results

---

## Troubleshooting

### Issue 1: InvalidResourceNamespace Error

**Error:**
```
The resource namespace 'Microsoft.Playwright' is invalid
```

**Solution:**
Use resource group scope instead of resource-specific scope:
```bash
az ad sp create-for-rbac \
  --name "github-actions-playwright" \
  --role contributor \
  --scopes /subscriptions/YOUR-SUBSCRIPTION-ID/resourceGroups/YOUR-RESOURCE-GROUP \
  --sdk-auth
```

---

### Issue 2: Azure Login Failed in Workflow

**Error:**
```
Error: Login failed with Error: ClientAuthError
```

**Solutions:**

**A. Verify Secret Format**
- Ensure `AZURE_CREDENTIALS` is valid JSON
- No extra spaces or line breaks
- All fields present from service principal creation

**B. Check Service Principal Status**
```bash
# Verify service principal exists
az ad sp list --display-name "github-actions-playwright" --output table

# Check if credentials are active
az ad sp show --id YOUR-CLIENT-ID
```

**C. Recreate Service Principal**
```bash
# Delete existing
az ad sp delete --id YOUR-CLIENT-ID

# Create new one
az ad sp create-for-rbac --name "github-actions-playwright-new" --role contributor --scopes /subscriptions/YOUR-SUBSCRIPTION-ID/resourceGroups/YOUR-RESOURCE-GROUP --sdk-auth
```

---

### Issue 3: PLAYWRIGHT_SERVICE_URL Not Found

**Error:**
```
The value for the PLAYWRIGHT_SERVICE_URL variable is not set correctly
```

**Solutions:**

**A. Verify Secret Exists**
1. GitHub → Settings → Secrets → Actions
2. Check `PLAYWRIGHT_SERVICE_URL` is listed

**B. Verify URL Format**
- Use HTTPS format (not WSS)
- No `/browsers` at the end
- Correct format: `https://eastus.api.playwright.microsoft.com/playwrightworkspaces/WORKSPACE-ID`

**C. Update Secret**
1. Go to GitHub → Settings → Secrets → Actions
2. Click `PLAYWRIGHT_SERVICE_URL`
3. Click **Update secret**
4. Paste correct URL
5. Save

---

### Issue 4: 403 Forbidden - CheckAccess API Error

**Error:**
```
CheckAccess API call with non successful response. StatusCode: Forbidden
```

**Solutions:**

**A. Verify Role Assignment**
```bash
# List role assignments for service principal
az role assignment list --assignee YOUR-CLIENT-ID --output table

# Should include "Playwright Testing Contributor"
```

**B. Add Role via Azure Portal**
1. Go to Playwright Testing resource
2. Access control (IAM)
3. Add role assignment → "Playwright Testing Contributor"
4. Assign to service principal

**C. Check Subscription Access**
```bash
# Verify service principal has subscription access
az role assignment list --assignee YOUR-CLIENT-ID --scope /subscriptions/YOUR-SUBSCRIPTION-ID
```

---

### Issue 5: npm ci Failed

**Error:**
```
npm ERR! cipm can only install packages when your package.json and package-lock.json are in sync
```

**Solution:**
```bash
# Update lock file locally
npm install

# Commit changes
git add package-lock.json
git commit -m "fix: Update package-lock.json"
git push
```

---

### Issue 6: Playwright Browsers Not Installed

**Error:**
```
browserType.launch: Executable doesn't exist
```

**Solution:**
The Azure Playwright Workspaces provides browsers in the cloud. Ensure:
1. Using `playwright.service.config.js` configuration
2. `PLAYWRIGHT_SERVICE_URL` is set correctly
3. Service is properly authenticated

---

### Issue 7: Test Timeout in Azure Workspaces

**Error:**
```
Test timeout of 30000ms exceeded
```

**Solutions:**

**A. Increase Workflow Timeout**
```yaml
jobs:
  test:
    timeout-minutes: 90  # Increase from 60
```

**B. Increase Playwright Timeout**
In `playwright.config.js`:
```javascript
module.exports = defineConfig({
  timeout: 60000,  // 60 seconds per test
  use: {
    actionTimeout: 15000,
    navigationTimeout: 45000,
  },
});
```

---

### Issue 8: Workflow Not Triggering

**Problem:** Workflow doesn't run on push.

**Solutions:**

**A. Check Branch Name**
Ensure workflow branch matches your repository:
```yaml
on:
  push:
    branches: [ master ]  # or 'main'
```

**B. Verify Workflow File Location**
Must be in: `.github/workflows/e2e-azure.yml`

**C. Check YAML Syntax**
```bash
# Validate YAML locally
npx js-yaml .github/workflows/e2e-azure.yml
```

---

### Issue 9: Service Principal Already Exists

**Error:**
```
Found an existing application instance
```

**Solutions:**

**A. Use Existing Service Principal**
Get credentials of existing one:
```bash
# List existing service principals
az ad sp list --display-name "github-actions-playwright" --output table

# Reset credentials
az ad sp credential reset --id YOUR-CLIENT-ID --sdk-auth
```

**B. Create with Different Name**
```bash
az ad sp create-for-rbac --name "github-actions-playwright-v2" --role contributor --scopes /subscriptions/YOUR-SUBSCRIPTION-ID/resourceGroups/YOUR-RESOURCE-GROUP --sdk-auth
```

---

### Issue 10: Artifacts Not Uploaded

**Problem:** Test reports not available in workflow.

**Solutions:**

**A. Check Path Exists**
Ensure directories are created:
```yaml
- name: Upload Playwright report
  if: always()
  uses: actions/upload-artifact@v4
  with:
    name: playwright-report-azure
    path: playwright-report/
    if-no-files-found: warn  # Add this
```

**B. Verify Reporter Configuration**
In `playwright.config.js`:
```javascript
reporter: 'html',  // Generates playwright-report/
```

---

## Best Practices

### Security

1. **Never commit secrets** to git
2. **Rotate credentials** regularly (every 90 days)
3. **Use least privilege** principle for service principal
4. **Enable secret scanning** in GitHub repository
5. **Use environment-specific secrets** for different stages

### Performance

1. **Use parallel workers** (`--workers=20`)
2. **Cache npm dependencies** in workflow
3. **Run tests only on relevant changes** using path filters
4. **Set appropriate timeouts** to avoid hanging workflows

### Cost Optimization

1. **Run tests on pull requests** and main branch only
2. **Use workflow_dispatch** for manual triggers
3. **Set artifact retention** to appropriate days (30 days recommended)
4. **Cancel redundant workflow runs** automatically

### Maintenance

1. **Keep actions up to date** (renovate bot)
2. **Monitor workflow execution** times
3. **Review failed tests** regularly
4. **Update service principal** credentials before expiry
5. **Document custom configurations** in repository

---

## Quick Reference

### Essential Commands

```bash
# Azure CLI
az login
az account show
az account list --output table

# Service Principal
az ad sp create-for-rbac --name "name" --role contributor --scopes /subscriptions/SUB-ID/resourceGroups/RG-NAME --sdk-auth
az ad sp list --display-name "name"
az ad sp delete --id CLIENT-ID

# Role Assignments
az role assignment list --assignee CLIENT-ID
az role assignment create --role "Playwright Testing Contributor" --assignee SP-ID --scope SCOPE

# Git
git add .github/workflows/e2e-azure.yml
git commit -m "ci: Add Azure workflow"
git push origin master
```

### Verification Checklist

Before running tests:
- [ ] Azure Playwright Workspaces resource created
- [ ] Service principal created with correct permissions
- [ ] `AZURE_CREDENTIALS` secret added to GitHub
- [ ] `PLAYWRIGHT_SERVICE_URL` secret added to GitHub
- [ ] Workflow file created in `.github/workflows/`
- [ ] Playwright Service config (`playwright.service.config.js`) exists
- [ ] Branch name in workflow matches repository
- [ ] Service principal has "Playwright Testing Contributor" role

### Testing Workflow

```bash
# Local test first
npx playwright test -c playwright.service.config.js --workers=20

# Commit workflow
git add .github/workflows/e2e-azure.yml
git commit -m "ci: Add Azure Playwright workflow"
git push

# Monitor in GitHub Actions tab
```

---

## Additional Resources

- [Azure Playwright Workspaces Documentation](https://aka.ms/pww/docs)
- [GitHub Actions Documentation](https://docs.github.com/actions)
- [Azure Service Principal Guide](https://docs.microsoft.com/azure/active-directory/develop/howto-create-service-principal-portal)
- [Playwright Documentation](https://playwright.dev/)
- [Azure CLI Reference](https://docs.microsoft.com/cli/azure/)

---

## Support

If you encounter issues not covered in this guide:

1. Check [Playwright Workspaces Documentation](https://aka.ms/pww/docs)
2. Review [GitHub Actions logs](https://docs.github.com/actions/monitoring-and-troubleshooting-workflows)
3. Verify [Azure resource status](https://portal.azure.com)
4. Check [service principal permissions](https://portal.azure.com)
5. Open issue in repository with error logs

---

**Last Updated:** January 31, 2026

**Note:** Keep service principal credentials secure and never commit them to source control.
