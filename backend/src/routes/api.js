const express = require('express');
const { PrismaClient } = require('@prisma/client');
const router = express.Router();

const prisma = new PrismaClient();

// GET /api/leaderboard - returns 4 players sorted by rank and LP
router.get('/leaderboard', async (req, res) => {
  try {
    const players = await prisma.player.findMany({
      include: {
        snapshots: {
          orderBy: { createdAt: 'desc' },
          take: 1
        }
      }
    });

    const leaderboard = players.map(p => {
      const currentStats = p.snapshots.length > 0 ? p.snapshots[0] : null;
      return {
        id: p.id,
        riotId: p.riotId,
        tagline: p.tagline,
        tier: currentStats?.tier || 'UNRANKED',
        rank: currentStats?.rank || '',
        lp: currentStats?.lp || 0,
        wins: currentStats?.wins || 0,
        losses: currentStats?.losses || 0,
      };
    });

    // Helper to sort by tier/rank/lp (very simplified)
    const tierValues = {
      'CHALLENGER': 10, 'GRANDMASTER': 9, 'MASTER': 8, 'DIAMOND': 7,
      'EMERALD': 6, 'PLATINUM': 5, 'GOLD': 4, 'SILVER': 3, 'BRONZE': 2, 'IRON': 1, 'UNRANKED': 0
    };
    const rankValues = { 'I': 4, 'II': 3, 'III': 2, 'IV': 1, '': 0 };

    leaderboard.sort((a, b) => {
      const aTier = tierValues[a.tier] || 0;
      const bTier = tierValues[b.tier] || 0;
      if (aTier !== bTier) return bTier - aTier;

      const aRank = rankValues[a.rank] || 0;
      const bRank = rankValues[b.rank] || 0;
      if (aRank !== bRank) return bRank - aRank;

      return b.lp - a.lp;
    });

    res.json(leaderboard);
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/player/:id/history - returns history of LP changes
router.get('/player/:id/history', async (req, res) => {
  try {
    const playerId = parseInt(req.params.id, 10);
    const history = await prisma.statsSnapshot.findMany({
      where: { playerId },
      orderBy: { createdAt: 'asc' }
    });

    res.json(history);
  } catch (error) {
    console.error('Error fetching player history:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/stats/otp - stats for specific OTPs for each player
router.get('/stats/otp', async (req, res) => {
  try {
    const OTP_MAPPING = {
      "RGB AGD ADHD#HDR": { champId: 68, champName: "Rumble" },
      "crisus22#EUW": { champId: 76, champName: "Nidalee" },
      "RobertoCatetas#123": { champId: 154, champName: "Zac" },
      "cosspeciales1#EUW": { champId: 246, champName: "Qiyana" }
    };
    
    const players = await prisma.player.findMany();
    const results = [];

    for (const player of players) {
      const riotIdTag = `${player.riotId}#${player.tagline}`;
      const otpInfo = OTP_MAPPING[riotIdTag];
      
      if (!otpInfo) continue;

      const matches = await prisma.matchHistory.findMany({
        where: { 
          playerId: player.id,
          championId: otpInfo.champId
        }
      });

      let kills = 0, deaths = 0, assists = 0, wins = 0;
      matches.forEach(m => {
        kills += m.kills;
        deaths += m.deaths;
        assists += m.assists;
        if (m.win) wins += 1;
      });

      const games = matches.length;
      results.push({
        player: riotIdTag,
        riotId: player.riotId,
        champName: otpInfo.champName,
        games,
        winrate: games > 0 ? Math.round(wins / games * 100) : 0,
        kda: games > 0 ? (deaths > 0 ? ((kills + assists) / deaths).toFixed(2) : (kills + assists).toFixed(2)) : '0.00',
        wins,
        losses: games - wins
      });
    }

    res.json(results);
  } catch (error) {
    console.error('Error fetching mains stats:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/players/race-track - current rank + last 10 match champions per player
router.get('/players/race-track', async (req, res) => {
  try {
    const players = await prisma.player.findMany({
      include: {
        snapshots: {
          orderBy: { createdAt: 'desc' },
          take: 1
        },
        matches: {
          orderBy: { createdAt: 'desc' },
          take: 10
        }
      }
    });

    const result = players.map(p => {
      const snap = p.snapshots[0] || null;
      return {
        id: p.id,
        riotId: p.riotId,
        tagline: p.tagline,
        tier: snap?.tier || 'UNRANKED',
        rank: snap?.rank || '',
        lp: snap?.lp || 0,
        wins: snap?.wins || 0,
        losses: snap?.losses || 0,
        recentChampions: (p.matches || []).map(m => ({
          championName: m.championName,
          win: m.win
        }))
      };
    });

    // Sort by rank
    const tierValues = {
      'CHALLENGER': 10, 'GRANDMASTER': 9, 'MASTER': 8, 'DIAMOND': 7,
      'EMERALD': 6, 'PLATINUM': 5, 'GOLD': 4, 'SILVER': 3, 'BRONZE': 2, 'IRON': 1, 'UNRANKED': 0
    };
    const rankValues = { 'I': 4, 'II': 3, 'III': 2, 'IV': 1, '': 0 };
    result.sort((a, b) => {
      const aTier = tierValues[a.tier] || 0;
      const bTier = tierValues[b.tier] || 0;
      if (aTier !== bTier) return bTier - aTier;
      const aRank = rankValues[a.rank] || 0;
      const bRank = rankValues[b.rank] || 0;
      if (aRank !== bRank) return bRank - aRank;
      return b.lp - a.lp;
    });

    res.json(result);
  } catch (error) {
    console.error('Error fetching race track data:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Helper function to calculate absolute LP
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

// GET /api/players/history-all - returns history for all players for chart
router.get('/players/history-all', async (req, res) => {
  try {
    const players = await prisma.player.findMany({
      include: {
        snapshots: {
          orderBy: { createdAt: 'asc' }
        }
      }
    });

    const now = Date.now();
    const sevenDaysAgo = new Date(now - 7 * 24 * 60 * 60 * 1000);

    const allDates = new Set();
    players.forEach(p => {
      p.snapshots.forEach(s => {
        const d = new Date(s.createdAt);
        if (d >= sevenDaysAgo) {
          allDates.add(d.toISOString());
        }
      });
    });

    // If no data in the last 7 days, fallback to empty or handle it safely
    if (allDates.size === 0) {
      return res.json([]);
    }

    const sortedDates = Array.from(allDates).sort();
    
    const chartData = sortedDates.map(dateStr => {
      const point = { date: dateStr };
      players.forEach(p => {
        // Find the last snapshot exactly at or before this date
        const validSnapshots = p.snapshots.filter(s => new Date(s.createdAt) <= new Date(dateStr));
        const lastValid = validSnapshots.length > 0 ? validSnapshots[validSnapshots.length - 1] : null;
        point[p.riotId] = lastValid ? getAbsoluteLp(lastValid.tier, lastValid.rank, lastValid.lp) : null;
      });
      return point;
    });

    res.json(chartData);
  } catch (error) {
    console.error('Error fetching all history:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
