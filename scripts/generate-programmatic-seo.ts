import fs from 'fs';
import path from 'path';
import { MongoClient } from 'mongodb';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://pranay38:h0Qe7YlM43e11x@cluster0.abcde.mongodb.net/pitchside?retryWrites=true&w=majority';
// But since we are local, let's just allow passing it or use a default
const MONGODB_DB = process.env.MONGODB_DB || 'pitchside';

async function generateComparisons() {
  const isDryRun = process.argv.includes('--dry-run');
  console.log(`Starting programmatic SEO generation${isDryRun ? ' (DRY RUN)' : ''}...`);

  if (!process.env.MONGODB_URI) {
    console.warn("MONGODB_URI not found in env, using a fallback or it might fail.");
  }

  const client = new MongoClient(MONGODB_URI);
  let posts: any[] = [];
  try {
    await client.connect();
    const db = client.db(MONGODB_DB);
    posts = await db.collection("posts").find({ isDraft: { $ne: true } }).toArray();
    console.log(`Fetched ${posts.length} published posts from database.`);
  } catch (err) {
    console.error("Error connecting to database:", err);
    process.exit(1);
  } finally {
    await client.close();
  }

  // Extract entities
  const playerNames = new Set<string>();
  const teams = new Set<string>();
  const leagues = new Set<string>(); // maybe we can parse from tags

  posts.forEach(post => {
    if (post.playerName) {
      playerNames.add(post.playerName);
    }
    if (post.club) {
      teams.add(post.club);
    }
    // Simple league extraction from tags if possible, or just default to 5 leagues
  });

  // Let's also read data/players.json for structured player data to find pairs
  const playersFile = path.join(process.cwd(), 'data', 'players.json');
  let playersData: any[] = [];
  if (fs.existsSync(playersFile)) {
    playersData = JSON.parse(fs.readFileSync(playersFile, 'utf8'));
  }

  // Find player pairs from same position
  const playersByPosition: Record<string, any[]> = {};
  playersData.forEach(p => {
    if (p.position) {
      if (!playersByPosition[p.position]) playersByPosition[p.position] = [];
      playersByPosition[p.position].push(p);
    }
  });

  const newComparisons: any[] = [];
  
  // Create player comparisons
  Object.keys(playersByPosition).forEach(pos => {
    const group = playersByPosition[pos];
    for (let i = 0; i < group.length; i++) {
      for (let j = i + 1; j < group.length; j++) {
        // Just take a few pairs to avoid explosion, e.g. top 5 pairs
        if (i < 2 && j < 3) {
          const p1 = group[i];
          const p2 = group[j];
          const slug = `${p1.slug}-vs-${p2.slug}`;
          newComparisons.push({
            id: slug,
            slug: slug,
            type: 'player',
            entity1: p1.name,
            entity2: p2.name,
            entity1Id: p1.slug,
            entity2Id: p2.slug,
            category: pos,
            generated: true
          });
        }
      }
    }
  });

  // Teams pairs from the same league (approximate if we don't have team data)
  // We can just use the players' teams as a proxy
  const teamsByLeague: Record<string, Set<string>> = {};
  playersData.forEach(p => {
    if (p.league && p.team) {
      if (!teamsByLeague[p.league]) teamsByLeague[p.league] = new Set();
      teamsByLeague[p.league].add(p.team);
    }
  });

  Object.keys(teamsByLeague).forEach(league => {
    const leagueTeams = Array.from(teamsByLeague[league]);
    for (let i = 0; i < leagueTeams.length; i++) {
      for (let j = i + 1; j < leagueTeams.length; j++) {
        if (i < 2 && j < 3) {
          const t1 = leagueTeams[i];
          const t2 = leagueTeams[j];
          const slug = `${t1.toLowerCase().replace(/\s+/g, '-')}-vs-${t2.toLowerCase().replace(/\s+/g, '-')}`;
          newComparisons.push({
            id: slug,
            slug: slug,
            type: 'team',
            entity1: t1,
            entity2: t2,
            category: league,
            generated: true
          });
        }
      }
    }
  });

  const comparisonsFile = path.join(process.cwd(), 'data', 'comparisons.json');
  let existingComparisons: any[] = [];
  if (fs.existsSync(comparisonsFile)) {
    try {
      existingComparisons = JSON.parse(fs.readFileSync(comparisonsFile, 'utf8'));
    } catch(e) {
      existingComparisons = [];
    }
  }

  const existingSlugs = new Set(existingComparisons.map((c: any) => c.slug));
  const additions = newComparisons.filter(c => !existingSlugs.has(c.slug));

  console.log(`Found ${additions.length} new comparison pairs to generate.`);
  if (additions.length > 0) {
    console.log("Samples:", additions.slice(0, 3));
  }

  if (isDryRun) {
    console.log("Dry run complete. No files modified.");
  } else {
    if (additions.length > 0) {
      const finalComparisons = [...existingComparisons, ...additions];
      fs.writeFileSync(comparisonsFile, JSON.stringify(finalComparisons, null, 2));
      console.log(`Appended ${additions.length} entries to data/comparisons.json`);
    } else {
      console.log("No new comparisons to append.");
    }
  }
}

run();

async function run() {
  await generateComparisons();
}
