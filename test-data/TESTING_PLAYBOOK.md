# FlowScope Comprehensive Testing Playbook
## For Non-Technical Users

**Version:** 2.0  
**Date:** July 29, 2025  
**Duration:** Approximately 2-3 hours  
**Prerequisites:** None - this guide is designed for non-technical users

---

## 📋 **Overview**

This playbook will guide you through testing all major features of FlowScope, a visual debugger for AI language model applications. You'll learn how to navigate the interface, understand AI traces, collaborate with team members, and use advanced debugging features.

### **What You'll Test:**
1. ✅ Web Dashboard Navigation
2. ✅ Trace Visualization and Analysis  
3. ✅ Team Collaboration Features (Full Implementation)
4. ✅ Advanced Filtering and Export (Complete Implementation)
5. ✅ Error Handling and Debugging
6. ✅ Export and Filtering (Enhanced with Notification System)
7. ✅ Real-time Features (WebSocket Integration)
8. ✅ VS Code Extension (Production Ready)
9. ✅ Browser Extension (Production Ready)

---

## 🚀 **Current Implementation Status**

### **Phase 1: Infrastructure & Setup** ✅ **COMPLETE**
- ✅ Monorepo architecture with Lerna
- ✅ React frontend with TypeScript and Tailwind CSS
- ✅ NestJS backend with SQLite database
- ✅ Prisma ORM integration
- ✅ Development environment fully operational

### **Phase 2: SDK & Framework Integrations** 🔄 **IN PROGRESS**
- ✅ Core SDK architecture designed
- ✅ Adapter pattern implementation
- 🚧 LangChain integration (partial)
- 🚧 LlamaIndex integration (partial)
- ✅ Basic telemetry collection

### **Phase 3: Debugger Core & Visual Interface** ✅ **COMPLETE**
- ✅ React Flow-based chain visualization
- ✅ Interactive node selection and details
- ✅ Real-time WebSocket data streaming
- ✅ Comprehensive demo data generation
- ✅ Four-tab right panel system (Details, Inspector, Bookmarks, Comments)
- ✅ Advanced trace filtering and search
- ✅ Export functionality with multiple formats
- ⏳ Prompt versioning system (backend ready, UI pending)

### **Phase 4: Plugin Development** ✅ **COMPLETE**
- ✅ VS Code Extension (fully functional, production ready)
- ✅ Browser Extension (supports 5 major LLM platforms)
- ✅ Extension packaging and distribution ready
- ✅ Real-time trace capture and visualization

### **Phase 5: Team Collaboration** ✅ **COMPLETE**
- ✅ User authentication and team management
- ✅ Comments system with multiple types (Comment, Question, Issue, Praise)
- ✅ Role-based permissions (Admin, Member, Viewer)
- ✅ Team panel integration in sidebar
- ✅ Real-time collaboration features
- ✅ Demo team data loading

### **Phase 6: Production Features** ✅ **COMPLETE**
- ✅ Connection testing and health monitoring
- ✅ Comprehensive notification system
- ✅ Advanced export with JSON, CSV, and report formats
- ✅ Session management with proper isolation
- ✅ Collapsible panel system for space optimization
- ✅ Icon-based tab system for right panel

---

## 🔧 **Known Gaps and Limitations**

### **Critical Gaps Requiring Attention:**

#### **1. SDK Framework Integrations** 🚧 **HIGH PRIORITY**
- **LangChain Integration**: Core adapter exists but needs completion and testing
- **LlamaIndex Integration**: Partial implementation, requires completion
- **Real Integration Testing**: SDKs need testing with actual LLM applications
- **Documentation**: SDK integration guides need completion

#### **2. Prompt Versioning UI** ⏳ **MEDIUM PRIORITY**
- **Backend Ready**: Database schema and API endpoints complete
- **Frontend Missing**: Version control UI components not implemented
- **Git-like Operations**: Diff visualization, branch/merge interfaces needed
- **Integration**: Prompt versioning needs integration with main UI

#### **3. Production Deployment** 🔄 **MEDIUM PRIORITY**
- **Local Development Only**: Currently runs on localhost only
- **Cloud Deployment**: SaaS deployment to AWS/Vercel pending
- **Authentication**: Production auth system (Supabase) not configured
- **Database Migration**: PostgreSQL production setup pending

#### **4. Advanced Features** ⏳ **LOW PRIORITY**
- **Performance Metrics**: Token usage and cost analysis incomplete
- **Advanced Analytics**: Comprehensive performance dashboards missing
- **Integration Testing**: End-to-end testing with real applications
- **Documentation**: User guides and API docs need completion

### **Strengths of Current Implementation:**
- ✅ **Robust UI/UX**: Complete visual debugger with excellent user experience
- ✅ **Team Collaboration**: Full-featured comments and team management
- ✅ **Plugin Ecosystem**: Production-ready VS Code and browser extensions
- ✅ **Real-time Features**: WebSocket integration with live updates
- ✅ **Demo System**: Comprehensive demo data for testing and validation
- ✅ **Export Capabilities**: Multiple format support with advanced options

---

## 🎯 **Testing Focus Areas**

Based on current implementation status, focus testing on:

1. **🟢 Fully Implemented**: Web UI, team collaboration, export/filtering, real-time features
2. **🟡 Partially Implemented**: SDK integrations (basic functionality)
3. **🔴 Missing/Limited**: Prompt versioning UI, production deployment

---

## 🏁 **Getting Started**

### **Step 1: Access FlowScope**
1. Open your web browser (Chrome, Firefox, Edge, or Safari)
2. Navigate to: `http://localhost:5173`
3. You should see the FlowScope dashboard with a header saying "FlowScope Visual Debugger"

**✅ Success Check:** You can see the main interface with a sidebar on the left and main content area

**❌ If you see an error:** Contact your technical team - the servers may not be running

### **Step 2: Understand the Interface Layout**
Take a moment to familiarize yourself with the main areas:

- **Left Sidebar:** Navigation and controls
- **Header:** Title and view mode toggles  
- **Main Area:** Where traces and visualizations appear
- **Right Panel:** Detailed information about selected items

---

## 🔍 **Test Module 1: Basic Navigation and Trace Viewing**

### **Test 1.1: Create Sessions and Load All Demo Scenarios**

### **Test 1a.4: Tabbed Left Panel Interface Testing**

#### **Test 1a.4.1: Tab Navigation in Expanded State**
**Expected Behavior:**
- Left panel shows three tabs: Sessions, Team, Tools
- Sessions tab is active by default with search at top
- Tab headers show appropriate icons and labels
- Active tab has distinct styling (blue for Sessions, purple for Team, green for Tools)
- Content changes appropriately when switching tabs

**Steps:**
1. Ensure left panel is expanded
2. Verify Sessions tab is active by default
3. Click Team tab - verify content switches to team management
4. Click Tools tab - verify content shows tools and actions
5. Click Sessions tab - verify content returns to sessions with search

**Pass Criteria:**
✅ All three tabs are visible and properly labeled
✅ Sessions tab is active by default
✅ Each tab shows appropriate content
✅ Tab switching works smoothly
✅ Search box is visible at top of Sessions tab

#### **Test 1a.4.2: Collapsed State Icon Organization**
**Expected Behavior:**
- Collapsed state shows organized icons by tab category
- Sessions icon (Settings) shows tab status
- Team icon (Users) available for expansion
- Tools icon (Zap) available for expansion
- Quick action icons below separator (Send, Download, Filter)
- Connection status indicator at bottom

**Steps:**
1. Click collapse button to minimize left panel
2. Verify Sessions icon is visible and indicates active tab
3. Verify Team and Tools icons are available
4. Verify quick action icons are properly separated
5. Verify connection status indicator at bottom

**Pass Criteria:**
✅ All tab icons are visible in collapsed state
✅ Active tab has distinct styling
✅ Quick action icons are properly separated
✅ Icons have appropriate tooltips
✅ Connection status indicator is visible

#### **Test 1a.4.3: Tab Expansion from Collapsed State**
**Expected Behavior:**
- Clicking a tab icon in collapsed state expands panel to that tab
- Panel opens directly to the clicked tab's content

**Steps:**
1. Start with left panel collapsed
2. Click Sessions icon - verify panel expands to Sessions tab
3. Collapse panel, click Team icon - verify panel expands to Team tab
4. Collapse panel, click Tools icon - verify panel expands to Tools tab

**Pass Criteria:**
✅ Clicking tab icons expands to correct tab
✅ Tab content is immediately visible
✅ Animation/transition is smooth

### **Test 1.1: Create Sessions and Load All Demo Scenarios** (Continued)
1. Look for a "Load All Demo Scenarios" button in the interface
2. Click it once to automatically create and populate multiple demo sessions
3. You should see 4 new sessions appear in the sidebar:
   - **Weather API Demo**: Weather query workflow (4 traces)
   - **Travel Planning Demo**: Flight booking + hotel search + itinerary (6 traces)
   - **Error Handling Demo**: Failed calculation + retry pattern (3 traces)  
   - **Customer Support Demo**: Order inquiry + lookup + response (4 traces)

**Expected Result:** 4 sessions, each containing different AI workflow scenarios that demonstrate various FlowScope features:

**Weather API Demo** - Simple tool usage:
1. **User Prompt**: "What's the weather like in San Francisco? Use the weather API to get current conditions."
2. **Function Call**: Call to `get_weather` with location parameters
3. **Tool Result**: Weather API response with temperature, humidity, wind data
4. **Final Response**: AI's formatted answer about San Francisco weather

**Travel Planning Demo** - Complex multi-step workflow
**Error Handling Demo** - Shows failure and retry patterns
**Customer Support Demo** - Service interaction with data lookup

**Note:** FlowScope organizes traces by sessions. The enhanced demo loader now creates 4 comprehensive scenarios automatically, eliminating the need for manual API calls to test different workflow types.

**📝 Data Persistence:** In the current development setup, trace data is stored in memory only. This means all traces (including demo data) will disappear when you refresh the page. This is expected behavior for testing - you'll need to reload demo data after each refresh.

### **Test 1.2: Explore Different Demo Sessions**
1. You should see 4 different demo sessions in the sidebar
2. Click on each session to explore different AI workflow types:
   - **Weather API Demo**: Simple tool usage pattern
   - **Travel Planning Demo**: Complex multi-step workflow  
   - **Error Handling Demo**: Shows failures and retry patterns
   - **Customer Support Demo**: Service conversation with data lookup
3. For each session, observe the main visualization area showing:
   - Connected boxes (nodes) representing conversation steps
   - Lines connecting the boxes in sequence
   - Different colors for different operation types (prompts, tool calls, responses, errors)

**✅ Success Check:** You can switch between sessions and see different workflow patterns visualized

**🎨 Visual Verification:** Notice that prompt nodes have blue backgrounds and response nodes have green backgrounds, making it easy to distinguish between user inputs and AI responses in the flow view.

**Learning Note:** This demonstrates FlowScope's ability to handle various AI assistant patterns: simple queries, complex multi-step processes, error scenarios, and customer service interactions. Each session type shows different debugging scenarios developers encounter.

### **Test 1.2a: Test Session Management Features**
1. **Test Multiple Demo Loading**: Try clicking the "Load All Demo Scenarios" button multiple times
   - **Expected Result**: Sessions should NOT be duplicated - clicking multiple times should simply select the first demo session without creating duplicates
   - **Success Check**: Only 4 demo sessions appear regardless of how many times you click the button

2. **Test Session Deletion**: 
   - Look for a trash can icon (🗑️) on each session in the sidebar
   - Click the trash icon on any session
   - **Expected Results**:
     - The session should be immediately removed from the sidebar
     - If you deleted the currently selected session, the next session in the list should automatically be selected
     - The main pane should immediately update to show traces for the newly selected session
     - If you delete the last session in the list, the previous session should be selected
   - **Success Check**: Session deletion works smoothly without requiring manual session selection

3. **Test Session Filtering**: 
   - Verify that when you click on a session, only traces for that specific session appear in the main visualization
   - Switch between different sessions and confirm the main pane updates to show only the relevant traces
   - **Test Timeline View Initial State**: Load demo data, switch to Timeline view immediately - should show only the first session's traces (not all sessions mixed together)
   - Switch between sessions in Timeline view to verify proper filtering
   - **Success Check**: No mixing of traces between sessions - each session shows only its own workflow data in both Flow and Timeline views

### **Test 1.3: Explore Trace Details and Analysis**
1. Click on any node/box in the visualization
2. Look at the right panel - you should see **four complementary tabs**:
   - **Node Details tab**: Shows basic node information (ID, type, content, timing)
   - **Trace Inspector tab**: Shows comprehensive analysis (performance metrics, token usage, costs, full trace data)
   - **Bookmarks tab**: Manage saved traces for quick access
   - **Comments tab**: Team collaboration and discussion (NEW!)
3. **Test Node Details tab**:
   - Should show immediate basic information about the selected node
   - Input/output content, timing, and metadata
   - Simple, focused view for quick reference
4. **Test Trace Inspector tab**:
   - Should show advanced analysis and metrics
   - Performance data, token usage, costs (if available)
   - Full trace information and debugging data
   - Export and bookmark functionality
5. **Test Comments tab** (NEW!):
   - Should show existing comments from team members for this trace
   - Ability to add new comments with different types (Comment, Question, Issue, Praise)
   - Comment editing, deletion, and resolution features
   - Real-time collaboration capabilities
5. **Test cross-view functionality**:
   - Select a node in Flow view - both tabs should populate, Details tab remains active
   - Switch to Timeline view and select a trace - both tabs should populate, current tab remains active  
   - Verify Inspector tab works from both Flow and Timeline views
   - Verify Node Details tab works from both Flow and Timeline views
   - Test switching between views while maintaining selections
6. **Test tab integration**:
   - Switch between Node Details, Trace Inspector, Bookmarks, and Comments tabs
   - Verify all tabs show information about the same selected item
   - Test commenting on different traces to verify proper trace-specific display
   - Switch between tabs while maintaining trace selection

**✅ Success Check:** 
- Node Details tab provides quick, essential information from both Flow and Timeline views
- Trace Inspector tab provides comprehensive analysis and debugging data from both views
- Comments tab enables team collaboration with proper user attribution and trace association
- Bookmarks tab provides quick access to saved traces
- All tabs work when selecting nodes from Flow view or traces from Timeline view  
- No automatic tab switching - user controls which information to view
- Clear distinction between basic details, advanced analysis, saved items, and team collaboration

**Learning Note:** Each node represents one step in the AI conversation. Input nodes show questions or prompts, output nodes show AI responses. The detail panel should always sync perfectly with the selected node.

### **Test 1.4: Switch View Modes**
1. Look for view mode toggle buttons in the header (might show "Flow" and "Timeline")
2. Click between different view modes
3. Notice how the same information is presented differently:
   - **Flow View:** Shows boxes and connections
   - **Timeline View:** Shows events in chronological order

**✅ Success Check:** You can switch between at least two different visualization modes

---

## 🎨 **Test Module 1a: UI/UX Improvements Verification**

### **Test 1a.1: Visual Node Distinction**
1. Load the demo scenarios and select any session
2. In the Flow view, examine the node colors:
   - **Prompt nodes** (user input) should have **blue backgrounds**
   - **Response nodes** (AI output) should have **green backgrounds** 
   - **Function call nodes** should have different colors (typically orange/yellow)
3. Follow a conversation flow and verify you can easily distinguish:
   - What the user asked (blue nodes)
   - What the AI responded (green nodes)
   - Any tool/function calls in between

**✅ Success Check:** Clear visual distinction between node types makes conversation flow easy to follow

### **Test 1a.2: Session Management Robustness**
1. **Test Duplicate Prevention:**
   - Click "Load All Demo Scenarios" button 3-4 times rapidly
   - Verify only 4 sessions appear (no duplicates)
   - **Expected Behavior**: Button recognizes existing demo sessions and doesn't recreate them

2. **Test Session Deletion UX:**
   - Locate the trash can icon (🗑️) on each session - it should NOT be a square
   - Delete the currently selected session
   - **Expected Behavior**: Next session automatically becomes active
   - Delete middle sessions and verify smart selection (next in list)
   - Delete the last session and verify it selects the previous one

3. **Test Session Isolation:**
   - Switch between different demo sessions
   - Verify the main pane completely updates each time
   - **Expected Behavior**: No "ghost" traces from previous sessions remain visible

**✅ Success Check:** Session management feels smooth and intuitive without manual cleanup needed

### **Test 1a.3: Right Panel Tab Clarity**
1. **Test Tab Purpose Distinction:**
   - Select any node and examine both tabs in the right panel
   - **Node Details tab** should show: Basic node info, content, timing, metadata
   - **Trace Inspector tab** should show: Performance metrics, token usage, costs, full debugging data
   - Verify clear functional separation between basic details vs advanced analysis

2. **Test Cross-View Tab Functionality:**
   - Select a node in Flow view - verify both tabs populate with relevant data
   - Switch to Timeline view and select a trace - verify Inspector tab updates
   - Confirm Inspector tab works from both Flow and Timeline selections
   - Switch back to Flow view and select different nodes - verify tabs update properly

3. **Test Tab Labels and Tooltips:**
   - Hover over tab headers to see helpful tooltips explaining their purpose
   - **Expected Labels**: "Node Details", "Trace Inspector", "Bookmarks"
   - Verify labels clearly indicate the difference between basic info and advanced analysis

### **Test 1a.4: Collapsible Panel Functionality** (NEW!)
1. **Test Left Panel Collapse:**
   - Look for collapse buttons on both left and right panels (well-styled with borders and shadows)
   - Click the collapse button on the left panel
   - **Expected Behavior**: Panel collapses to show icon-only view with comprehensive functionality
   - Verify all key functions are available as icons:
     - **New Session** (Play icon) - Creates new session
     - **Load Demo Scenarios** (Lightning icon) - Loads all demo data
     - **Send Live Trace** (Send icon) - Sends trace data
     - **Export & Share** (Share icon) - Opens export/sharing options
     - **Search Sessions** (Search icon) - Expands panel when clicked
     - **Team Management** (Users icon) - Expands panel when clicked
     - **Sessions List** (Settings icon) - Expands panel when clicked
     - **Connection Test** (Wifi icon) - Tests/reconnects WebSocket (green when connected, red when disconnected)
     - **Advanced Filters** (Filter icon) - Opens filter options

2. **Test Icon Tooltips:**
   - Hover over each icon in collapsed mode
   - **Expected Behavior**: Clear tooltips appear explaining what each icon does
   - Some tooltips should indicate "(Click to expand)" for functions that need the full panel

3. **Test Panel Expansion:**
   - Click on Search, Team Management, or Sessions icons
   - **Expected Behavior**: Left panel automatically expands to show full functionality
   - Test that functional icons (New Session, Load Demo, etc.) work directly without expanding

4. **Test Right Panel Collapse:**
   - Click the collapse button on the right panel
   - **Expected Behavior**: Panel collapses to narrow width with "Details Panel" text
   - Panel header should be centered with proper spacing from collapse button
   - Only one expand button should be visible (no duplicates)

5. **Test Panel State Persistence:**
   - Collapse both panels, navigate between different views (Flow/Timeline)
   - **Expected Behavior**: Collapsed state should persist across view changes
   - Test that main area utilizes the additional space when panels are collapsed

**✅ Success Check:** 
- Both panels can be collapsed/expanded smoothly
- Collapsed left panel shows all major functions as clearly labeled icons
- Tooltips provide helpful guidance
- Panel expansion works automatically for functions that need it
- Collapsed state provides maximum space for main visualization area
- No duplicate buttons or interface elements

---

## 🔄 **Optional: Loading Additional Test Data via API**

**Note:** The enhanced demo loader now provides comprehensive test scenarios automatically. However, if you want to load even more specific test data, you can still use the backend API.

### **Load Additional Test Scenarios (Advanced)**
If you want to test with our original comprehensive test data files:

1. Open a new PowerShell window
2. Navigate to the test-data folder: `cd "c:\Users\charlesidu\Downloads\FlowScope\test-data"`
3. Load additional scenarios:

```powershell
# Customer Support with more detailed traces
$body = Get-Content "sample-traces-batch-clean.json" -Raw
Invoke-RestMethod -Uri "http://localhost:3001/api/traces/batch" -Method POST -Body $body -ContentType "application/json"
```

4. Return to FlowScope (no refresh needed - real-time updates)
5. You should see additional sessions appear

**Note:** This is now optional since the "Load All Demo Scenarios" button provides comprehensive testing data automatically.

---

## 👥 **Test Module 2: Team Collaboration Features**

### **Test 2.1: Load Demo Team and View Team Information**
1. **Load Demo Team**: Click the "Load All Demo Scenarios" button - this now automatically loads both demo sessions AND a demo team
2. Look for a "Team" section in the left sidebar below the search box
3. You should see team information showing:
   - Team name: "AI Development Team"
   - Your current user (Alex Chen - Admin)
   - Online status indicators for team members
   - Quick stats: number of members and who's online
4. Click the "Manage" button to open the full team management interface

### **Test 2.2: Explore Team Management**
1. In the Team Management modal, you should see:
   - **Full-screen modal dialog** that overlays the entire interface
   - **Properly sized modal** that adjusts to content and allows scrolling when needed
   - Team overview with member count, online status, and projects
   - Complete list of team members with their roles and status
   - Admin controls (if you're logged in as Alex Chen)
   - **Team Projects section** fully visible at the bottom
2. **Test member roles**: Notice the different role badges:
   - **Admin** (Crown icon): Alex Chen - can manage team and members
   - **Member** (Shield icon): Sarah Johnson, Mike Rodriguez - can view and comment
   - **Viewer** (Eye icon): Emma Wilson - read-only access
3. **Test adding members** (Admin only): Try adding a new team member using the "Add Member" button
4. **Test role changes** (Admin only): 
   - Try changing a member's role using the dropdown menus
   - **Expected Behavior**: A confirmation dialog should appear asking you to confirm the role change
   - Verify the dialog shows the member name, old role, and new role
   - Test both "Cancel" and "Change Role" options
5. **Test member removal** (Admin only):
   - Try clicking the X button to remove a team member
   - **Expected Behavior**: A confirmation dialog should appear asking you to confirm the removal
   - Verify the dialog shows the member name and warns that the action cannot be undone
   - Test both "Cancel" and "Remove Member" options
5. **Test modal closure**: Click the X button or click outside the modal to close it and return to the main interface
6. **Test scrolling**: If you have many team members, verify you can scroll through the entire modal content to see all sections
7. **Test confirmation dialogs**: Verify that destructive actions require confirmation:
   - Role changes show confirmation with member name, old role, and new role
   - Member removal shows confirmation with warning about irreversible action
   - Both dialogs have clear Cancel and Confirm options

### **Test 2.3: Explore Team Projects**
1. In the Team Management modal, scroll down to the "Team Projects" section
2. You should see three demo projects:
   - "Customer Support Bot"
   - "Code Review Assistant"  
   - "Document Analysis Tool"
3. These represent different AI applications the team is working on

### **Test 2.4: Add Comments to Traces**
1. Select any trace from the demo sessions (click on a node in Flow view or trace in Timeline view)
2. Look at the right panel - you should now see **four tabs**:
   - Node Details
   - Trace Inspector
   - Bookmarks
   - **Comments** (NEW!)
3. Click on the **Comments tab**
4. You should see some existing demo comments from team members
5. Try adding a new comment:
   - Select comment type (Comment, Question, Issue, or Praise)
   - Type your message: "Testing the new comment system!"
   - Click "Send" or press Ctrl+Enter
6. Verify your comment appears with your name and timestamp

### **Test 2.5: Test Different Comment Types**
1. **Add a Question**: Set type to "Question" and ask "Why does this step take so long?"
2. **Report an Issue**: Set type to "Issue" and note "This error handling could be improved"
3. **Give Praise**: Set type to "Praise" and say "Great response time on this query!"
4. Notice how different comment types have different colors and icons:
   - Questions: Blue with question mark icon
   - Issues: Red with warning triangle icon  
   - Praise: Pink with heart icon
   - Comments: Gray with message icon

### **Test 2.6: Comment Management**
1. **Edit comments**: Click the edit icon on your own comments to modify them
2. **Delete comments**: Click the trash icon to remove comments (your own or all if you're admin)
3. **Resolve issues**: For "Issue" type comments, click the checkmark to mark as resolved
4. Notice timestamps show relative time (e.g., "2m ago", "1h ago")

**✅ Success Check:** 
- Demo team loads automatically with session data
- Team panel shows current team status in sidebar
- Comments system works across all trace types
- Different comment types are visually distinct
- Team management provides full member and project overview
- Role-based permissions work (admin vs member vs viewer)
- Confirmation dialogs prevent accidental member removal and role changes

---

## 🔗 **Test Module 3: Sharing and External Access**

### **Test 3.1: Create a Share Link**
1. Select an interesting trace (like the "Customer Support Bot Chain")
2. Look for a "Share" button or share icon
3. Click it and you should see sharing options:
   - Public/Private toggle
   - Password protection option
   - Expiration date
   - What can be shared (comments, metadata, etc.)

### **Test 3.2: Test Share Link Access**
1. After creating a share link, copy the generated URL
2. Open a new browser tab or incognito/private window
3. Paste the share URL and press Enter
4. You should be able to view the trace without logging in

**✅ Success Check:** The shared trace displays correctly in the new tab

### **Test 3.3: Test Password Protection**
1. Go back to the share settings
2. Enable password protection and set password "demo123"
3. Test the share link again in a new incognito tab
4. You should be prompted for the password
5. Enter "demo123" and verify access is granted

---

## 🐛 **Test Module 4: Error Handling and Debugging**

### **Test 4.1: Identify Failed Traces**
1. Look through the trace list for any with error indicators (red icons, "Failed" status)
2. Click on a failed trace
3. You should see:
   - Error message explaining what went wrong
   - Error type (like "Rate Limit Error")
   - Suggested solutions or retry options

**Learning Note:** Failed traces help identify problems in AI applications, like when an AI service is overloaded or there's a connection issue.

### **Test 4.2: Understand Retry Patterns**
1. Look for traces that show retry attempts
2. You might see:
   - Original failed attempt
   - Successful retry after a delay
   - Multiple attempts with different outcomes
3. Notice the timing between attempts

**Expected Pattern:** Failed request → Wait period → Successful retry

### **Test 4.3: Analyze Performance Issues**
1. Look at the timing information for different traces
2. Compare:
   - Fast responses (under 1 second)
   - Slow responses (over 3 seconds)
   - Very slow responses (over 10 seconds)
3. Try to identify what makes some traces slower than others

**Learning Goal:** Understanding which AI operations take longer helps optimize performance.

---

## 📊 **Test Module 5: Advanced Analysis Features**

### **Test 5.1: Use Filtering Options**
1. Look for filter controls (might be in sidebar or top of trace list)
2. Try filtering by:
   - Date range (show only recent traces)
   - Status (successful vs failed)
   - Framework (LangChain, LlamaIndex, etc.)
   - Project (Customer Support vs Code Review)
3. Verify the trace list updates to match your filters

### **Test 5.2: Search Functionality**
1. Find the search box (usually at the top)
2. Try searching for:
   - "customer" (should find customer support traces)
   - "error" (should find failed traces)
   - "code" (should find code review traces)
3. Verify search results are relevant

### **Test 5.3: Bookmark Important Traces**
1. Find the bookmark or "star" icon on traces
2. Bookmark 2-3 interesting traces
3. Look for a "Bookmarks" section to view your saved traces
4. Verify you can quickly access bookmarked items

**✅ Success Check:** Bookmarked traces appear in a dedicated bookmarks section

### **Test 5.4: Export Functionality**
1. Select a trace you want to export
2. Look for "Export" or "Download" option
3. Try exporting in different formats if multiple options are available
4. Verify the downloaded file contains trace information

**Learning Note:** Exported traces can be shared with others or analyzed in external tools.

---

## ⚡ **Test Module 6: Real-time Features**

### **Test 6.1: Monitor Live Traces**
1. Look for a "Live" or "Real-time" mode toggle
2. Enable real-time monitoring if available
3. If test scripts are running, you should see new traces appear automatically
4. Notice the real-time updates without page refreshing

### **Test 6.2: WebSocket Connection Status**
1. Look for a connection status indicator (often in header or footer)
2. It should show "Connected" or have a green indicator
3. If you see "Disconnected" or red indicator, note this as an issue

**Expected Status:** Connected with green indicator

---

## 🔧 **Test Module 7: VS Code Extension (Optional)**

**Note:** This section requires VS Code to be installed and the FlowScope extension to be loaded.

### **Test 7.1: Extension Installation Check**
1. Open VS Code
2. Look for FlowScope icon in the left activity bar
3. Click the FlowScope icon
4. You should see FlowScope panels in the sidebar

### **Test 7.2: Code Integration**
1. Open the test file: `FlowScope/test-data/langchain-test.py`
2. Look for FlowScope code lenses (clickable links above code lines)
3. You should see options like:
   - "🔍 Debug with FlowScope"
   - "📝 Create Prompt Version"

### **Test 7.3: Start Tracing from VS Code**
1. Click a "Debug with FlowScope" code lens
2. The extension should connect to the FlowScope backend
3. Run the Python script if possible
4. Check if traces appear in both VS Code and the web dashboard

---

## 📋 **Test Results Checklist**

Use this checklist to track your testing progress:

### **Implementation Status Summary**

#### **✅ FULLY IMPLEMENTED (Ready for Production)**
- **Core UI/UX**: Complete visual debugger with React Flow visualization
- **Team Collaboration**: Full comments system with role-based permissions
- **Export System**: Comprehensive export with JSON, CSV, reports, and share links
- **Real-time Features**: WebSocket integration with live updates
- **Plugin Ecosystem**: Production-ready VS Code and browser extensions
- **Connection Testing**: Health monitoring for backend, API, and WebSocket
- **Notification System**: Centralized confirmation dialogs and user feedback
- **Demo System**: Comprehensive demo data with 4 realistic scenarios

#### **🟡 PARTIALLY IMPLEMENTED (Core Functions Work)**
- **SDK Integrations**: Basic adapters exist, need completion and testing
- **Prompt Versioning**: Backend complete, frontend UI pending
- **Advanced Analytics**: Basic metrics available, comprehensive dashboards missing

#### **🔴 NOT IMPLEMENTED (Future Development)**
- **Production Deployment**: Currently local-only, SaaS deployment pending
- **Advanced Security**: Production authentication and authorization pending
- **Performance Optimization**: Production-grade optimization pending
- **Comprehensive Documentation**: User guides and API docs need completion

### **Basic Functionality**
- [ ] Can access FlowScope web interface
- [ ] Can view trace visualizations
- [ ] Can switch between view modes (Flow/Timeline)
- [ ] Can see trace details when clicking on nodes
- [ ] Can navigate between different projects
- [ ] **NEW:** Team panel displays in left sidebar with current team information
- [ ] **NEW:** Four-tab right panel system (Node Details, Trace Inspector, Bookmarks, Comments)
- [ ] **NEW:** Comments tab enables team collaboration on traces
- [ ] **ENHANCED:** Prompt nodes display with blue backgrounds, response nodes with green backgrounds
- [ ] **ENHANCED:** "Load All Demo Scenarios" button loads both sessions and demo team
- [ ] **ENHANCED:** Session deletion works with proper trash can icon (not square)
- [ ] **ENHANCED:** Deleting current session automatically selects next available session
- [ ] **ENHANCED:** Session switching properly filters traces (no mixing between sessions)
- [ ] **NEW:** Right panel uses icon-based tabs with hover tooltips instead of dropdown
- [ ] **NEW:** Clicking on nodes automatically opens right panel if collapsed
- [ ] **NEW:** Export & Share button provides comprehensive export options (JSON, CSV, Reports)
- [ ] **NEW:** Test Connection button opens connection testing modal
- [ ] **NEW:** Send Live Trace provides demo data simulation functionality

### **Team Collaboration**
- [ ] Can load demo team automatically with "Load All Demo Scenarios"
- [ ] Team panel visible in left sidebar with current team info
- [ ] Team management modal shows complete member list and roles
- [ ] Can view team projects and member status
- [ ] Comments tab available in right panel for selected traces
- [ ] Can add different types of comments (Comment, Question, Issue, Praise)
- [ ] Can edit and delete own comments
- [ ] Can resolve issue-type comments
- [ ] Comment timestamps and user attribution work correctly
- [ ] Role-based permissions function properly (admin vs member vs viewer)

### **Plugin Integration (PRODUCTION READY)**
- [ ] **VS Code Extension**: Can install and use FlowScope extension in VS Code
- [ ] **VS Code Extension**: Extension shows trace data and debugging panels
- [ ] **VS Code Extension**: Can capture traces from VS Code environment
- [ ] **Browser Extension**: Can install extension in Chrome/Firefox
- [ ] **Browser Extension**: Extension captures traces from LLM platforms (ChatGPT, Claude, etc.)
- [ ] **Browser Extension**: Debug panel shows comprehensive trace information

### **Advanced UI Features (NEW)**
- [ ] **Collapsible Panels**: Both left and right panels can be collapsed/expanded
- [ ] **Notification System**: All actions show confirmation dialogs in main panel center
- [ ] **Icon Navigation**: Collapsed panels show functional icons with tooltips
- [ ] **Advanced Filters**: Filter modal opens and provides comprehensive filtering options
- [ ] **Connection Testing**: Test Connection shows backend, API, and WebSocket status
- [ ] **Export System**: Export modal provides JSON, CSV, share links, and report generation

### **Sharing Features**
- [ ] Can create shareable links
- [ ] Share links work in new browser tabs
- [ ] Password protection works correctly
- [ ] Shared traces display properly without login

### **Error Handling**
- [ ] Can identify failed traces in the interface
- [ ] Error messages are clear and helpful
- [ ] Can understand retry patterns and timing
- [ ] Performance differences are visible in trace timings

### **Advanced Features**
- [ ] Filtering works for date, status, and framework
- [ ] Search finds relevant traces
- [ ] Can bookmark and access saved traces
- [ ] Export functionality produces usable files

### **Real-time Features**
- [ ] Live updates work without page refresh
- [ ] WebSocket connection status is visible and healthy
- [ ] New traces appear automatically when generated
- [ ] **NEW:** Connection status indicator shows real-time connection state
- [ ] **NEW:** Test Connection validates backend, API, and WebSocket connectivity

### **VS Code Extension (Production Ready)**
- [ ] Extension loads and shows FlowScope panels
- [ ] Code lenses appear in supported files
- [ ] Can start tracing from within VS Code
- [ ] Traces sync between VS Code and web interface
- [ ] **NEW:** Extension has proper activity bar integration
- [ ] **NEW:** Tree view providers show traces, prompts, and bookmarks
- [ ] **NEW:** Webview integration provides embedded debugging interface

### **Browser Extension (Production Ready)**
- [ ] **NEW:** Extension works on ChatGPT platform
- [ ] **NEW:** Extension works on Claude platform  
- [ ] **NEW:** Extension works on Bard platform
- [ ] **NEW:** Extension works on Hugging Face platform
- [ ] **NEW:** Extension works on Replicate platform
- [ ] **NEW:** Extension captures API calls and responses
- [ ] **NEW:** Debug panel shows comprehensive trace information with filtering
- [ ] **NEW:** Extension provides visual indicators for traced interactions

---

## 🎯 **Success Criteria**

**Excellent (90%+ items checked):** FlowScope core functionality is production-ready for visual debugging and team collaboration
**Good (75-89% items checked):** FlowScope is highly functional with minor features to polish  
**Fair (60-74% items checked):** Core functionality works but some advanced features need development
**Poor (< 60% items checked):** Basic functionality issues that need immediate attention

---

## 🚀 **Implementation Roadmap for Remaining Features**

### **Phase 2 Completion (Estimated 2-3 weeks)**
1. **Complete SDK Integrations**
   - Finish LangChain adapter implementation and testing
   - Complete LlamaIndex adapter implementation and testing
   - Add comprehensive SDK documentation and examples

2. **Prompt Versioning UI**
   - Implement version history components
   - Add diff visualization interface
   - Create branch and merge UI elements

### **Phase 3: Production Readiness (Estimated 3-4 weeks)**
1. **SaaS Deployment**
   - Deploy React frontend to Vercel/AWS Amplify
   - Deploy NestJS backend to AWS ECS/Fargate
   - Configure production PostgreSQL database

2. **Authentication & Security**
   - Implement Supabase authentication
   - Add role-based access control
   - Configure production security measures

3. **Performance & Monitoring**
   - Add performance optimization
   - Implement error tracking (Sentry)
   - Add user analytics and monitoring

### **Phase 4: Advanced Features (Estimated 2-3 weeks)**
1. **Advanced Analytics**
   - Token usage and cost tracking
   - Performance dashboards
   - Advanced filtering and search

2. **Documentation & Onboarding**
   - Complete user documentation
   - API documentation
   - Video tutorials and guides

---

## 🐛 **Common Issues and Solutions**

### **Issue: Demo data disappears after page refresh**
**Symptoms:** All traces and sessions disappear when refreshing the browser  
**Explanation:** This is expected behavior in the current development setup - traces are stored in memory only, not persisted to database  
**Solution:** Reload demo data using "Load All Demo Scenarios" button after each refresh

### **Issue: Duplicate demo sessions created**
**Symptoms:** Multiple copies of Weather API Demo, Travel Planning Demo, etc. appear when clicking "Load All Demo Scenarios" multiple times  
**Status:** **FIXED** - Demo loader now prevents duplicates and selects existing sessions instead

### **Issue: Can't distinguish between prompts and responses in flow view**
**Symptoms:** All nodes look the same color making it hard to follow conversation flow  
**Status:** **FIXED** - Prompt nodes now have blue backgrounds, response nodes have green backgrounds

### **Issue: Delete icon shows as square instead of trash can**
**Symptoms:** Session delete button shows unclear square icon  
**Status:** **FIXED** - Now displays proper trash can icon (🗑️)

### **Issue: Deleting session leaves empty main pane**
**Symptoms:** After deleting current session, no traces visible until manually selecting another session  
**Status:** **FIXED** - Automatically selects next available session when current one is deleted

### **Issue: All session traces show at once**
**Symptoms:** When demo sessions are loaded, traces from all sessions appear mixed together in main pane  
**Status:** **FIXED** - Sessions now properly filter traces, showing only traces for selected session

### **Issue: Node details panel erratic or not showing**
**Symptoms:** Clicking on nodes sometimes shows details, sometimes doesn't, requiring multiple clicks  
**Status:** **FIXED** - Fixed node selection state management and trace filtering synchronization

### **Issue: Node details appear as overlay drawer instead of in Details tab**
**Symptoms:** Node details appear as a floating panel on top of the interface instead of within the right panel Details tab  
**Status:** **FIXED** - NodeDetail component now properly renders within the Details tab, with unnecessary close button removed

### **Issue: Confusion between Details and Inspector tabs**
**Symptoms:** Similar information appears in both tabs, unclear when to use which tab, Inspector only works from Timeline view  
**Status:** **FIXED** - Clarified tab purposes: Node Details for basic info, Trace Inspector for advanced analysis. Inspector now works from both Flow and Timeline views

### **Issue: Timeline view shows all traces initially**
**Symptoms:** When first loading demo data and switching to Timeline view, shows traces from all sessions until clicking on a specific session  
**Status:** **FIXED** - Modified session creation logic to prevent automatic session switching during batch loading. Timeline view now properly shows only traces for the initially selected session

### **Issue: Interface doesn't load**
**Symptoms:** Blank page or error message  
**Solution:** Check that both frontend (port 5173) and backend (port 3001) servers are running

### **Issue: No traces visible**
**Symptoms:** Empty trace list  
**Solution:** Click "Load All Demo Scenarios" or ensure test scripts have been run to generate traces

### **Issue: Real-time updates not working**
**Symptoms:** Need to refresh page to see new traces  
**Check:** WebSocket connection status - should show "Connected"

### **Issue: Comments not saving**
**Symptoms:** Comments disappear after adding them  
**Solution:** Ensure you're logged in and have write permissions to the project

### **Issue: Share links don't work**
**Symptoms:** Shared links show errors or login prompts  
**Check:** Verify share settings and that links haven't expired

### **Issue: VS Code extension not working**
**Symptoms:** No FlowScope panels or code lenses  
**Solution:** Ensure extension is installed and FlowScope backend is running

---

## 📞 **Getting Help**

If you encounter issues during testing:

1. **Take Screenshots:** Capture any error messages or unexpected behavior
2. **Note the Steps:** Record exactly what you were doing when the issue occurred
3. **Check Browser Console:** Press F12 and look for red error messages in the Console tab
4. **Document Your Environment:** Note which browser and operating system you're using

**Contact Information:**
- Development Team: [Insert contact details]
- Support Email: [Insert email]
- Bug Reports: [Insert bug tracking system]

---

## 🎉 **Conclusion**

Congratulations! You've completed a comprehensive test of FlowScope's features. This testing helps ensure the platform is ready for real-world use by AI developers and teams.

**Key Takeaways:**
- FlowScope visualizes AI conversations as connected flowcharts
- Team collaboration features enable shared debugging and learning
- Error handling helps identify and resolve AI application issues
- Real-time features provide immediate feedback during development

Your feedback from this testing session is valuable for improving FlowScope and making it more user-friendly for developers working with AI applications.

**Next Steps:**
- Share your results with the development team
- Provide feedback on user experience and interface clarity
- Suggest additional features that would be helpful
- Consider participating in regular testing sessions as new features are added
