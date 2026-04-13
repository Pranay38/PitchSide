import fs from "fs";

const filePath = "src/app/pages/AdminPage.tsx";
let content = fs.readFileSync(filePath, "utf8");

// Remove imports
content = content.replace(/\s*isAdminAuthenticated,\s*/g, "\n");
content = content.replace(/\s*adminLogout,\s*/g, "\n");

// Replace sign out logic
if (!content.includes('import { signOut } from "next-auth/react"')) {
    content = content.replace('import { useNavigate, Link } from "@/lib/router-compat";', 
    'import { useNavigate, Link } from "@/lib/router-compat";\nimport { signOut } from "next-auth/react";');
}

// Remove isAuthed state
content = content.replace(/const \[isAuthed, setIsAuthed\] = useState\(isAdminAuthenticated\(\)\);\n/g, "");

// Modify handleLogout
content = content.replace(/const handleLogout = \(\) => \{ adminLogout\(\); setIsAuthed\(false\); \};/g, 
"const handleLogout = () => { signOut({ callbackUrl: '/' }); };");

// Modify the isAuthed check around useEffect and return
content = content.replace(/if \(\!isAuthed\) return <AdminLogin onLogin=\{handleLogin\} \/>;\n/g, "");
content = content.replace(/if \(isAuthed\) \{\n/g, "{\n");

// Replace authentication headers
content = content.replace(/const pwd = localStorage.getItem\("pitchside_admin_auth"\) \|\| "";\n/g, "");
content = content.replace(/headers: \{ Authorization: `Bearer \$\{pwd\}` \}/g, "headers: {}");
content = content.replace(/headers: \{ "Content-Type": "application\/json", Authorization: `Bearer \$\{pwd\}` \}/g, 'headers: { "Content-Type": "application/json" }');

// Remove getAdminAuthHeaders
content = content.replace(/const getAdminAuthHeaders = useCallback\(\(\): HeadersInit => \{\n\s*const token = localStorage.getItem\("pitchside_admin_auth"\);\n\s*return token \? \{ Authorization: `Bearer \$\{token\}` \} : \{\};\n\s*\}, \[\]\);\n/g, 
"const getAdminAuthHeaders = useCallback((): HeadersInit => ({}), []);\n");

// Remove local storage logic from postStorage.ts
const postStoragePath = "src/app/lib/postStorage.ts";
let postStorageContent = fs.readFileSync(postStoragePath, "utf8");

// Remove the admin auth block
postStorageContent = postStorageContent.replace(/\/\/ ──────────────────────────────────────────\n\/\/ Admin authentication\n\/\/ ──────────────────────────────────────────[\s\S]*?(?=\/\/ ──────────────────────────────────────────|$)/g, "");

// Remove 401/403 adminLogout interceptors
postStorageContent = postStorageContent.replace(/if \(res\.status === 401 \|\| res\.status === 403\) \{\n\s*adminLogout\(\);\n\s*throw new Error\("Unauthorized"\);\n\s*\}/g, 'if (res.status === 401 || res.status === 403) throw new Error("Unauthorized");');

fs.writeFileSync(filePath, content, "utf8");
fs.writeFileSync(postStoragePath, postStorageContent, "utf8");
console.log("Cleaned up AdminPage and postStorage!");
