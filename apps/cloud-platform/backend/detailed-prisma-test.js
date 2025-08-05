// Detailed Prisma connection troubleshooting
const { PrismaClient } = require('./prisma/generated/client');

async function detailedConnectionTest() {
  console.log('🔍 Detailed Prisma Connection Troubleshooting\n');
  
  // Test 1: Basic connection with verbose logging
  console.log('Test 1: Basic connection with verbose logging');
  const prisma1 = new PrismaClient({
    log: [
      { emit: 'stdout', level: 'query' },
      { emit: 'stdout', level: 'info' },
      { emit: 'stdout', level: 'warn' },
      { emit: 'stdout', level: 'error' },
    ],
    errorFormat: 'pretty'
  });

  try {
    console.log('Attempting to connect...');
    await prisma1.$connect();
    console.log('✅ Basic connection successful');
  } catch (error) {
    console.log('❌ Basic connection failed:', error.message);
    console.log('Full error:', error);
  } finally {
    await prisma1.$disconnect();
  }

  console.log('\n' + '='.repeat(50) + '\n');

  // Test 2: Try different connection timeout
  console.log('Test 2: Connection with custom timeout');
  
  // Let's manually construct the connection string with timeout
  const customUrl = process.env.DATABASE_URL + '&connect_timeout=30&application_name=flowscope_test';
  console.log('Custom URL (masked):', customUrl.replace(/:[^:@]*@/, ':***@'));
  
  const prisma2 = new PrismaClient({
    datasources: {
      db: {
        url: customUrl
      }
    },
    log: ['error']
  });

  try {
    await prisma2.$connect();
    console.log('✅ Custom timeout connection successful');
  } catch (error) {
    console.log('❌ Custom timeout connection failed:', error.message);
  } finally {
    await prisma2.$disconnect();
  }

  console.log('\n' + '='.repeat(50) + '\n');

  // Test 3: Try the pooler port specifically
  console.log('Test 3: Testing pooler port (6543) with pgbouncer');
  
  const poolerUrl = process.env.DATABASE_URL.replace(':5432/', ':6543/') + '&pgbouncer=true';
  console.log('Pooler URL (masked):', poolerUrl.replace(/:[^:@]*@/, ':***@'));
  
  const prisma3 = new PrismaClient({
    datasources: {
      db: {
        url: poolerUrl
      }
    },
    log: ['error']
  });

  try {
    await prisma3.$connect();
    console.log('✅ Pooler connection successful');
  } catch (error) {
    console.log('❌ Pooler connection failed:', error.message);
  } finally {
    await prisma3.$disconnect();
  }

  console.log('\n' + '='.repeat(50) + '\n');

  // Test 4: Try without SSL
  console.log('Test 4: Testing without SSL requirement');
  
  const noSslUrl = process.env.DATABASE_URL.replace('sslmode=require', 'sslmode=prefer');
  console.log('No SSL URL (masked):', noSslUrl.replace(/:[^:@]*@/, ':***@'));
  
  const prisma4 = new PrismaClient({
    datasources: {
      db: {
        url: noSslUrl
      }
    },
    log: ['error']
  });

  try {
    await prisma4.$connect();
    console.log('✅ No SSL connection successful');
  } catch (error) {
    console.log('❌ No SSL connection failed:', error.message);
  } finally {
    await prisma4.$disconnect();
  }

  console.log('\n🏁 Troubleshooting complete');
}

detailedConnectionTest().catch(console.error);
