import fs from "fs";
import path from "path";
import readline from "readline";
import { fileURLToPath } from "url";

function copyDefaultFiles(srcDir, destDir, replacements) {
    const entries = fs.readdirSync(srcDir, { withFileTypes: true });
    console.dir(entries.map(e => e.name));

    entries.forEach(entry => {
        const srcPath = path.join(srcDir, entry.name);
        const destName = entry.name.replace(/\.skel$/, "");
        const destPath = path.join(destDir, destName);

        if (entry.isDirectory()) {
            if (!fs.existsSync(destPath)) fs.mkdirSync(destPath);
            copyDefaultFiles(srcPath, destPath, replacements);
            return;
        }

        if (fs.existsSync(destPath)) {
            if (destName !== 'package.json') {
                console.log(`[SKIP] ${destName}`);
                return; // Skip existing files & folders
            }

            // read json file and check if the name of the package is set
            const pkg = JSON.parse(fs.readFileSync(destPath, "utf8"));
            if (pkg.name) {
                console.log(`[SKIP] ${destName}`);
                return; // skip existing package.json with name set
            }
        }

        console.log(`[COPY] ${destName}`);
        let content = fs.readFileSync(srcPath, "utf8");
        Object.entries(replacements).forEach(([key, value]) => {
            content = content.replace(new RegExp(`%${key}%`, "g"), value);
        });
        fs.writeFileSync(destPath, content, "utf8");
    });
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

console.log(srcDir);
console.log(destDir);
copyDefaultFiles(srcDir, destDir, answers);

// add an empty js file to start with
const mainJs = path.join(destDir, moduleName + '.js');
if (!fs.existsSync(mainJs)) {
    fs.writeFileSync(mainJs, '', 'utf8');
}
