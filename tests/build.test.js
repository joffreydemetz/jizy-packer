import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const fixtureDir = path.join(__dirname, 'fixtures', 'widget');
const distDir = path.join(fixtureDir, 'dist');

test('jPackBuild (dist) emits a banner-tagged, wrapped, minified bundle', () => {
    fs.rmSync(distDir, { recursive: true, force: true });
    try {
        // jPackBuild calls process.exit(), so run it in a child process.
        const res = spawnSync(process.execPath, ['build.mjs'], { cwd: fixtureDir, encoding: 'utf8' });
        assert.equal(res.status, 0, `build exited non-zero:\n${res.stdout}\n${res.stderr}`);

        const outFile = path.join(distDir, 'js', 'widget.min.js');
        assert.ok(fs.existsSync(outFile), 'expected dist/js/widget.min.js to be produced');

        const out = fs.readFileSync(outFile, 'utf8');
        // banner carries the fixture's package.json version + license
        assert.match(out, /^\/\*! Widget v9\.9\.9 \| MIT \|/);
        // the entry source was bundled in
        assert.ok(out.includes('jpack-smoke-ok'), 'bundled source token missing');
        // template + wrapper markers were resolved
        assert.ok(!out.includes('// @CODE'), '"// @CODE" marker should be replaced');
        assert.ok(!out.includes('{{PREFIX}}'), '"{{PREFIX}}" should be substituted');
        // the global was attached via the IIFE wrapper
        assert.match(out, /\.Widget=/);
    } finally {
        fs.rmSync(distDir, { recursive: true, force: true });
    }
});
