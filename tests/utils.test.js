import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import jPackConfig from '../lib/Config.js';
import {
    generateBanner,
    loadJson,
    loadJsonConfigs,
    emptyTargetPath,
    moveFolderFiles,
} from '../lib/utils.js';

function tmpDir() {
    return fs.mkdtempSync(path.join(os.tmpdir(), 'jpack-utils-'));
}

test('generateBanner formats name/version/license/buildName + ISO-minute date', () => {
    jPackConfig.set('name', 'Widget');
    jPackConfig.set('version', '1.2.3');
    jPackConfig.set('license', 'MIT');
    jPackConfig.set('buildName', 'default');

    const banner = generateBanner();
    assert.match(banner, /^\/\*! Widget v1\.2\.3 \| MIT \| \d{4}-\d{2}-\d{2}T\d{2}:\d{2}Z \| \[default\] \*\/$/);
});

test('generateBanner omits license when not set', () => {
    jPackConfig.set('name', 'Widget');
    jPackConfig.set('version', '2.0.0');
    jPackConfig.set('license', undefined);
    jPackConfig.set('buildName', 'default');

    const banner = generateBanner();
    assert.ok(banner.includes('Widget v2.0.0'));
    assert.ok(!banner.includes('MIT'));
    assert.ok(banner.includes('[default]'));
});

test('loadJson parses a JSON file and throws on a missing one', () => {
    const dir = tmpDir();
    const p = path.join(dir, 'a.json');
    fs.writeFileSync(p, JSON.stringify({ x: 1 }));
    assert.deepEqual(loadJson(p), { x: 1 });
    assert.throws(() => loadJson(path.join(dir, 'nope.json')), /Failed to load JSON/);
});

test('loadJsonConfigs deep-merges in order and skips missing files', () => {
    const dir = tmpDir();
    const a = path.join(dir, 'a.json');
    const b = path.join(dir, 'b.json');
    fs.writeFileSync(a, JSON.stringify({ x: 1, nested: { a: 1, keep: 1 } }));
    fs.writeFileSync(b, JSON.stringify({ y: 2, nested: { b: 2, keep: 9 } }));

    const merged = loadJsonConfigs(a, path.join(dir, 'missing.json'), b);
    // later config wins for scalars; nested objects are merged, not replaced
    assert.deepEqual(merged, { x: 1, y: 2, nested: { a: 1, keep: 9, b: 2 } });
});

test('emptyTargetPath empties an existing dir and creates a missing one', () => {
    const dir = tmpDir();
    fs.writeFileSync(path.join(dir, 'f.txt'), 'x');
    fs.mkdirSync(path.join(dir, 'sub'));
    fs.writeFileSync(path.join(dir, 'sub', 'g.txt'), 'y');

    emptyTargetPath(dir);
    assert.deepEqual(fs.readdirSync(dir), []);

    const missing = path.join(dir, 'created');
    emptyTargetPath(missing);
    assert.ok(fs.existsSync(missing) && fs.statSync(missing).isDirectory());
});

test('moveFolderFiles copies files recursively and removes source when empty=true', () => {
    const dir = tmpDir();
    const src = path.join(dir, 'src');
    const dest = path.join(dir, 'dest');
    fs.mkdirSync(path.join(src, 'sub'), { recursive: true });
    fs.writeFileSync(path.join(src, 'a.txt'), 'A');
    fs.writeFileSync(path.join(src, 'sub', 'b.txt'), 'B');

    moveFolderFiles(src, dest);
    assert.equal(fs.readFileSync(path.join(dest, 'a.txt'), 'utf8'), 'A');
    assert.equal(fs.readFileSync(path.join(dest, 'sub', 'b.txt'), 'utf8'), 'B');
    assert.ok(!fs.existsSync(src), 'source should be removed when empty=true');
});

test('moveFolderFiles respects overwrite=false', () => {
    const dir = tmpDir();
    const src = path.join(dir, 'src');
    const dest = path.join(dir, 'dest');
    fs.mkdirSync(src);
    fs.mkdirSync(dest);
    fs.writeFileSync(path.join(src, 'a.txt'), 'NEW');
    fs.writeFileSync(path.join(dest, 'a.txt'), 'OLD');

    moveFolderFiles(src, dest, false, false);
    assert.equal(fs.readFileSync(path.join(dest, 'a.txt'), 'utf8'), 'OLD');
});
