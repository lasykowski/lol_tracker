const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
prisma.player.findMany({ include: { matches: { take: 1 } } })
  .then(r => { console.log('First match:', JSON.stringify(r[0]?.matches?.[0], null, 2)); })
  .catch(e => console.error('Error:', e.message))
  .finally(() => { prisma.$disconnect(); });
