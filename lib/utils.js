import fs from 'fs';
import path from 'path';
import LogMe from './LogMe.js';
import { fileURLToPath } from 'url';

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

    let less = '';
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

/**
 * 
 * @param {string} src 
 * @param {string} dest 
 * @param {boolean} overwrite  overwrite existing files 
 * @param {boolean} empty      remove source after copy (move)
 */
export function moveFolderFiles(src, dest, overwrite = true, empty = true) {
    if (!fs.existsSync(src)) {
        return;
    }

    fs.mkdirSync(dest, { recursive: true });

    fs.readdirSync(src).forEach(file => {
        const srcPath = path.join(src, file);
        const destPath = path.join(dest, file);
        if (fs.lstatSync(srcPath).isDirectory()) {
            moveFolderFiles(srcPath, destPath, overwrite, false);
        } else {
            if (!overwrite && fs.existsSync(destPath)) {
                return;
            }
            fs.copyFileSync(srcPath, destPath);
        }
    });

    if (empty) {
        fs.rmdirSync(src, { recursive: true });
    }
};

/**
 * Mirrors example folder
 * If the files exist they are not overwritten
 * - index.html
 * - favicon.ico
 * - css/main.css
 * - js/main.js
 * - images/
 */
export function mirrorExampleFiles(targetDir, replacements) {
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);

    const exampleDir = path.join(__dirname, '/../_example');

    fs.mkdirSync(targetDir, { recursive: true });
    
    const files = [
        'css/',
        'js/',
        'images/',
        'index.html',
        'favicon.ico',
        'css/main.css',
        'js/main.js'
    ];

    files.forEach(file => {
        const srcPath = path.join(exampleDir, file);
        const destPath = path.join(targetDir, file);

        if (fs.existsSync(destPath)) {
            return;
        }

        if (!fs.existsSync(srcPath)) {
            return;
        }

        if (fs.lstatSync(srcPath).isDirectory()) {
            fs.mkdirSync(destPath, { recursive: true });
            return;
        }

        let content = fs.readFileSync(srcPath);
        if (content) {
            replacements.forEach(replacement => {
                const { placeholder, value } = replacement;
                const regex = new RegExp(placeholder, 'g');
                content = content.toString().replace(regex, value);
            });
        }
        
        fs.writeFileSync(destPath, content, { encoding: 'utf8' });
    });
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
