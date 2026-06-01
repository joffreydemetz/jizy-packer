import { test } from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';

import jPackConfig from '../lib/Config.js';

test('get returns the default when unset; set/get roundtrip', () => {
    assert.equal(jPackConfig.get('totallyUnsetKey', 'def'), 'def');
    jPackConfig.set('foo', 'bar');
    assert.equal(jPackConfig.get('foo'), 'bar');
});

test('sets merges multiple keys and throws on a non-object', () => {
    jPackConfig.sets({ a: 1, b: 2 });
    assert.equal(jPackConfig.get('a'), 1);
    assert.equal(jPackConfig.get('b'), 2);
    assert.throws(() => jPackConfig.sets(null), /must be an object/);
});

test('all() snapshots config, replacing function values with "fn"', () => {
    jPackConfig.set('onPacked', () => { });
    jPackConfig.set('scalar', 5);
    const snap = jPackConfig.all();
    assert.equal(snap.onPacked, 'fn');
    assert.equal(snap.scalar, 5);
});

test('validate() requires basePath and buildName', () => {
    jPackConfig.set('basePath', '');
    assert.throws(() => jPackConfig.validate(), /basePath is required/);

    jPackConfig.set('basePath', path.sep === '\\' ? 'C:\\proj\\pkg' : '/proj/pkg');
    jPackConfig.set('buildName', '');
    assert.throws(() => jPackConfig.validate(), /buildName is required/);
});

test('validate() sets dist paths and derives alias from name', () => {
    jPackConfig.set('basePath', path.sep === '\\' ? 'C:\\proj\\pkg' : '/proj/pkg');
    jPackConfig.set('buildName', 'default');
    jPackConfig.set('action', 'dist');
    jPackConfig.set('alias', undefined);
    jPackConfig.set('name', 'My Widget');
    jPackConfig.set('onCheckConfig', undefined);

    jPackConfig.validate();

    assert.equal(jPackConfig.get('targetRelativePath'), 'dist');
    assert.equal(jPackConfig.get('importPrefix'), '../');
    assert.equal(jPackConfig.get('alias'), 'my-widget');
});
