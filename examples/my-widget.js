import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

import { copyDefaultFiles } from '../cli/helper.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PACKER_ROOT = path.resolve(__dirname, '..');
const PACKAGE_DIR = path.join(PACKER_ROOT, '_package');
const OUTPUT_DIR = path.join(PACKER_ROOT, 'examples', 'output', 'my-widget');

// ─── Simulated consumer answers

const answers = {
    MODULE_NAME: 'MyWidget',
    MODULE_ALIAS: 'my-widget',
    DESCRIPTION: 'A bogus widget for testing jizy-packer',
    KEYWORDS: ['jizy', 'widget', 'example'],
    HOMEPAGE: '',
    AUTHOR_NAME: 'John Doe',
    AUTHOR_EMAIL: 'john@example.com',
    AUTHOR_WEBSITE: 'https://example.com',
    GIT_MODULE: 'johndoe/my-widget',
    GIT_ACCOUNT: 'johndoe',
    GIT_REPO: 'my-widget',
    LICENSE: 'MIT',
    YEAR: new Date().getFullYear().toString(),
    LESS: true,
};

// ─── Helpers ────────────────────────────────────────────────────────────────

function emptyDir(dirPath) {
    if (fs.existsSync(dirPath)) {
        fs.rmSync(dirPath, { recursive: true, force: true });
    }
    fs.mkdirSync(dirPath, { recursive: true });
}

console.log('');
console.log('=== Phase 1: Scaffold my-widget package ===');
console.log(`Output: ${OUTPUT_DIR}`);
console.log('');

emptyDir(OUTPUT_DIR);

// Generate package.json
const pkg = {
    name: answers.MODULE_ALIAS,
    version: '1.0.0',
    browser: `dist/js/${answers.MODULE_ALIAS}.min.js`,
    main: 'lib/index.js',
    type: 'module',
    jizy: 'dist/',
    description: answers.DESCRIPTION,
    keywords: answers.KEYWORDS,
    files: ['dist/*', 'example/*', 'lib/*'],
    scripts: {
        'jpack:example': 'node ./cli/jpack.js --action build --name example',
        'jpack:example-debug': 'node ./cli/jpack.js --action build --name example --debug',
        'jpack:export': 'node ./cli/jpack.js --action build --name perso',
        'jpack:export-debug': 'node ./cli/jpack.js --action build --name perso --debug',
        'jpack:dist': 'node ./cli/jpack.js',
        'jpack:dist-debug': 'node ./cli/jpack.js --debug',
    },
    repository: {
        type: 'git',
        url: `git+https://github.com/${answers.GIT_ACCOUNT}/${answers.GIT_REPO}.git`,
    },
    author: `${answers.AUTHOR_NAME} <${answers.AUTHOR_EMAIL}> (${answers.AUTHOR_WEBSITE})`,
    license: answers.LICENSE,
    dependencies: {
        'jizy-packer': 'file:../../..',
        'less': '^4.5.1',
    },
};

fs.writeFileSync(path.join(OUTPUT_DIR, 'package.json'), JSON.stringify(pkg, null, 2));
console.log('  [WRITE] package.json');

// Copy _package/ skeleton templates with replacements (same as cli/init.js line 500)
copyDefaultFiles(PACKAGE_DIR, OUTPUT_DIR, answers);

// Create the main JS file with bogus working code (init.js creates it empty)
const mainJsDir = path.join(OUTPUT_DIR, 'lib', 'js');
fs.mkdirSync(mainJsDir, { recursive: true });

const mainJs = path.join(mainJsDir, answers.MODULE_NAME + '.js');
fs.writeFileSync(mainJs, `var defaults = {
    color: '#3498db',
    size: 'medium',
    animated: true
};

function ${answers.MODULE_NAME}(selector, options) {
    this.el = document.querySelector(selector);
    this.options = Object.assign({}, defaults, options || {});
    this.visible = false;
}

${answers.MODULE_NAME}.prototype.show = function () {
    if (!this.el) return this;
    this.el.classList.add('mw-visible');
    this.el.style.backgroundColor = this.options.color;
    this.visible = true;
    return this;
};

${answers.MODULE_NAME}.prototype.hide = function () {
    if (!this.el) return this;
    this.el.classList.remove('mw-visible');
    this.visible = false;
    return this;
};

${answers.MODULE_NAME}.prototype.toggle = function () {
    return this.visible ? this.hide() : this.show();
};

export default ${answers.MODULE_NAME};
`, 'utf8');
console.log(`  [WRITE] lib/js/${answers.MODULE_NAME}.js`);

// Add some content to the LESS files (skeleton creates them empty)
fs.writeFileSync(path.join(OUTPUT_DIR, 'lib', 'less', 'structure.less'), `.mw-widget {
    display: inline-block;
    padding: 12px 20px;
    border: 1px solid #ccc;
    border-radius: 6px;
    font-family: sans-serif;
    transition: opacity 0.3s ease;
}

.mw-widget.mw-visible {
    opacity: 1;
}
`, 'utf8');

console.log('');
console.log('Scaffold complete.');

console.log('');
console.log('=== Phase 2: Install dependencies ===');
console.log('');

execSync('npm install', { cwd: OUTPUT_DIR, stdio: 'inherit' });

console.log('');
console.log('Dependencies installed.');

console.log('');
console.log('=== Phase 3: Run dist build ===');
console.log('');

try {
    execSync('npm run jpack:dist-debug', { cwd: OUTPUT_DIR, stdio: 'inherit' });
} catch (error) {
    console.error('');
    console.error('Build process exited with error code:', error.status);
    console.error('');
}

console.log('');
console.log('=== Phase 4: Verify output ===');
console.log('');

const jsOutput = path.join(OUTPUT_DIR, 'dist', 'js', `${answers.MODULE_ALIAS}.min.js`);
const cssOutput = path.join(OUTPUT_DIR, 'dist', 'css', `${answers.MODULE_ALIAS}.min.css`);

let success = true;

if (fs.existsSync(jsOutput)) {
    const size = fs.statSync(jsOutput).size;
    console.log(`  OK  dist/js/${answers.MODULE_ALIAS}.min.js (${size} bytes)`);
} else {
    console.error(`  MISSING  dist/js/${answers.MODULE_ALIAS}.min.js`);
    success = false;
}

if (fs.existsSync(cssOutput)) {
    const size = fs.statSync(cssOutput).size;
    console.log(`  OK  dist/css/${answers.MODULE_ALIAS}.min.css (${size} bytes)`);
} else {
    console.error(`  MISSING  dist/css/${answers.MODULE_ALIAS}.min.css`);
    success = false;
}

console.log('');
if (success) {
    console.log('All outputs verified successfully!');
} else {
    console.error('Some outputs are missing. Check the build log above.');
}

process.exit(success ? 0 : 1);
