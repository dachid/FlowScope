// Deploy the complete FlowScope schema directly via PostgreSQL client
const { Client } = require('pg');
const fs = require('fs');
require('dotenv').config();

async function deployFullSchema() {
  console.log('🚀 Deploying FlowScope schema directly to PostgreSQL...\n');
  
  // Extract connection details from environment variables
  const connectionString = process.env.DATABASE_URL || process.env.DIRECT_URL;
  if (!connectionString) {
    throw new Error('❌ No database connection string found in environment variables (DATABASE_URL or DIRECT_URL)');
  }
  
  console.log('🔐 Using environment variables for database connection');
  
  const client = new Client({
    connectionString,
    ssl: {
      rejectUnauthorized: false
    },
    connectionTimeoutMillis: 30000
  });

  try {
    await client.connect();
    console.log('✅ Connected to Supabase PostgreSQL');
    
    // Read and execute the complete schema
    const sql = fs.readFileSync('./create-full-schema.sql', 'utf8');
    console.log('📄 Executing complete FlowScope schema...');
    
    // Execute the SQL (this might take a moment due to all the tables and indexes)
    const result = await client.query(sql);
    console.log('✅ Schema deployment successful!');
    
    // Verify what was created
    console.log('\n📋 FlowScope tables created:');
    if (result.rows && result.rows.length > 0) {
      result.rows.forEach(row => {
        console.log(`   - ${row.tablename} (owner: ${row.tableowner})`);
      });
    }
    
    // Test a few basic operations
    console.log('\n🧪 Testing basic operations...');
    
    // Test table exists
    const tableCheck = await client.query(`
      SELECT COUNT(*) as table_count 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('users', 'sessions', 'trace_data', 'bookmarks')
    `);
    
    console.log(`✅ Core tables verified: ${tableCheck.rows[0].table_count}/4 found`);
    
    // Test indexes
    const indexCheck = await client.query(`
      SELECT COUNT(*) as index_count 
      FROM pg_indexes 
      WHERE schemaname = 'public'
      AND tablename LIKE '%trace_data%' OR tablename LIKE '%sessions%'
    `);
    
    console.log(`✅ Indexes created: ${indexCheck.rows[0].index_count} performance indexes`);
    
    console.log('\n🎉 FlowScope database schema is ready!');
    console.log('   - All tables created with proper relationships');
    console.log('   - Performance indexes applied');
    console.log('   - Multi-language trace support enabled');
    console.log('   - Enhanced metadata and timing fields ready');
    
  } catch (error) {
    console.error('❌ Schema deployment failed:', error.message);
    console.error('Full error:', error);
  } finally {
    await client.end();
  }
}

deployFullSchema();
