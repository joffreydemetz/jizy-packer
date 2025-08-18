import fs from 'fs';
import path from 'path';
import LogMe from './LogMe.js';

export function removeEmptyDirs(dir) {
    if (!fs.existsSync(dir)) return;

    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.lstatSync(fullPath).isDirectory()) {
            removeEmptyDirs(fullPath);
        }
    }

    // After removing subdirs, check if current dir is empty
    if (fs.readdirSync(dir).length === 0) {
        fs.rmdirSync(dir);
    }
};

export function cleanBuildFolder(buildPath) {
    LogMe.log('cleanBuildFolder()');

    if (fs.existsSync(buildPath)) {
        LogMe.log('  Cleanup');
        fs.readdirSync(buildPath).forEach(file => {
            if (file !== 'config.json') {
                const filePath = path.join(buildPath, file);
                if (fs.lstatSync(filePath).isDirectory()) {
                    fs.rmSync(filePath, { recursive: true, force: true });
                    LogMe.log('  - [RM] ' + filePath);
                } else {
                    fs.unlinkSync(filePath);
                    LogMe.log('  - [RM] ' + filePath);
                }
            }
        });
    } else {
        fs.mkdirSync(buildPath, { recursive: true });
        LogMe.log('  Created target directory');
    }
};