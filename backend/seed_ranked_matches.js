const { PrismaClient } = require('@prisma/client');
const riotService = require('./src/services/riotService');
const prisma = new PrismaClient();

async function run() {
  const players = await prisma.player.findMany();

  for (const player of players) {
    // Delete all existing match history
    await prisma.matchHistory.deleteMany({ where: { playerId: player.id } });
    console.log(`Cleared matches for ${player.riotId}`);

    // Get last 20 ranked-only match IDs (queue=420 in URL)
    const matchIds = await riotService.getMatchIds(player.puuid, 20);
    let inserted = 0;
    
    for (const matchId of matchIds) {
      try {
        const detail = await riotService.getMatchDetail(matchId);
        
        // Hard filter - only Solo/Duo queue
        if (detail.info.queueId !== 420) {
          console.log(`  SKIP non-ranked queueId=${detail.info.queueId} ${matchId}`);
          continue;
        }

        const participant = detail.info.participants.find(p => p.puuid === player.puuid);
        if (!participant) continue;

        await prisma.matchHistory.create({
          data: {
            playerId: player.id,
            matchId,
            championId: participant.championId,
            championName: participant.championName,
            kills: participant.kills,
            deaths: participant.deaths,
            assists: participant.assists,
            win: participant.win
          }
        });

        const wl = participant.win ? 'W' : 'L';
        console.log(`  [${wl}] ${participant.championName}`);
        inserted++;

        // Stop after 10 ranked matches
        if (inserted >= 10) break;
      } catch (e) {
        console.error(`  Error on ${matchId}:`, e.message);
      }
    }
    console.log(`  => ${inserted} ranked matches for ${player.riotId}\n`);
  }

  await prisma.$disconnect();
  console.log('Done!');
}

run();
