// Clear All Test Data Script
// This script removes all test sessions and traces from the FlowScope database

const fetch = require('node-fetch');

const API_BASE = 'http://localhost:3001/api';

async function clearAllTestData() {
    console.log('🧹 Starting database cleanup...');
    
    try {
        // 1. Get all sessions
        console.log('📋 Fetching all sessions...');
        const sessionsResponse = await fetch(`${API_BASE}/sessions`);
        
        if (!sessionsResponse.ok) {
            throw new Error(`Failed to fetch sessions: ${sessionsResponse.status}`);
        }
        
        const sessions = await sessionsResponse.json();
        console.log(`Found ${sessions.length} sessions to delete`);
        
        // 2. Delete each session (this will cascade delete traces)
        let deletedCount = 0;
        let errorCount = 0;
        
        for (const session of sessions) {
            try {
                console.log(`🗑️  Deleting session: ${session.id} (${session.name})`);
                
                const deleteResponse = await fetch(`${API_BASE}/sessions/${session.id}`, {
                    method: 'DELETE'
                });
                
                if (deleteResponse.ok) {
                    deletedCount++;
                    console.log(`✅ Deleted session: ${session.id}`);
                } else {
                    errorCount++;
                    console.log(`❌ Failed to delete session ${session.id}: ${deleteResponse.status}`);
                }
                
                // Small delay to avoid overwhelming the server
                await new Promise(resolve => setTimeout(resolve, 100));
                
            } catch (error) {
                errorCount++;
                console.log(`❌ Error deleting session ${session.id}: ${error.message}`);
            }
        }
        
        // 3. Verify cleanup
        console.log('\n🔍 Verifying cleanup...');
        const verifyResponse = await fetch(`${API_BASE}/sessions`);
        const remainingSessions = await verifyResponse.json();
        
        console.log('\n📊 CLEANUP SUMMARY');
        console.log('==================');
        console.log(`✅ Sessions deleted: ${deletedCount}`);
        console.log(`❌ Deletion errors: ${errorCount}`);
        console.log(`📋 Remaining sessions: ${remainingSessions.length}`);
        
        if (remainingSessions.length === 0) {
            console.log('🎉 Database successfully cleared of all test data!');
        } else {
            console.log('⚠️  Some sessions remain in database:');
            remainingSessions.forEach(session => {
                console.log(`  - ${session.id}: ${session.name}`);
            });
        }
        
    } catch (error) {
        console.error('❌ Database cleanup failed:', error.message);
        process.exit(1);
    }
}

// Run the cleanup
clearAllTestData().then(() => {
    console.log('\n✨ Cleanup script completed!');
    process.exit(0);
}).catch(error => {
    console.error('❌ Cleanup script failed:', error);
    process.exit(1);
});
