const { PrismaClient } = require('@prisma/client');

async function main() {
  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: 'file:./dev.db'
      }
    }
  });

  try {
    console.log('🔍 Checking sessions in database...');
    
    const sessions = await prisma.session.findMany({
      select: {
        id: true,
        name: true,
        startTime: true,
        status: true,
        createdAt: true
      },
      orderBy: {
        createdAt: 'asc'
      }
    });

    console.log(`\n📊 Found ${sessions.length} sessions in database:`);
    
    const sessionGroups = {};
    sessions.forEach(session => {
      const name = session.name || 'Unnamed';
      if (!sessionGroups[name]) {
        sessionGroups[name] = [];
      }
      sessionGroups[name].push(session);
    });

    for (const [name, sessionList] of Object.entries(sessionGroups)) {
      console.log(`\n🏷️  "${name}": ${sessionList.length} instances`);
      sessionList.forEach((session, index) => {
        console.log(`   ${index + 1}. ID: ${session.id} | Created: ${session.createdAt} | Status: ${session.status}`);
      });
    }

    console.log('\n🧹 Need to clean up duplicates...');
    
  } catch (error) {
    console.error('❌ Error checking sessions:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
