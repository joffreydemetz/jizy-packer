import fs from 'fs';
import path from 'path';

import LogMe from './LogMe.js';

export function emptyTargetPath(targetPath) {
    if (!fs.existsSync(targetPath)) {
        fs.mkdirSync(targetPath, { recursive: true });
    }

    if (!fs.lstatSync(targetPath).isDirectory()) {
        throw new Error(`Target path is not a directory`);
    }

    let files = fs.readdirSync(targetPath);

    if (files.length > 0) {
        for (const file of files) {
            const fullPath = path.join(targetPath, file);
            if (fs.lstatSync(fullPath).isDirectory()) {
                try {
                    emptyTargetPath(fullPath);
                } catch (error) {
                    LogMe.error('Failed to empty directory: ' + fullPath);
                    LogMe.error(error.message);
                }
            }
            else {
                fs.unlinkSync(fullPath);
                LogMe.log('  [RM] ' + fullPath);
            }
        }

        files = fs.readdirSync(targetPath);
    }

    if (files.length === 0) {
        LogMe.log('  [RM] ' + targetPath);
        fs.rmdirSync(targetPath);
    }
};

export function loadJson(filePath) {
    try {
        if (!fs.existsSync(filePath)) {
            throw new Error('File not found');
        }

        const data = fs.readFileSync(filePath, 'utf8');
        const json = JSON.parse(data);
        return json;

    } catch (error) {
        throw new Error(`Failed to load JSON file: ${filePath}\n${error.message}`);
    }
};

export function loadJsonConfigs(...configs) {
    const loadedConfigs = [];
    for (const configPath of configs) {
        if (!fs.existsSync(configPath)) {
            continue;
        }
        loadedConfigs.push(loadJson(configPath));
    }
    let mergedConfig = {};
    for (const conf of loadedConfigs) {
        mergedConfig = deepMerge(mergedConfig, conf);
    }
    return mergedConfig;
};

function isObject(item) {
    return (item && typeof item === 'object' && !Array.isArray(item));
}

function deepMerge(target, source) {
    for (const key in source) {
        if (isObject(source[key])) {
            if (!target[key]) Object.assign(target, { [key]: {} });
            deepMerge(target[key], source[key]);
        } else {
            target[key] = source[key];
        }
    }
    return target;
}
