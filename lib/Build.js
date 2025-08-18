import fs from 'fs';
import path from 'path';
import { rollup } from 'rollup';

import LogMe from "./LogMe.js";
import jPackConfig from "./Config.js";
import jPackRollup from "./Rollup.js";
import { cleanBuildFolder } from './utils.js';

export default async function jPackBuild({
    target = null,
    name = null,
    zip = false,
    debug = false
} = {}) {

    LogMe.log('---');

    if (debug) {
        process.env.DEBUG = true;
    }

    LogMe.log('Build project...');

    if (!target || target === 'dist') {
        target = '';
        name = '';
        zip = false;
    }

    if (zip && !name) {
        name = 'zip';
    }

    if (target && !name) {
        name = 'export';
    }

    if (!name) {
        name = 'default';
    }

    LogMe.log('  Target: ' + target);
    LogMe.log('  Name: ' + name);
    LogMe.log('  Zip: ' + (zip ? 'enabled' : 'disabled'));
    LogMe.log('  Debug: ' + (debug ? 'enabled' : 'disabled'));
    LogMe.log('---');

    jPackConfig.set('buildZip', zip);
    jPackConfig.set('buildName', name);

    if (target) {
        jPackConfig.set('buildTarget', jPackConfig.get('basePath') + '/build/' + target);
        if (!fs.existsSync(jPackConfig.get('buildTarget'))) {
            fs.mkdirSync(jPackConfig.get('buildTarget'), { recursive: true });
        }
    } else {
        LogMe.log('Empty or create dist directory');
        const targetPath = path.join(jPackConfig.get('basePath'), 'dist');
        jPackConfig.set('buildTarget', targetPath);
        cleanBuildFolder(targetPath);

        const targetCfgPath = path.join(targetPath, 'config.json');
        if (!fs.existsSync(targetCfgPath)) {
            const defaultCfgPath = path.join(jPackConfig.get('basePath'), 'config', 'config.json');
            if (fs.existsSync(defaultCfgPath)) {
                LogMe.log('Copy default config.json file');
                fs.copyFileSync(defaultCfgPath, targetCfgPath);
            }
        }
    }

    const defaultCfgPath = path.join(jPackConfig.get('basePath'), 'config', 'config.json');
    const targetCfgPath = path.join(jPackConfig.get('buildTarget'), 'config.json');
    if (!fs.existsSync(targetCfgPath)) {
        if (fs.existsSync(defaultCfgPath)) {
            LogMe.log('Copy default config.json file');
            fs.copyFileSync(defaultCfgPath, targetCfgPath);
        }
    }

    if (fs.existsSync(defaultCfgPath)) {
        LogMe.log('Load default config file');
        LogMe.log(defaultCfgPath);
        jPackConfig.loadFromJson(defaultCfgPath);
    }

    const cfgPath = checkTargetDirectory(jPackConfig.get('buildTarget'));
    if (fs.existsSync(cfgPath)) {
        LogMe.log(`Load client config file`);
        LogMe.log(cfgPath);
        jPackConfig.loadFromJson(cfgPath);
    }

    try {
        jPackConfig.setPackageVersion();
        checkConfig();
        await doBuild();
    } catch (error) {
        LogMe.error(`Failed to load configuration file: ${cfgPath}`);
        LogMe.error(error.message);
        process.exit(1);
    }
};

async function doBuild() {
    LogMe.log('---');
    LogMe.dir(jPackConfig.all());
    LogMe.log('---');

    const inputOptions = {
        input: jPackConfig.get('buildJsFilePath'),
        plugins: jPackRollup(),
    };

    const outputOptions = {
        file: jPackConfig.get('assetsPath') + '/js/' + jPackConfig.get('alias') + '.min.js',
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
}

function checkTargetDirectory(targetPath) {
    LogMe.log('checkTargetDirectory()');

    if (!fs.existsSync(targetPath)) {
        LogMe.error(`Does not exist: ${targetPath}`);
        process.exit(1);
    }

    if (!fs.lstatSync(targetPath).isDirectory()) {
        LogMe.error(`Is not a directory: ${targetPath}`);
        process.exit(1);
    }

    const cfgPath = path.join(targetPath, 'config.json');

    if (!fs.existsSync(cfgPath)) {
        LogMe.warn('  config.json not found in target path');
        return null;
    }

    const files = fs.readdirSync(targetPath)
        .filter(file => file !== 'config.json');

    if (files.length > 0) {
        LogMe.error('Build target can only contain config.json');
        process.exit(1);
    }

    return cfgPath;
}

function checkConfig() {
    const basePath = jPackConfig.get('basePath');

    const buildName = jPackConfig.get('buildName')
        .replace(/[^a-zA-Z0-9]/g, ''); // Sanitize the build folder name

    jPackConfig.set('buildName', buildName);

    if (buildName === 'default') {
        jPackConfig.set('assetsPath', 'dist');
        jPackConfig.set('importPrefix', '../');
    }
    else {
        jPackConfig.set('assetsPath', 'build/' + buildName);
        jPackConfig.set('importPrefix', '../../');
    }

    jPackConfig.set('assetsFullpath', path.join(basePath, jPackConfig.get('assetsPath')));
    jPackConfig.set('buildJsFilePath', path.join(basePath, jPackConfig.get('assetsPath'), 'build.js'));
    jPackConfig.set('buildTemplatePath', path.join(basePath, 'config', 'jpack.template'));
    jPackConfig.set('wrapperPath', path.join(basePath, 'config', 'jpack.wrapper.js'));

    const onCheckConfig = jPackConfig.get('onCheckConfig');
    if (typeof onCheckConfig === 'function') {
        onCheckConfig();
    }
}
