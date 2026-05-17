const { getAccountByRiotId, getLeagueEntries } = require('./src/services/riotService');

async function test() {
  try {
    const acc = await getAccountByRiotId('KarthusTherapy', 'cwl');
    console.log('Account:', acc);
    const entries = await getLeagueEntries(acc.puuid);
    console.log('League Entries:', entries);
  } catch (e) {
    console.error(e);
  }
}
test();
