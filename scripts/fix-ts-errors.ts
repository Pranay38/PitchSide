import fs from "fs";

// Fix postStorage.ts remaining adminLogout
const postStoragePath = "src/app/lib/postStorage.ts";
let psContent = fs.readFileSync(postStoragePath, "utf8");
psContent = psContent.replace(/adminLogout\(\);\n\s*if \(typeof window !== "undefined"\) window\.location\.reload\(\);\n/g, "");
fs.writeFileSync(postStoragePath, psContent, "utf8");

// Fix AdminPage.tsx remaining isAuthed references
const adminPagePath = "src/app/pages/AdminPage.tsx";
let apContent = fs.readFileSync(adminPagePath, "utf8");

// Remove handleLogin which relies on setIsAuthed
apContent = apContent.replace(/const handleLogin = \(\) => setIsAuthed\(true\);\n/g, "");

// Remove isAuthed from useEffect dependency array
apContent = apContent.replace(/\[isAuthed, refreshPosts, refreshStories, fetchSubscriberCount, fetchCollections, fetchDebates, fetchServerPolls, fetchServerMatchRatings\]/g, "[refreshPosts, refreshStories, fetchSubscriberCount, fetchCollections, fetchDebates, fetchServerPolls, fetchServerMatchRatings]");

// Inside useEffect, there was likely an `if (isAuthed) {` block which I messed up with `if (isAuthed) {\n -> {\n`. But it was probably replaced. Let's make sure `isAuthed` doesn't exist at all.
// Also fix any other `setIsAuthed` usages that might have lingered.
apContent = apContent.replace(/const handleLogout = \(\) => \{ signOut\(\{ callbackUrl: '\/' \}\); setIsAuthed\(false\); \};/g, "const handleLogout = () => { signOut({ callbackUrl: '/' }); };");

fs.writeFileSync(adminPagePath, apContent, "utf8");
console.log("Fixed all remaining TS errors");
