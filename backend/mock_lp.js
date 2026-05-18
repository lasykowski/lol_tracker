const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function run() {
  const matches = await prisma.matchHistory.findMany({ take: 20, orderBy: { createdAt: 'desc' } });
  for (let m of matches) {
    const val = m.win ? Math.floor(Math.random() * 10 + 15) : -Math.floor(Math.random() * 10 + 15);
    await prisma.matchHistory.update({ where: { id: m.id }, data: { lpChange: val } });
    console.log(`Updated ${m.id} to ${val}`);
  }
}
run();
