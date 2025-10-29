import fs from "fs";
import path from "path";
import readline from "readline";
import { fileURLToPath } from "url";
import { execSync } from "child_process";

function loadYourConfig(baseDir, defaults) {
    const configPath = path.join(baseDir, "me.json");

    if (fs.existsSync(configPath)) {
        const jsonConfig = JSON.parse(fs.readFileSync(configPath, "utf8"));

        if (jsonConfig.keywords) {
            if (!Array.isArray(jsonConfig.keywords)) {
                jsonConfig.keywords = jsonConfig.keywords.split(',');
            }
            defaults.KEYWORDS_PREPEND = jsonConfig.keywords.map(k => k.trim()).filter(k => k.length > 0);
        }
        if (jsonConfig.gitAccount) {
            defaults.GIT_ACCOUNT = jsonConfig.gitAccount;
        }
        if (jsonConfig.gitPrefix) {
            defaults.GIT_PREFIX = jsonConfig.gitPrefix;
        }
        if (jsonConfig.authorName) {
            defaults.AUTHOR_NAME = jsonConfig.authorName;
        }
        if (jsonConfig.authorEmail) {
            defaults.AUTHOR_EMAIL = jsonConfig.authorEmail;
        }
        if (jsonConfig.authorWebsite) {
            defaults.AUTHOR_WEBSITE = jsonConfig.authorWebsite;
        }
        if (jsonConfig.homepagePrefix) {
            defaults.HOMEPAGE_PREFIX = jsonConfig.homepagePrefix;
        }
        if (jsonConfig.license) {
            defaults.LICENSE = jsonConfig.license;
        }
    }

    return defaults;
}

function loadActualPackageJsonFile(baseDir, defaults) {
    let pkg = {
        name: null,
        version: '1.0.0',
        browser: '',
        main: 'lib/index.js',
        type: 'module',
        jizy: 'dist/',
        licence: 'MIT',
        homepage: '',
        description: '',
        keywords: [],
        files: [],
        scripts: {},
        dependencies: {}
    };

    const pkgPath = path.join(baseDir, "package.json");

    if (fs.existsSync(pkgPath)) {
        const current = JSON.parse(fs.readFileSync(pkgPath, "utf8"));
        pkg = Object.assign({}, pkg, current);

        if (pkg.name) {
            defaults.MODULE_ALIAS = pkg.name;
        }

        if (pkg.description) {
            defaults.DESCRIPTION = pkg.description;
        }

        if (pkg.keywords) {
            defaults.KEYWORDS = pkg.keywords;
        }

        if (pkg.homepage) {
            defaults.HOMEPAGE = pkg.homepage;
        }

        if (pkg.author) {
            if (typeof pkg.author === 'string') {
                const authorMatch = pkg.author.match(/(.*?)\s*<([^>]+)>\s*\(([^)]+)\)/);
                if (authorMatch) {
                    defaults.AUTHOR_NAME = authorMatch[1];
                    defaults.AUTHOR_EMAIL = authorMatch[2];
                    defaults.AUTHOR_WEBSITE = authorMatch[3];
                }
            } else {
                defaults.AUTHOR_NAME = pkg.author.name;
                defaults.AUTHOR_EMAIL = pkg.author.email;
                defaults.AUTHOR_WEBSITE = pkg.author.url;
            }
        }

        if (pkg.license) {
            defaults.LICENSE = pkg.license;
        }
    }

    return { pkg, defaults };
}

function loadActualComposerJsonFile(baseDir, defaults) {
    let composer = {
        name: null,
        type: 'library',
        description: '',
        keywords: [],
        homepage: '',
        license: 'MIT',
        authors: []
    }

    const composerPath = path.join(baseDir, "composer.json");

    if (fs.existsSync(composerPath)) {
        const current = JSON.parse(fs.readFileSync(composerPath, "utf8"));
        composer = Object.assign({}, composer, current);

        if (composer.name) {
            defaults.GIT_MODULE = composer.name;
        }

        if (!defaults.DESCRIPTION && composer.description) {
            defaults.DESCRIPTION = composer.description;
        }

        if (!defaults.KEYWORDS && composer.keywords) {
            defaults.KEYWORDS = composer.keywords;
        }

        if (!defaults.HOMEPAGE && composer.homepage) {
            defaults.HOMEPAGE = composer.homepage;
        }

        if (composer.authors && composer.authors.length > 0) {
            const author = composer.authors[0];
            if (!defaults.AUTHOR_NAME && author.name) {
                defaults.AUTHOR_NAME = author.name;
            }
            if (!defaults.AUTHOR_EMAIL && author.email) {
                defaults.AUTHOR_EMAIL = author.email;
            }
            if (!defaults.AUTHOR_WEBSITE && author.homepage) {
                defaults.AUTHOR_WEBSITE = author.homepage;
            }
        }
    }

    return { composer, defaults };
}

function copyDefaultFiles(srcDir, destDir, replacements) {
    const entries = fs.readdirSync(srcDir, { withFileTypes: true });
    // console.dir(entries.map(e => e.name));

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
            console.log(`[SKIP] ${destName}`);
            return;
        }

        console.log(`[COPY] ${destName}`);
        let content = fs.readFileSync(srcPath, "utf8");
        Object.entries(replacements).forEach(([key, value]) => {
            content = content.replace(new RegExp(`%${key}%`, "g"), value);
        });
        fs.writeFileSync(destPath, content, "utf8");
    });
}

function askQuestion(query, current = null, def = null) {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    });

    const hasCurrent = current !== null && current !== undefined;
    const defaultValue = hasCurrent ? current : def || '';

    return new Promise(resolve => rl.question(`${query} [${defaultValue}]: `, answer => {
        rl.close();

        if (answer === '.') {
            resolve('');
            return;
        }

        if (answer === '' && hasCurrent) {
            resolve(current);
            return;
        }

        resolve(answer === '' ? def : answer);
    }));
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const baseDir = process.cwd();
const srcDir = path.join(__dirname, "..", "_package");

console.log('current working directory:', baseDir);

let defaults = loadYourConfig(baseDir, { KEYWORDS_PREPEND: null });

const answers = {
    MODULE_NAME: null,
    MODULE_ALIAS: null,
    DESCRIPTION: null,
    KEYWORDS: null,
    HOMEPAGE: null,
    AUTHOR_NAME: null,
    AUTHOR_EMAIL: null,
    AUTHOR_WEBSITE: null,
    GIT_MODULE: null,
    GIT_ACCOUNT: null,
    GIT_REPO: null,
    LESS: null,
    YEAR: null,
    HOMEPAGE_PREFIX: null,
    GIT_PREFIX: null
};

const packageJson = loadActualPackageJsonFile(baseDir, defaults);
defaults = packageJson.defaults;
const pkg = packageJson.pkg;

const composerJson = loadActualComposerJsonFile(baseDir, defaults);
defaults = composerJson.defaults;
const composer = composerJson.composer;

if (pkg.dependencies && pkg.dependencies.less) {
    answers.LESS = true;
}

if (!defaults.YEAR) {
    defaults.YEAR = new Date().getFullYear();
}

const folderName = path.basename(process.cwd());

if (!defaults.MODULE_NAME) {
    // convert to CamelCase
    defaults.MODULE_NAME = folderName.split(/[-_ ]+/)
        .map(part => part.charAt(0).toUpperCase() + part.slice(1))
        .join('');
}

console.log('');
console.log('****** Module Information');
answers.MODULE_NAME = await askQuestion("Module name* (e.g. ModuleName): ", answers.MODULE_NAME, defaults.MODULE_NAME);

if (!answers.MODULE_NAME) {
    console.error("Module name is required.");
    process.exit(1);
}

if (!defaults.MODULE_ALIAS) {
    defaults.MODULE_ALIAS = folderName.replace(/([A-Z])/g, (g, m1, offset) => (offset > 0 ? '-' : '') + m1.toLowerCase());
}

answers.MODULE_ALIAS = await askQuestion("Module alias* (e.g. module-name): ", answers.MODULE_ALIAS, defaults.MODULE_ALIAS);
if (!answers.MODULE_ALIAS) {
    console.error("Module alias is required.");
    process.exit(1);
}

console.log('');
console.log('****** Git Repository Information');

if (!defaults.GIT_MODULE && defaults.GIT_PREFIX) {
    defaults.GIT_MODULE = `${defaults.GIT_PREFIX}/${answers.MODULE_ALIAS}`;
}
answers.GIT_MODULE = await askQuestion("Git module (e.g. prefix/module-name): ", answers.GIT_MODULE, defaults.GIT_MODULE);
if (!answers.GIT_MODULE) {
    console.error('Git module is required.');
    process.exit(1);
}

const [defaultGitAccount, defaultGitRepo] = answers.GIT_MODULE.split('/');
if (!defaults.GIT_ACCOUNT) {
    defaults.GIT_ACCOUNT = defaultGitAccount;
}
if (!defaults.GIT_REPO) {
    defaults.GIT_REPO = defaultGitRepo;
}

answers.GIT_ACCOUNT = await askQuestion("Git account (e.g. your-account): ", answers.GIT_ACCOUNT, defaults.GIT_ACCOUNT);
answers.GIT_REPO = await askQuestion("Git repo (e.g. module-name): ", answers.GIT_REPO, defaults.GIT_REPO);

console.log('');
console.log('****** Author Information (optional)');

answers.AUTHOR_NAME = await askQuestion("Author name (e.g. Your Name): ", answers.AUTHOR_NAME, defaults.AUTHOR_NAME);
answers.AUTHOR_EMAIL = await askQuestion("Author email (e.g. your.email@example.com): ", answers.AUTHOR_EMAIL, defaults.AUTHOR_EMAIL);
answers.AUTHOR_WEBSITE = await askQuestion("Author website (e.g. https://your-website.com): ", answers.AUTHOR_WEBSITE, defaults.AUTHOR_WEBSITE);

console.log('');
console.log('****** Description, Keywords, Homepage');
console.log('Used in package.json and optionaly in composer.json');

answers.DESCRIPTION = await askQuestion("Description: ", answers.DESCRIPTION, defaults.DESCRIPTION);

defaults.KEYWORDS = [];
if (answers.GIT_PREFIX) {
    defaults.KEYWORDS.push(answers.GIT_PREFIX);
}
defaults.KEYWORDS.push(answers.GIT_ACCOUNT);
defaults.KEYWORDS.push(answers.MODULE_NAME);

const keywordsInput = await askQuestion("Keywords (comma separated): ", answers.KEYWORDS ? answers.KEYWORDS.join(', ') : null, defaults.KEYWORDS.join(', '));
if (keywordsInput) {
    answers.KEYWORDS = keywordsInput.split(',');
}
if (defaults.KEYWORDS_PREPEND) {
    answers.KEYWORDS = [...defaults.KEYWORDS_PREPEND, ...answers.KEYWORDS];
}
answers.KEYWORDS = answers.KEYWORDS
    .map(k => k.trim())
    .filter(k => k.length > 0)
    .map(k => k.toLowerCase());
// unique keywords
answers.KEYWORDS = Array.from(new Set(answers.KEYWORDS));

if (!defaults.HOMEPAGE && defaults.HOMEPAGE_PREFIX) {
    defaults.HOMEPAGE_PREFIX = defaults.HOMEPAGE_PREFIX.replace(/^\/+|\/+$/g, '');
    defaults.HOMEPAGE = `${defaults.HOMEPAGE_PREFIX}/${answers.MODULE_ALIAS}`;
}
answers.HOMEPAGE = await askQuestion("Homepage: ", answers.HOMEPAGE, defaults.HOMEPAGE);

console.log('');
console.log('****** LESS (optional)');
console.log('Used for styles compilation if needed');
if (answers.LESS === null) {
    const lessInput = await askQuestion("Use LESS for styles? (y/N): ", null, 'N');
    answers.LESS = (lessInput.toLowerCase() === 'y');
} else {
    console.log(`LESS usage detected in existing package.json, keeping it as is.`);
}

answers.LICENSE = await askQuestion("License for package files: ", answers.LICENSE, defaults.LICENSE);
answers.YEAR = await askQuestion("Debut year for license file: ", answers.YEAR, defaults.YEAR);

pkg.name = answers.MODULE_ALIAS;
pkg.version = pkg.version || '1.0.0';
pkg.browser = pkg.browser || `dist/js/${answers.MODULE_ALIAS}.min.js`;
pkg.main = pkg.main || 'lib/index.js';
pkg.type = pkg.type || 'module';
pkg.jizy = 'dist/';
pkg.description = answers.DESCRIPTION || '';
pkg.keywords = answers.KEYWORDS || [];
pkg.homepage = answers.HOMEPAGE || '';
if (!pkg.files) {
    pkg.files = [];
}
pkg.files.push('dist/*');
pkg.files.push('lib/*');

// unique files
pkg.files = Array.from(new Set(pkg.files));

pkg.repository = {
    type: "git",
    url: `git+https://github.com/${answers.GIT_ACCOUNT}/${answers.GIT_REPO}.git`
};

if (answers.AUTHOR_NAME && answers.AUTHOR_EMAIL && answers.AUTHOR_WEBSITE) {
    pkg.author = answers.AUTHOR_NAME + ' <' + answers.AUTHOR_EMAIL + '> (' + answers.AUTHOR_WEBSITE + ')';
} else if (answers.AUTHOR_NAME || answers.AUTHOR_EMAIL || answers.AUTHOR_WEBSITE) {
    pkg.author = {};
    if (answers.AUTHOR_NAME) pkg.author.name = answers.AUTHOR_NAME;
    if (answers.AUTHOR_EMAIL) pkg.author.email = answers.AUTHOR_EMAIL;
    if (answers.AUTHOR_WEBSITE) pkg.author.url = answers.AUTHOR_WEBSITE;
}

pkg.scripts = Object.assign({}, pkg.scripts, {
    "jpack:example": "node ./cli/jpack.js --action build --name example",
    "jpack:example-debug": "node ./cli/jpack.js --action build --name example --debug",
    "jpack:export": "node ./cli/jpack.js --action build --name perso",
    "jpack:export-debug": "node ./cli/jpack.js --action build --name perso --debug",
    "jpack:dist": "node ./cli/jpack.js",
    "jpack:dist-debug": "node ./cli/jpack.js --debug"
});

// force less dependency for now 
// @todo update builder to manage LESS not installed case
answers.LESS = true;
if (answers.LESS) {
    pkg.dependencies = Object.assign({}, pkg.dependencies, {
        "less": "^4.1.3"
    });
}

// remove empty fields
Object.keys(pkg).forEach(key => {
    if (!pkg[key]) {
        delete pkg[key];
    }
});

composer.name = answers.GIT_MODULE;
composer.type = composer.type || 'library';
composer.license = answers.LICENSE || 'MIT';
if (!composer.description) {
    composer.description = answers.DESCRIPTION || '';
}
if (!composer.keywords.length) {
    composer.keywords = answers.KEYWORDS || [];
}
if (!composer.homepage) {
    composer.homepage = answers.HOMEPAGE || '';
}

let author = null;
if (answers.AUTHOR_NAME || answers.AUTHOR_EMAIL || answers.AUTHOR_WEBSITE) {
    author = {};
    if (answers.AUTHOR_NAME) author.name = answers.AUTHOR_NAME;
    if (answers.AUTHOR_EMAIL) author.email = answers.AUTHOR_EMAIL;
    if (answers.AUTHOR_WEBSITE) author.homepage = answers.AUTHOR_WEBSITE;
    author.role = 'Lead';
}

if (author) {
    if (composer.authors) {
        // check if the author is already present
        let found = false;
        composer.authors.forEach(author => {
            if (author.name === answers.AUTHOR_NAME &&
                author.email === answers.AUTHOR_EMAIL) {
                found = true;
            }
        });
        if (!found) {
            composer.authors.push(author);
        }
    }
    else {
        composer.authors = [];
        composer.authors.push(author);
    }
}

// remove empty fields
Object.keys(composer).forEach(key => {
    if (!composer[key]) {
        delete composer[key];
    }
});

// display the content to be written for confirmation
console.log('');
console.log("The following content will be written to package.json:");
console.log(JSON.stringify(pkg, null, 2));
console.log('');
console.log("The following content will be written to composer.json:");
console.log(JSON.stringify(composer, null, 2));
console.log('');

const confirm = await askQuestion("Do you want to proceed? (y/N): ", null, 'N');
if (confirm.toLowerCase().substr(0, 1) !== 'y') {
    console.log("Aborted..");
    process.exit(0);
}

fs.writeFileSync(path.join(baseDir, "package.json"), JSON.stringify(pkg, null, 2));
fs.writeFileSync(path.join(baseDir, "composer.json"), JSON.stringify(composer, null, 2));

//

if (answers.LESS) {
    console.log('Check LESS install...');

    try {
        execSync('npm install less', { stdio: 'inherit', cwd: baseDir });
        console.log('✓ less package installed successfully');
    } catch (error) {
        console.error('✗ Failed to install less package:', error.message);
        console.log('You can install it manually with: npm install less or npm update');
    }
}

// console.log(srcDir);
// console.log(baseDir);
copyDefaultFiles(srcDir, baseDir, answers);
console.log('✓ copied default files');

// add an empty js file to start with
const mainJsDir = path.join(baseDir, 'lib', 'js');
if (!fs.existsSync(mainJsDir)) {
    fs.mkdirSync(mainJsDir, { recursive: true });
}
const mainJs = path.join(mainJsDir, answers.MODULE_NAME + '.js');
if (!fs.existsSync(mainJs)) {
    fs.writeFileSync(mainJs, '', 'utf8');
}
console.log('✓ created main js file');
