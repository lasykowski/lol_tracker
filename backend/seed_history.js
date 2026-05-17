const { PrismaClient } = require('@prisma/client');
const riotService = require('./src/services/riotService');

const prisma = new PrismaClient();

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

function fromAbsoluteLp(absLp) {
  if (absLp >= 2800) return { tier: 'MASTER', rank: 'I', lp: absLp - 2800 };
  const tiers = ['IRON', 'BRONZE', 'SILVER', 'GOLD', 'PLATINUM', 'EMERALD', 'DIAMOND'];
  const ranks = ['IV', 'III', 'II', 'I'];
  const tierIdx = Math.floor(absLp / 400);
  const rem = absLp % 400;
  const rankIdx = Math.floor(rem / 100);
  const lp = rem % 100;
  
  if (tierIdx < 0) return { tier: 'IRON', rank: 'IV', lp: 0 };
  return { tier: tiers[tierIdx], rank: ranks[rankIdx], lp };
}

async function run() {
  const players = await prisma.player.findMany();
  
  for (const player of players) {
    console.log(`Processing ${player.riotId}...`);
    
    // Delete all existing snapshots for this player to avoid conflicts
    await prisma.statsSnapshot.deleteMany({ where: { playerId: player.id }});

    // Get current actual LP
    const entries = await riotService.getLeagueEntries(player.puuid);
    const soloQueue = entries.length > 0 ? entries[0] : null;

    if (!soloQueue) {
      console.log(`No solo queue data for ${player.riotId}. Skipping.`);
      continue;
    }

    let currentAbsLp = getAbsoluteLp(soloQueue.tier, soloQueue.rank, soloQueue.leaguePoints);
    let currentWins = soloQueue.wins;
    let currentLosses = soloQueue.losses;

    // Fetch last 15 matches (now filtered to queue=420 by riotService)
    const matchIds = await riotService.getMatchIds(player.puuid, 15);
    
    // We will build an array of history states. The last element is the CURRENT state.
    const historyStates = [];
    historyStates.push({
      absLp: currentAbsLp,
      wins: currentWins,
      losses: currentLosses,
      createdAt: new Date() // Current time for current LP
    });

    // Go backwards in time
    for (const matchId of matchIds) {
      try {
        const detail = await riotService.getMatchDetail(matchId);
        const participant = detail.info.participants.find(p => p.puuid === player.puuid);
        
        if (participant) {
          // If they WON this match, it means BEFORE the match they had LESS LP and LESS WINS
          if (participant.win) {
            currentAbsLp -= 22; // Estimate 22 LP gain
            currentWins -= 1;
          } else {
            // If they LOST this match, BEFORE the match they had MORE LP and LESS LOSSES
            currentAbsLp += 20; // Estimate 20 LP loss
            currentLosses -= 1;
          }
          
          historyStates.unshift({ // Add to beginning of array (older in time)
            absLp: currentAbsLp,
            wins: currentWins,
            losses: currentLosses,
            createdAt: new Date(detail.info.gameCreation)
          });
        }
      } catch (e) {
        console.error(`Error fetching match ${matchId} for ${player.riotId}:`, e.message);
      }
    }

    // Now insert the history states into DB
    for (let i = 0; i < historyStates.length; i++) {
      const state = historyStates[i];
      const parsed = fromAbsoluteLp(state.absLp);
      
      await prisma.statsSnapshot.create({
        data: {
          playerId: player.id,
          tier: parsed.tier,
          rank: parsed.rank,
          lp: parsed.lp,
          wins: state.wins,
          losses: state.losses,
          createdAt: state.createdAt
        }
      });
    }
    console.log(`Inserted ${historyStates.length} historical records for ${player.riotId}`);
  }

  console.log("Done!");
}

run();
