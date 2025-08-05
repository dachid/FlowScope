// Test raw PostgreSQL connection without Prisma
const { Client } = require('pg');

async function testRawPostgreSQL() {
  console.log('🔍 Testing Raw PostgreSQL Connection\n');
  
  // Test 1: Direct connection with pg client
  console.log('Test 1: Raw pg client connection (port 5432)');
  
  const client1 = new Client({
    host: 'aws-0-eu-north-1.pooler.supabase.com',
    port: 5432,
    database: 'postgres',
    user: 'postgres.skfvhrqwuocapoopyfkl',
    password: 'FlowScope@4190#',
    ssl: {
      rejectUnauthorized: false
    },
    connectionTimeoutMillis: 30000,
    query_timeout: 30000,
    statement_timeout: 30000,
    idle_in_transaction_session_timeout: 30000
  });

  try {
    console.log('Attempting raw PostgreSQL connection...');
    await client1.connect();
    console.log('✅ Raw PostgreSQL connection successful!');
    
    const result = await client1.query('SELECT version()');
    console.log('✅ Query successful:', result.rows[0].version);
    
  } catch (error) {
    console.log('❌ Raw PostgreSQL connection failed:', error.message);
    console.log('Error code:', error.code);
    console.log('Error details:', error);
  } finally {
    await client1.end();
  }

  console.log('\n' + '='.repeat(50) + '\n');

  // Test 2: Connection pooler port (6543)
  console.log('Test 2: Raw pg client connection (port 6543 - pooler)');
  
  const client2 = new Client({
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
    console.log('Attempting pooler connection...');
    await client2.connect();
    console.log('✅ Pooler connection successful!');
    
    const result = await client2.query('SELECT 1 as test');
    console.log('✅ Pooler query successful:', result.rows[0]);
    
  } catch (error) {
    console.log('❌ Pooler connection failed:', error.message);
    console.log('Error code:', error.code);
  } finally {
    await client2.end();
  }

  console.log('\n' + '='.repeat(50) + '\n');

  // Test 3: Using connection string format
  console.log('Test 3: Connection string format test');
  
  const connectionString = 'postgresql://postgres.skfvhrqwuocapoopyfkl:FlowScope%404190%23@aws-0-eu-north-1.pooler.supabase.com:5432/postgres?sslmode=require';
  console.log('Connection string (masked):', connectionString.replace(/:[^:@]*@/, ':***@'));
  
  const client3 = new Client({
    connectionString: connectionString,
    connectionTimeoutMillis: 30000
  });

  try {
    console.log('Attempting connection string format...');
    await client3.connect();
    console.log('✅ Connection string format successful!');
    
    const result = await client3.query('SELECT current_database(), current_user');
    console.log('✅ Database info:', result.rows[0]);
    
  } catch (error) {
    console.log('❌ Connection string format failed:', error.message);
    console.log('Error code:', error.code);
  } finally {
    await client3.end();
  }

  console.log('\n🏁 Raw PostgreSQL testing complete');
}

// Check if pg is available
try {
  require('pg');
  testRawPostgreSQL().catch(console.error);
} catch (error) {
  console.log('❌ pg module not found. Installing...');
  console.log('Run: npm install pg');
  console.log('Then rerun this test');
}
