const cron = require('node-cron');
const { PrismaClient } = require('@prisma/client');
const riotService = require('../services/riotService');

const prisma = new PrismaClient();

const PLAYERS_TO_TRACK = [
  { riotId: 'cosspeciales1', tagline: 'EUW' },
  { riotId: 'crisus22', tagline: 'EUW' },
  { riotId: 'RGB AGD ADHD', tagline: 'HDR' },
  { riotId: 'petersqy x', tagline: 'EUW' },
  { riotId: 'Paul Kellerman', tagline: 'scyla' },
  { riotId: 'Mateusz Gotówa', tagline: 'cash' }
];

function getAbsoluteLp(tier, rank, lp) {
  const tiers = {
    'IRON': 0, 'BRONZE': 400, 'SILVER': 800, 'GOLD': 1200,
    'PLATINUM': 1600, 'EMERALD': 2000, 'DIAMOND': 2400,
    'MASTER': 2800, 'GRANDMASTER': 2800, 'CHALLENGER': 2800,
    'UNRANKED': 0
  };
  const ranks = { 'IV': 0, 'III': 100, 'II': 200, 'I': 300, '': 0 };

  const base = tiers[tier] || 0;
  if (['MASTER', 'GRANDMASTER', 'CHALLENGER'].includes(tier)) {
    return base + lp;
  }
  const r = ranks[rank] || 0;
  return base + r + lp;
}

async function initializePlayers() {
  console.log('Initializing players...');
  for (const p of PLAYERS_TO_TRACK) {
    let player = await prisma.player.findFirst({
      where: { riotId: p.riotId, tagline: p.tagline }
    });

    if (!player) {
      try {
        console.log(`Fetching account for ${p.riotId}#${p.tagline}...`);
        const account = await riotService.getAccountByRiotId(p.riotId, p.tagline);
        console.log(`Creating player for puuid ${account.puuid}...`);
        player = await prisma.player.create({
          data: {
            riotId: account.gameName || p.riotId,
            tagline: account.tagLine || p.tagline,
            puuid: account.puuid
          }
        });
        console.log(`Player ${player.riotId} added to database.`);
      } catch (error) {
        console.error(`Failed to initialize player ${p.riotId}:`, error.message);
      }
    }
  }
}

async function updatePlayerStats() {
  console.log('Running player stats update...');
  const players = await prisma.player.findMany();

  for (const player of players) {
    try {
      // 1. Update League Entries (LP, Tier, Rank)
      const entries = await riotService.getLeagueEntries(player.puuid);
      const soloQueue = entries.length > 0 ? entries[0] : null;

      let currentLp = 0;
      let currentTier = 'UNRANKED';
      let currentRank = '';
      let wins = 0;
      let losses = 0;

      if (soloQueue) {
        currentLp = soloQueue.leaguePoints;
        currentTier = soloQueue.tier;
        currentRank = soloQueue.rank;
        wins = soloQueue.wins;
        losses = soloQueue.losses;
      }

      // Check last snapshot to see if LP/Games changed before creating a new snapshot
      const lastSnapshot = await prisma.statsSnapshot.findFirst({
        where: { playerId: player.id },
        orderBy: { createdAt: 'desc' }
      });

      if (
        !lastSnapshot || 
        lastSnapshot.lp !== currentLp || 
        lastSnapshot.wins !== wins || 
        lastSnapshot.losses !== losses
      ) {
        await prisma.statsSnapshot.create({
          data: {
            playerId: player.id,
            tier: currentTier,
            rank: currentRank,
            lp: currentLp,
            wins,
            losses
          }
        });
        console.log(`Updated snapshot for ${player.riotId}: ${currentTier} ${currentRank} ${currentLp} LP`);
      }

      // 2. Fetch Match History - ONLY Ranked Solo/Duo (queue=420)
      const matchIds = await riotService.getMatchIds(player.puuid, 10);
      for (const matchId of matchIds) {
        const existingMatch = await prisma.matchHistory.findUnique({
          where: {
            playerId_matchId: {
              playerId: player.id,
              matchId: matchId
            }
          }
        });

        if (!existingMatch) {
          const detail = await riotService.getMatchDetail(matchId);
          // Skip non-ranked matches (queueId 420 = Ranked Solo/Duo)
          if (detail.info.queueId !== 420) {
            continue;
          }
          // Find player's participant data
          const participant = detail.info.participants.find(p => p.puuid === player.puuid);
          
          if (participant) {
            // gameEndedInEarlySurrender = remake (all participants surrendered before 3 min)
            const isRemake = participant.gameEndedInEarlySurrender === true;
            // Calculate lpChange
            let lpChange = null;
            if (lastSnapshot && lastSnapshot.tier !== 'UNRANKED' && currentTier !== 'UNRANKED') {
              const prevAbsolute = getAbsoluteLp(lastSnapshot.tier, lastSnapshot.rank, lastSnapshot.lp);
              const currAbsolute = getAbsoluteLp(currentTier, currentRank, currentLp);
              lpChange = currAbsolute - prevAbsolute;
            }

            await prisma.matchHistory.create({
              data: {
                playerId: player.id,
                matchId: matchId,
                championId: participant.championId,
                championName: participant.championName,
                kills: participant.kills,
                deaths: participant.deaths,
                assists: participant.assists,
                win: participant.win,
                lpChange: lpChange,
                remake: isRemake
              }
            });
            console.log(`Inserted match ${matchId} for ${player.riotId}`);
          }
        }
      }
    } catch (error) {
      console.error(`Error updating stats for ${player.riotId}:`, error.message);
    }
  }
  console.log('Update finished.');
}

function startCron() {
  // Initialize players on startup
  initializePlayers().then(() => {
    // Run an initial update
    updatePlayerStats();
  });

  // Schedule task to run every 15 seconds
  cron.schedule('*/15 * * * * *', () => {
    updatePlayerStats();
  });
}

module.exports = { startCron, updatePlayerStats };
