// Test manual table creation to bypass Prisma db push issues
const { Client } = require('pg');
const fs = require('fs');

async function createBasicSchema() {
  console.log('🛠️  Creating basic schema manually...\n');
  
  const client = new Client({
    host: 'aws-0-eu-north-1.pooler.supabase.com',
    port: 6543,
    database: 'postgres',
    user: 'postgres.skfvhrqwuocapoopyfkl',
    password: 'FlowScope@4190#',
    ssl: {
      rejectUnauthorized: false
    },
    connectionTimeoutMillis: 30000
  });

  try {
    await client.connect();
    console.log('✅ Connected to database');
    
    // Read and execute the SQL file
    const sql = fs.readFileSync('./create-basic-schema.sql', 'utf8');
    console.log('📄 Executing SQL script...');
    
    const result = await client.query(sql);
    console.log('✅ SQL executed successfully:', result.rows);
    
    // Verify tables were created
    console.log('\n🔍 Verifying table creation...');
    const tables = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);
    
    console.log('📋 Tables in database:');
    tables.rows.forEach(row => console.log(`   - ${row.table_name}`));
    
  } catch (error) {
    console.error('❌ Schema creation failed:', error.message);
    console.error('Full error:', error);
  } finally {
    await client.end();
  }
}

createBasicSchema();
