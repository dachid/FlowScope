// Simple Prisma connection test without hanging
const { PrismaClient } = require('./prisma/generated/client');

async function quickTest() {
  const prisma = new PrismaClient({
    log: ['error', 'warn'],
    errorFormat: 'minimal'
  });

  console.log('⏱️  Testing Prisma connection (30s timeout)...');
  
  const timeoutPromise = new Promise((_, reject) => {
    setTimeout(() => reject(new Error('Connection timeout after 30 seconds')), 30000);
  });

  try {
    // Race between connection and timeout
    await Promise.race([
      prisma.$connect(),
      timeoutPromise
    ]);
    
    console.log('✅ Prisma connected successfully');
    
    // Quick query test
    const result = await Promise.race([
      prisma.$queryRaw`SELECT 1 as test`,
      timeoutPromise
    ]);
    
    console.log('✅ Query test successful:', result);
    
  } catch (error) {
    console.error('❌ Connection failed:', error.message);
    console.error('Error type:', error.constructor.name);
  } finally {
    try {
      await prisma.$disconnect();
      console.log('✅ Disconnected cleanly');
    } catch (e) {
      console.log('⚠️  Disconnect error:', e.message);
    }
  }
}

quickTest();
