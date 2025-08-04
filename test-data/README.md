# FlowScope Test Data Loading Instructions

This folder contains comprehensive test data for FlowScope that simulates real-world usage scenarios. Use these files to populate your FlowScope instance with realistic data for testing.

## 📁 Test Data Files

### Core Data Files
- **`sample-traces.json`** - 10 realistic AI trace examples including successful calls, errors, and complex chains
- **`sample-users.json`** - 3 test users with different roles (admin, member, viewer)  
- **`sample-teams.json`** - 2 teams with different configurations and member structures
- **`sample-projects.json`** - 3 projects representing different AI use cases
- **`sample-comments.json`** - Collaborative comments and annotations on traces
- **`sample-shares.json`** - Share links demonstrating public and private sharing scenarios

### Test Scripts
- **`langchain-test.py`** - Python script demonstrating LangChain integration for VS Code extension testing

## 🚀 How to Load Test Data

### Method 1: Backend API (Recommended)
Your FlowScope backend is running at `http://localhost:3001` with these available endpoints:

**For Windows PowerShell users:**
```powershell
# First, verify the backend is healthy
Invoke-RestMethod -Uri "http://localhost:3001/api/health" -Method GET

# Load traces in batch (recommended approach)
cd "c:\Users\charlesidu\Downloads\FlowScope\test-data"
$body = Get-Content "sample-traces-batch-clean.json" -Raw
Invoke-RestMethod -Uri "http://localhost:3001/api/traces/batch" -Method POST -Body $body -ContentType "application/json"

# Load individual trace example
$singleTrace = @'
{
  "id": "custom-trace-1",
  "sessionId": "custom-session",
  "name": "Custom Test Trace",
  "type": "prompt",
  "timestamp": "2025-07-27T21:10:00Z",
  "data": {
    "input": "Your test input here"
  },
  "status": "completed"
}
'@
Invoke-RestMethod -Uri "http://localhost:3001/api/traces" -Method POST -Body $singleTrace -ContentType "application/json"
```

**For Unix/Linux/Mac (bash/zsh):**
```bash
# First, verify the backend is healthy
curl -X GET http://localhost:3001/api/health

# Load multiple traces at once using batch endpoint
curl -X POST http://localhost:3001/api/traces/batch \
  -H "Content-Type: application/json" \
  -d @sample-traces-batch-clean.json
```

**Note:** The backend doesn't currently have dedicated seeding endpoints, so you'll need to send traces individually or in batches using the traces API.

### Method 2: Direct Database Import
If using SQLite database directly:

```bash
# Copy JSON data to appropriate database tables
# (Requires custom script or manual database operations)
```

### Method 3: Manual UI Testing
For manual testing without backend integration:
1. Copy the JSON content from any file
2. Use browser developer tools to inject data into the application state
3. Refresh the FlowScope web interface

## 📊 Test Data Scenarios

### Customer Support Bot Chain
- **Files:** `trace-1`, `trace-2`, `trace-3` in `sample-traces.json`
- **Scenario:** Customer inquiring about delayed order
- **Features Tested:** Tool calling, API integration, response generation
- **Use Case:** Demonstrates typical customer service automation

### Code Review Assistant
- **Files:** `trace-4`, `trace-5` in `sample-traces.json`  
- **Scenario:** AI reviewing Python bubble sort implementation
- **Features Tested:** Code analysis, improvement suggestions
- **Use Case:** Developer productivity tools

### Error Handling Examples
- **Files:** `trace-6`, `trace-7`, `trace-8` in `sample-traces.json`
- **Scenario:** Rate limit error followed by successful retry
- **Features Tested:** Error visualization, retry mechanisms
- **Use Case:** Production debugging and resilience testing

### Complex Document Analysis
- **Files:** `trace-9`, `trace-10` in `sample-traces.json`
- **Scenario:** Research paper analysis with key point extraction
- **Features Tested:** Multi-step chains, tool integration
- **Use Case:** Document processing and analysis workflows

### Team Collaboration
- **Files:** All files in `sample-comments.json` and `sample-shares.json`
- **Scenario:** Team members collaborating on AI application debugging
- **Features Tested:** Comments, sharing, team workflows
- **Use Case:** Team-based AI development

## 🎭 Test User Personas

### Alice Developer (Admin)
- **Role:** Team leader and senior developer
- **Access:** Full admin privileges
- **Use Case:** Managing projects, reviewing team work, creating shares
- **Login:** `alice.developer@testcompany.com`

### Bob Engineer (Member)  
- **Role:** Mid-level AI engineer
- **Access:** Can create and edit content
- **Use Case:** Daily development work, adding comments, debugging traces
- **Login:** `bob.engineer@testcompany.com`

### Carol Tester (Viewer)
- **Role:** QA tester and analyst  
- **Access:** Read-only with commenting
- **Use Case:** Testing AI applications, reporting issues, viewing shared content
- **Login:** `carol.tester@testcompany.com`

## 🔗 Share Link Testing

### Public Demo Links
- **Customer Support:** `fs_demo_customer_support_2025`
  - Public access, comments allowed
  - Perfect for external demos

- **Error Handling:** `fs_demo_error_handling`  
  - Public with comments and downloads
  - Good for training materials

### Secure Demo Links
- **Code Review:** `fs_demo_code_review_secure`
  - Password protected (password: `demo123`)
  - Limited access, good for sensitive content testing

## 🧪 Testing Workflows

### Workflow 1: New User Onboarding
1. Load all test data
2. Start with Alice's account
3. Follow the testing playbook step-by-step
4. Test all major features with realistic data

### Workflow 2: Team Collaboration Testing
1. Use different user accounts (Alice, Bob, Carol)
2. Test commenting on the same traces
3. Create and share links between team members
4. Verify permission restrictions work correctly

### Workflow 3: Error Scenario Testing
1. Focus on `trace-6` (failed request)
2. Examine error details and retry patterns
3. Test error handling UI components
4. Verify error notifications work properly

### Workflow 4: Performance Testing
1. Load all traces simultaneously
2. Test filtering and search with large dataset
3. Verify real-time updates work smoothly
4. Check memory usage and responsiveness

## 📝 Data Validation

### Trace Data Validation
- ✅ All traces have valid timestamps
- ✅ Parent-child relationships are properly linked
- ✅ Error traces include proper error objects
- ✅ Successful traces have complete data flows
- ✅ Tool calls include both input and output

### User Data Validation  
- ✅ All users have valid email addresses
- ✅ Role permissions are correctly assigned
- ✅ User preferences are set appropriately
- ✅ Avatar URLs are accessible

### Team Structure Validation
- ✅ Team membership is consistent
- ✅ Project assignments are valid
- ✅ Permission hierarchies work correctly
- ✅ Team settings are realistic

## 🔄 Updating Test Data

When modifying test data:

1. **Maintain Relationships:** Ensure IDs remain consistent across files
2. **Update Timestamps:** Use realistic, recent timestamps
3. **Validate JSON:** Check that all JSON files are syntactically correct
4. **Test Integration:** Verify changes work with actual FlowScope instance
5. **Document Changes:** Update this README with any new scenarios

## 🐛 Troubleshooting Test Data

### Common Issues

**Issue:** Traces don't appear in UI
- Check that trace IDs are unique
- Verify project and user IDs exist in respective files
- Ensure timestamp format is correct (ISO 8601)

**Issue:** Comments don't display
- Verify `traceId` and `userId` references are valid
- Check that referenced users exist in `sample-users.json`
- Ensure comment content is properly escaped

**Issue:** Share links don't work
- Verify `shareToken` is unique and URL-safe
- Check that referenced `projectId` exists
- Ensure `traceIds` array references valid traces

**Issue:** Team permissions not working
- Verify user roles are one of: `admin`, `member`, `viewer`
- Check team membership arrays include all referenced users
- Ensure project ownership is assigned to valid users

### Data Consistency Checks

Run these checks before loading data:

```bash
# Check for duplicate IDs
grep -o '"id": "[^"]*"' *.json | sort | uniq -d

# Verify user references
grep -o '"userId": "[^"]*"' *.json | sort | uniq

# Check trace relationships  
grep -o '"parentId": "[^"]*"' sample-traces.json
```

## 📞 Support

If you encounter issues with test data:

1. Check this README for troubleshooting steps
2. Validate JSON syntax using online JSON validators
3. Verify data relationships are consistent
4. Contact development team with specific error messages

**Happy Testing! 🎉**
