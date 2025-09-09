import fs from 'fs';
import path from 'path';
import LogMe from './LogMe.js';

export function emptyTargetPath(targetPath, removeEmpty = false) {
    if (!fs.existsSync(targetPath)) {
        if (removeEmpty) {
            return;
        }
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
                    emptyTargetPath(fullPath, true);
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
        if (removeEmpty) {
            LogMe.log('  [RM] ' + targetPath);
            fs.rmdirSync(targetPath);
        }
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

export function generateLessVariablesFromConfig(variablesPath, targetVariablesPath, variables) {
    const _variables = parseLessVariablesToObject(variablesPath);
    variables = { ..._variables, ...variables };

    const less = '';
    Object.keys(variables).forEach(key => {
        // replace camelcase to kebab-case for less variable names
        const variableName = key.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
        less += `@${variableName}: ${variables[key]};` + "\n";
    });
    fs.writeFileSync(targetVariablesPath, less, { encoding: 'utf8' });
};

export function deleteLessVariablesFile(variablesPath) {
    if (fs.existsSync(variablesPath)) {
        LogMe.log('Delete lib/less/_variables.less');
        fs.unlinkSync(variablesPath);
    }
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

function parseLessVariablesToObject(variablesPath) {
    const variables = {};

    if (!fs.existsSync(variablesPath)) {
        return variables;
    }

    const data = fs.readFileSync(variablesPath, 'utf8');
    const lines = data.split('\n');

    lines.forEach(line => {
        const match = line.match(/@([a-zA-Z0-9-_]+):\s*(.+);/);
        if (match) {
            variables[match[1]] = match[2];
        }
    });

    return variables;
}
