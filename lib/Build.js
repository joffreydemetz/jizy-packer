import fs from 'fs';
import path from 'path';
import { rollup } from 'rollup';
import { pathToFileURL } from 'url';

import LogMe from "./LogMe.js";
import jPackConfig from "./Config.js";
import jPackRollup from "./Rollup.js";
import { emptyTargetPath, loadJson } from "./utils.js";

/**
 * @param {string}  action   the build action (dist|build) defaults to dist
 * @param {string}  name     the name of the build ([a-z0-9\-\_]) 
 * @param {string } config   the path to the custom config.json file
 * @param {boolean} debug    for verbose logging
 * 
 * 1. build dist default export
 *    no params
 *    default package config
 *    use ./config/jpack.js
 *    use ./config/config.json
 * 2. build custom config
 *    name (default to custom)
 *    default package config
 *    use ./config/jpack.js
 *    use ./config/config.json
 *    custom package config
 *    use [ABS_PATH_TO_CONFIG].json or json string
 */

export default async function jPackBuild({
    action = null,
    name = null,
    config = null,
    debug = false
} = {}) {

    if (debug) {
        process.env.DEBUG = true;
    }

    if (!action || action !== 'build') {
        action = 'dist';
    }

    if (config) {
        action = 'build';
    }

    if (action === 'dist') {
        name = 'default';
        config = null;
    } else {
        // Sanitize the build folder name
        if (name) {
            name = name.replace(/[^a-zA-Z0-9\-\_]/g, '');
            name = name.toLowerCase();
        }

        if (!name) {
            name = 'custom';
        }
    }

    LogMe.log('---');
    LogMe.log('action: ' + action);
    LogMe.log('name:   ' + name);
    LogMe.log('config: ' + (config ? 'yes' : 'no'));
    LogMe.log('debug:  ' + (debug ? 'enabled' : 'disabled'));
    LogMe.log('---');

    jPackConfig.set('buildName', name);
    jPackConfig.set('action', action);
    jPackConfig.set('debug', debug);

    if (config) {
        LogMe.log('Build config');
        try {
            if (config.substr(0, 1) === '{') {
                LogMe.log('  JSON string');
                jPackConfig.sets(JSON.parse(config));
            } else {
                LogMe.log('  JSON file');
                jPackConfig.sets(loadJson(config));
            }
        } catch (error) {
            LogMe.error('  ' + error.message);
            process.exit(1);
        }
    }

    jPackConfig.setPackageVersion();
    jPackConfig.validate();

    try {
        LogMe.log('Empty the target directory');
        LogMe.log('  TargetPath: ' + jPackConfig.get('targetPath'));
        emptyTargetPath(jPackConfig.get('targetPath'));
    } catch (error) {
        LogMe.error('  ' + error.message);
        process.exit(1);
    }

    LogMe.log('---');
    LogMe.log('Launch build ...');

    try {
        LogMe.log('---');
        LogMe.dir(jPackConfig.all());
        LogMe.log('---');

        const inputOptions = {
            input: jPackConfig.get('buildJsFilePath'),
            plugins: jPackRollup(),
        };

        const outputOptions = {
            file: jPackConfig.get('targetRelativePath') + '/js/' + jPackConfig.get('alias') + '.min.js',
            format: "iife",
            name: jPackConfig.get('name'),
            sourcemap: false,
        };

        try {
            LogMe.log('Starting Rollup build...');
            const bundle = await rollup(inputOptions);
            await bundle.write(outputOptions);
            LogMe.log('Rollup build completed successfully.');
        } catch (error) {
            console.error('Error during Rollup build:', error);
            process.exit(1);
        }

        LogMe.log('---');
        LogMe.log('Build completed successfully');
        LogMe.log('---');
        process.exit(1);
    } catch (error) {
        LogMe.error(error.message);
        process.exit(1);
    }
};