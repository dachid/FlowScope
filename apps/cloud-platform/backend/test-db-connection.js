// Test Supabase connection using both Supabase client and Prisma
const { createClient } = require('@supabase/supabase-js');

async function testSupabaseClient() {
  console.log('🔍 Testing Supabase client connection...');
  
  const supabaseUrl = 'https://skfvhrqwuocapoopyfkl.supabase.co';
  const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNrZnZocnF3dW9jYXBvb3B5ZmtsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQzMDA5MzMsImV4cCI6MjA2OTg3NjkzM30.at44bpxeI3Pj5AkVBIbDa3AODZsmpHsSf3o_FvjJxyk';
  
  try {
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Test basic connection with a simple query using RPC or raw SQL
    const { data, error } = await supabase.rpc('get_tables', {});
    
    if (error) {
      // Try a different approach - use raw SQL query
      console.log('RPC failed, trying raw SQL query...');
      const { data: sqlData, error: sqlError } = await supabase
        .rpc('sql', { 
          query: 'SELECT table_name FROM information_schema.tables WHERE table_schema = \'public\' LIMIT 5' 
        });
      
      if (sqlError) {
        // Try a very basic connection test
        console.log('Raw SQL failed, trying basic health check...');
        const response = await fetch(`${supabaseUrl}/rest/v1/`, {
          headers: {
            'apikey': supabaseKey,
            'Authorization': `Bearer ${supabaseKey}`
          }
        });
        
        if (response.ok) {
          console.log('✅ Supabase REST API is accessible');
          console.log('📡 API Status:', response.status);
          return true;
        } else {
          console.error('❌ Supabase REST API error:', response.status, response.statusText);
          return false;
        }
      } else {
        console.log('✅ Supabase client connected successfully via raw SQL');
        console.log('📋 SQL Query result:', sqlData);
        return true;
      }
    } else {
      console.log('✅ Supabase client connected successfully via RPC');
      console.log('📋 Available tables:', data);
      return true;
    }
    
  } catch (error) {
    console.error('❌ Supabase client connection failed:', error.message);
    return false;
  }
}

async function testPrismaConnection() {
  console.log('\n🔍 Testing Prisma connection...');
  
  const { PrismaClient } = require('./prisma/generated/client');
  const prisma = new PrismaClient({
    log: ['error'],
  });

  try {
    // Test basic connection
    await prisma.$connect();
    console.log('✅ Prisma connected to Supabase PostgreSQL');
    
    // Test a simple query
    const result = await prisma.$queryRaw`SELECT version()`;
    console.log('✅ Database version:', result[0]?.version);
    
    // Test if our tables exist
    const tables = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `;
    console.log('✅ Existing tables:', tables.map(t => t.table_name));
    return true;
    
  } catch (error) {
    console.error('❌ Prisma connection failed:', error.message);
    return false;
  } finally {
    await prisma.$disconnect();
  }
}

async function runTests() {
  console.log('🚀 Starting Supabase connection tests...\n');
  
  const supabaseSuccess = await testSupabaseClient();
  const prismaSuccess = await testPrismaConnection();
  
  console.log('\n📊 Test Results:');
  console.log(`Supabase Client: ${supabaseSuccess ? '✅ Success' : '❌ Failed'}`);
  console.log(`Prisma Client: ${prismaSuccess ? '✅ Success' : '❌ Failed'}`);
  
  if (supabaseSuccess && !prismaSuccess) {
    console.log('\n💡 Recommendation: Supabase client works, but Prisma has connection issues.');
    console.log('   This might be due to SSL/TLS requirements or connection string format.');
  }
}

runTests();
