import type { VercelRequest, VercelResponse } from "@vercel/node";
import { applyCors, checkRateLimit, requireAuth } from "../utils/security";
import { connectToDatabase } from "../_db";

const FIXTURES_COLLECTION = "predictions_fixtures";
const PICKS_COLLECTION = "predictions_user_picks";
const LEADERBOARD_COLLECTION = "predictions_leaderboard"; // tracks aggregate score

export default async function handler(req: VercelRequest, res: VercelResponse) {
    applyCors(req, res);
    if (!checkRateLimit(req, res)) return;

    if (req.method === "OPTIONS") return res.status(200).end();

    try {
        const { db } = await connectToDatabase();
        const fixturesCol = db.collection(FIXTURES_COLLECTION);
        const picksCol = db.collection(PICKS_COLLECTION);
        const leaderCol = db.collection(LEADERBOARD_COLLECTION);

        // ─── GET: Fetch active fixtures & leaderboard ───
        if (req.method === "GET") {
            const userId = req.query.userId as string;

            // Get all upcoming or live fixtures for the active gameweek
            let activeGameweek = await fixturesCol.findOne({ status: { $in: ["upcoming", "live"] } }, { sort: { gameweek: -1 } });
            
            // Auto-seed for MVP demonstration if empty
            if (!activeGameweek) {
                const dummyFixtures = [
                    { gameweek: 1, homeTeam: "Arsenal", awayTeam: "Liverpool", matchDate: new Date(Date.now() + 86400000).toISOString(), status: "upcoming", actualHomeScore: null, actualAwayScore: null },
                    { gameweek: 1, homeTeam: "Man City", awayTeam: "Chelsea", matchDate: new Date(Date.now() + 172800000).toISOString(), status: "upcoming", actualHomeScore: null, actualAwayScore: null },
                    { gameweek: 1, homeTeam: "Real Madrid", awayTeam: "Barcelona", matchDate: new Date(Date.now() + 259200000).toISOString(), status: "upcoming", actualHomeScore: null, actualAwayScore: null },
                ];
                await fixturesCol.insertMany(dummyFixtures);
                activeGameweek = await fixturesCol.findOne({ status: { $in: ["upcoming", "live"] } }, { sort: { gameweek: -1 } });
            }

            const fixtures = activeGameweek 
                ? await fixturesCol.find({ gameweek: activeGameweek.gameweek }).toArray()
                : [];

            let userPicks: any[] = [];
            if (userId) {
                userPicks = await picksCol.find({ userId, fixtureId: { $in: fixtures.map(f => String(f._id)) } }).toArray();
            }

            // Get Top 10 Leaderboard
            const leaderboard = await leaderCol.find({}).sort({ totalPoints: -1 }).limit(10).toArray();

            return res.status(200).json({ 
                gameweek: activeGameweek?.gameweek || null,
                fixtures, 
                userPicks,
                leaderboard 
            });
        }

        // ─── POST: Submit User Picks ───
        if (req.method === "POST") {
            const { userId, username, picks } = req.body;
            if (!userId || !username || !Array.isArray(picks)) {
                return res.status(400).json({ error: "Invalid picks data" });
            }

            // Upsert each pick
            const bulkOps = picks.map((p: any) => ({
                updateOne: {
                    filter: { userId, fixtureId: p.fixtureId },
                    update: { $set: { 
                        userId, 
                        username, 
                        fixtureId: p.fixtureId, 
                        homeScore: p.homeScore, 
                        awayScore: p.awayScore,
                        pointsEarned: 0 // Will be evaluated later when fixture completes
                    } },
                    upsert: true
                }
            }));

            if (bulkOps.length > 0) {
                await picksCol.bulkWrite(bulkOps);
            }

            // Ensure user exists in leaderboard (even with 0 points initially)
            await leaderCol.updateOne(
                { userId },
                { $setOnInsert: { userId, username: username, totalPoints: 0 } },
                { upsert: true }
            );

            return res.status(200).json({ success: true });
        }

        // ─── PUT: Admin configures fixtures or sets results ───
        if (req.method === "PUT") {
            if (!(await requireAuth(req, res))) return;

            const { action, fixtures, fixtureId, actualHomeScore, actualAwayScore } = req.body;

            // Seed new fixtures bulk
            if (action === "create_fixtures" && Array.isArray(fixtures)) {
                if (fixtures.length === 0) return res.status(400).json({ error: "No fixtures provided" });
                
                // Expect fixtures: { gameweek, homeTeam, awayTeam, matchDate }
                const formatted = fixtures.map(f => ({
                    ...f,
                    status: "upcoming",
                    actualHomeScore: null,
                    actualAwayScore: null
                }));
                
                await fixturesCol.insertMany(formatted);
                return res.status(200).json({ success: true, message: "Fixtures created" });
            }

            // Update single fixture with result & calculate points
            if (action === "set_result" && fixtureId) {
                if (actualHomeScore == null || actualAwayScore == null) {
                    return res.status(400).json({ error: "Missing scores" });
                }

                // Update fixture
                await fixturesCol.updateOne(
                    { _id: fixtureId },
                    { $set: { status: "completed", actualHomeScore, actualAwayScore } }
                );

                // Calculate points for all user picks on this fixture
                const picks = await picksCol.find({ fixtureId }).toArray();
                
                const pointUpdates = picks.map(pick => {
                    let points = 0;
                    
                    // Exact score
                    if (pick.homeScore === actualHomeScore && pick.awayScore === actualAwayScore) {
                        points = 3;
                    } 
                    // Correct result (home win, away win, or draw)
                    else {
                        const actualDiff = actualHomeScore - actualAwayScore;
                        const pickDiff = pick.homeScore - pick.awayScore;
                        
                        if ((actualDiff > 0 && pickDiff > 0) || 
                            (actualDiff < 0 && pickDiff < 0) || 
                            (actualDiff === 0 && pickDiff === 0)) {
                            points = 1;
                        }
                    }

                    return {
                        userId: pick.userId,
                        updateOne: {
                            filter: { _id: pick._id },
                            update: { $set: { pointsEarned: points } }
                        }
                    };
                });

                if (pointUpdates.length > 0) {
                    await picksCol.bulkWrite(pointUpdates.map(p => ({ updateOne: p.updateOne })));

                    // Aggregate new leaderboard scores
                    // 1. Group all points by userId across ALL completed picks
                    const aggregation = await picksCol.aggregate([
                        { $match: { pointsEarned: { $gt: 0 } } },
                        { $group: { _id: "$userId", total: { $sum: "$pointsEarned" }, username: { $first: "$username" } } }
                    ]).toArray();

                    // 2. Update leaderboard collection bulk
                    const leaderBatch = aggregation.map(agg => ({
                        updateOne: {
                            filter: { userId: agg._id },
                            update: { $set: { totalPoints: agg.total, username: agg.username } },
                            upsert: true
                        }
                    }));

                    if (leaderBatch.length > 0) {
                        await leaderCol.bulkWrite(leaderBatch);
                    }
                }

                return res.status(200).json({ success: true, message: "Result saved and points calculated" });
            }

            return res.status(400).json({ error: "Invalid action" });
        }

        return res.status(405).json({ error: "Method not allowed" });
    } catch (error: any) {
        console.error("Predictions API Error:", error);
        return res.status(500).json({ error: error.message || "Internal server error" });
    }
}
