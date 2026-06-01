import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { copyDefaultFiles, loadActualPackageJsonFile } from '../cli/helper.js';

function tmpDir() {
    return fs.mkdtempSync(path.join(os.tmpdir(), 'jpack-helper-'));
}

test('copyDefaultFiles strips .skel, applies %TOKEN% replacements, and recurses', () => {
    const root = tmpDir();
    const src = path.join(root, 'src');
    const dest = path.join(root, 'dest');
    fs.mkdirSync(path.join(src, 'sub'), { recursive: true });
    fs.mkdirSync(dest, { recursive: true }); // copyDefaultFiles assumes the dest root exists (cwd in real use)
    fs.writeFileSync(path.join(src, 'readme.md.skel'), '# %NAME%');
    fs.writeFileSync(path.join(src, 'sub', 'index.js.skel'), 'export const n = "%NAME%";');

    copyDefaultFiles(src, dest, { NAME: 'widget' });

    assert.equal(fs.readFileSync(path.join(dest, 'readme.md'), 'utf8'), '# widget');
    assert.equal(fs.readFileSync(path.join(dest, 'sub', 'index.js'), 'utf8'), 'export const n = "widget";');
});

test('copyDefaultFiles never overwrites a file that already exists', () => {
    const root = tmpDir();
    const src = path.join(root, 'src');
    const dest = path.join(root, 'dest');
    fs.mkdirSync(src, { recursive: true });
    fs.mkdirSync(dest, { recursive: true });
    fs.writeFileSync(path.join(src, 'keep.txt.skel'), 'NEW');
    fs.writeFileSync(path.join(dest, 'keep.txt'), 'OLD');

    copyDefaultFiles(src, dest, {});
    assert.equal(fs.readFileSync(path.join(dest, 'keep.txt'), 'utf8'), 'OLD');
});

test('loadActualPackageJsonFile maps fields and parses a string author', () => {
    const dir = tmpDir();
    fs.writeFileSync(path.join(dir, 'package.json'), JSON.stringify({
        name: 'jizy-widget',
        description: 'A widget',
        keywords: ['a', 'b'],
        homepage: 'https://example.com/widget',
        author: 'Joffrey Demetz <joffrey.demetz@gmail.com> (https://joffreydemetz.com/)',
        license: 'MIT',
    }));

    const { pkg, defaults } = loadActualPackageJsonFile(dir, {});
    assert.equal(pkg.name, 'jizy-widget');
    assert.equal(defaults.MODULE_ALIAS, 'jizy-widget');
    assert.equal(defaults.DESCRIPTION, 'A widget');
    assert.deepEqual(defaults.KEYWORDS, ['a', 'b']);
    assert.equal(defaults.HOMEPAGE, 'https://example.com/widget');
    assert.equal(defaults.AUTHOR_NAME, 'Joffrey Demetz');
    assert.equal(defaults.AUTHOR_EMAIL, 'joffrey.demetz@gmail.com');
    assert.equal(defaults.AUTHOR_WEBSITE, 'https://joffreydemetz.com/');
    assert.equal(defaults.LICENSE, 'MIT');
});
