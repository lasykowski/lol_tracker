const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function clear() {
  // First delete dependent records
  await prisma.matchHistory.deleteMany();
  await prisma.statsSnapshot.deleteMany();
  // Then delete all players
  await prisma.player.deleteMany();
  console.log('Deleted all database data');
}
clear().catch(console.error).finally(() => prisma.$disconnect());
