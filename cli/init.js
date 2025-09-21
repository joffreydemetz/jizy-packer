import fs from "fs";
import path from "path";
import readline from "readline";
import { fileURLToPath } from "url";

async function copyAndReplace(srcDir, destDir, replacements) {
    const entries = fs.readdirSync(srcDir, { withFileTypes: true });
    for (const entry of entries) {
        const srcPath = path.join(srcDir, entry.name);
        const destName = entry.name.replace(/\.skel$/, "");
        const destPath = path.join(destDir, destName);

        if (fs.existsSync(destPath)) {
            continue; // Skip existing files
        }

        if (entry.isDirectory()) {
            if (!fs.existsSync(destPath)) fs.mkdirSync(destPath);
            await copyAndReplace(srcPath, destPath, replacements);
            return;
        }

        let content = fs.readFileSync(srcPath, "utf8");
        Object.entries(replacements).forEach(([key, value]) => {
            content = content.replace(new RegExp(`%${key}%`, "g"), value);
        });
        fs.writeFileSync(destPath, content, "utf8");
    }
}

function askQuestion(query) {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    });
    return new Promise(resolve => rl.question(query, ans => {
        rl.close();
        resolve(ans);
    }));
}

const moduleName = await askQuestion("Module name: ");
const moduleAlias = await askQuestion("Module alias: ");

// Interactive CLI prompts
const answers = {
    MODULE_NAME: moduleName,
    MODULE_ALIAS: moduleAlias
};

// Copy files from _package to current directory, replacing %KEY% and removing .skel
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const srcDir = path.join(__dirname, "..", "_package");
const destDir = process.cwd();

console.log(srcDir, destDir);
await copyAndReplace(srcDir, destDir, answers);
