import fs from "fs";
import path from "path";
import readline from "readline";

export function loadYourConfig(baseDir, defaults) {
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

export function loadActualPackageJsonFile(baseDir, defaults) {
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

export function loadActualComposerJsonFile(baseDir, defaults) {
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

export function copyDefaultFiles(srcDir, destDir, replacements) {
    const entries = fs.readdirSync(srcDir, { withFileTypes: true });

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

export function askQuestion(query, current = null, def = null) {
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
