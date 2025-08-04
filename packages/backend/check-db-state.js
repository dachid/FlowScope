// Check current database state before pushing schema
const { PrismaClient } = require('./prisma/generated/client');

async function checkDatabaseState() {
  const prisma = new PrismaClient({
    log: ['error', 'warn']
  });

  try {
    console.log('🔍 Checking current database state...\n');
    
    // Check existing tables
    const tables = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `;
    
    console.log('📋 Existing tables:');
    if (tables.length === 0) {
      console.log('   (No tables found - fresh database)');
    } else {
      tables.forEach(table => console.log(`   - ${table.table_name}`));
    }
    
    // Check for any existing FlowScope tables
    const flowscopeTables = tables.filter(t => 
      ['User', 'Session', 'TraceData', 'Bookmark', 'SharedLink', 'UserPreferences', 'Comment', 'Annotation']
        .some(name => t.table_name.toLowerCase().includes(name.toLowerCase()))
    );
    
    console.log('\n🎯 FlowScope-related tables:');
    if (flowscopeTables.length === 0) {
      console.log('   (No FlowScope tables found - safe to push schema)');
    } else {
      flowscopeTables.forEach(table => console.log(`   - ${table.table_name}`));
    }
    
    // Check if we can connect with current schema
    console.log('\n🔗 Testing current Prisma client...');
    try {
      // This will fail if schema doesn't match database
      const sessionCount = await prisma.session.count();
      console.log(`   ✅ Session table accessible (${sessionCount} records)`);
    } catch (error) {
      console.log(`   ❌ Schema mismatch detected: ${error.message}`);
      console.log('   📝 This explains why db push might hang - schema needs to be updated');
    }
    
  } catch (error) {
    console.error('❌ Database check failed:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkDatabaseState();
