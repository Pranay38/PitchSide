import fs from "fs";
import path from "path";

const dirs = ["server/endpoints", "_api"];
const extensions = [".ts", ".tsx"];

function replaceInFile(filePath: string) {
    let content = fs.readFileSync(filePath, "utf8");
    let changed = false;

    if (content.includes("!requireAuth(req, res)")) {
        content = content.replace(/!requireAuth\(req, res\)/g, "!(await requireAuth(req, res))");
        changed = true;
    }
    if (content.includes("!hasAdminAuth(req)")) {
        content = content.replace(/!hasAdminAuth\(req\)/g, "!(await hasAdminAuth(req))");
        changed = true;
    }
    if (content.includes("hasAdminAuth(req)") && !content.includes("await hasAdminAuth(req)")) {
        content = content.replace(/hasAdminAuth\(req\)/g, "(await hasAdminAuth(req))");
        changed = true;
    }

    if (changed) {
        fs.writeFileSync(filePath, content, "utf8");
        console.log(`Updated ${filePath}`);
    }
}

function traverseDir(dir: string) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            traverseDir(fullPath);
        } else if (extensions.some(ext => fullPath.endsWith(ext))) {
            replaceInFile(fullPath);
        }
    }
}

dirs.forEach(traverseDir);
console.log("Bulk replacement complete");
