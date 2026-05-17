const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function run() {
  const p = await prisma.player.findFirst({ where: { riotId: 'KarthusTherapy' }});
  const snap = await prisma.statsSnapshot.findMany({ where: { playerId: p.id }, orderBy: { createdAt: 'desc' }, take: 2 });
  console.log(snap);
}
run();
