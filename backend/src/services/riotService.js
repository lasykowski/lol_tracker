const axios = require('axios');
require('dotenv').config();

const RIOT_API_KEY = process.env.RIOT_API_KEY;
const DEFAULT_REGION = process.env.DEFAULT_REGION || 'eun1';
const ROUTING_REGION = process.env.ROUTING_REGION || 'europe';

const api = axios.create({
  headers: {
    'X-Riot-Token': RIOT_API_KEY
  }
});

async function getAccountByRiotId(gameName, tagLine) {
  try {
    const url = `https://${ROUTING_REGION}.api.riotgames.com/riot/account/v1/accounts/by-riot-id/${encodeURIComponent(gameName)}/${encodeURIComponent(tagLine)}`;
    const response = await api.get(url);
    return response.data;
  } catch (error) {
    console.error(`Error fetching account ${gameName}#${tagLine}:`, error.response?.data || error.message);
    throw error;
  }
}

async function getSummonerByPuuid(puuid) {
  try {
    const url = `https://${DEFAULT_REGION}.api.riotgames.com/lol/summoner/v4/summoners/by-puuid/${puuid}`;
    const response = await api.get(url);
    return response.data;
  } catch (error) {
    console.error(`Error fetching summoner for puuid ${puuid}:`, error.response?.data || error.message);
    throw error;
  }
}

async function getLeagueEntries(puuid) {
  try {
    const url = `https://${DEFAULT_REGION}.api.riotgames.com/lol/league/v4/entries/by-puuid/${puuid}`;
    const response = await api.get(url);
    return response.data.filter(entry => entry.queueType === 'RANKED_SOLO_5x5');
  } catch (error) {
    console.error(`Error fetching league entries for ${puuid}:`, error.response?.data || error.message);
    throw error;
  }
}

async function getMatchIds(puuid, count = 5) {
  try {
    const url = `https://${ROUTING_REGION}.api.riotgames.com/lol/match/v5/matches/by-puuid/${puuid}/ids?queue=420&start=0&count=${count}`;
    const response = await api.get(url);
    return response.data;
  } catch (error) {
    console.error(`Error fetching match ids for puuid ${puuid}:`, error.response?.data || error.message);
    throw error;
  }
}

async function getMatchDetail(matchId) {
  try {
    const url = `https://${ROUTING_REGION}.api.riotgames.com/lol/match/v5/matches/${matchId}`;
    const response = await api.get(url);
    return response.data;
  } catch (error) {
    console.error(`Error fetching match detail for ${matchId}:`, error.response?.data || error.message);
    throw error;
  }
}

module.exports = {
  getAccountByRiotId,
  getSummonerByPuuid,
  getLeagueEntries,
  getMatchIds,
  getMatchDetail
};
