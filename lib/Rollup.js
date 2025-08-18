import fs from 'fs';
import path from 'path';
import postcss from "rollup-plugin-postcss";
import url from "@rollup/plugin-url";
import json from "@rollup/plugin-json";
import resolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import terser from '@rollup/plugin-terser';
import { execSync } from 'child_process';

import jPackConfig from "./Config.js";
import LogMe from "./LogMe.js";
import { cleanBuildFolder } from "./utils.js";

export default async function jPackRollup(config) {
    const assetsPath = jPackConfig.get('assetsPath');

    return [
        {
            name: 'beforeBuild',
            buildStart() {
                // target folder exists so empty
                // should not happen since it's required to have an empty target folder
                cleanBuildFolder(assetsPath);
            },
        },

        {
            name: 'preprocess',
            buildStart() {
                generateBuildJs();
            },
        },

        postcss({
            extract: jPackConfig.get('alias') + '.min.css', // Save CSS to dist/css/
            minimize: true, // Minify CSS
            sourceMap: false, // Disable source map for CSS
            extensions: ['.less'], // Process LESS files
        }),

        url({
            include: ['**/*.woff', '**/*.woff2'],
            limit: 0,
            emitFiles: true,
            fileName: '[name][extname]',
            destDir: assetsPath + '/fonts/',
        }),

        url({
            include: ['**/*.png'],
            limit: 0,
            emitFiles: true,
            fileName: '[name][extname]',
            destDir: assetsPath + '/images/',
        }),

        json(), // Handle JSON imports
        resolve(), // Resolve Node.js modules
        commonjs(), // Convert CommonJS modules to ES6

        {
            name: 'wrap',
            renderChunk(code) {
                return generateWrappedJs(code);
            },
        },

        terser(),

        {
            name: 'jpacked',
            writeBundle() {
                onPacked();
            },
        }
    ];
};

function generateBuildJs() {
    LogMe.log('Generate the build.js file ...');

    // Read the build template
    let code = fs.readFileSync(jPackConfig.get('buildTemplatePath'), 'utf8');

    // append config callback
    const onGenerateBuildJs = jPackConfig.get('onGenerateBuildJs');
    if (typeof onGenerateBuildJs === 'function') {
        console.log('Calling onGenerateBuildJs callback');
        code = onGenerateBuildJs(code);
    }

    code = code.replace(/{{PREFIX}}/g, jPackConfig.get('importPrefix'));

    fs.writeFileSync(jPackConfig.get('buildJsFilePath'), code, 'utf8');

    if (fs.existsSync(jPackConfig.get('buildJsFilePath'))) {
        LogMe.log('Generated build successfully in "' + jPackConfig.get('buildJsFilePath') + '"');
    } else {
        console.error('Error: Generated build file not found: ' + jPackConfig.get('buildJsFilePath'));
        process.exit(1);
    }
}

function generateWrappedJs(code) {
    LogMe.log('Generate the wrapper.js file ...');

    const date = new Date();
    const wrapper = fs.readFileSync(jPackConfig.get('wrapperPath'), 'utf8');

    const marker = '// @CODE';
    const codePosition = wrapper.indexOf(marker);
    if (codePosition === -1) {
        console.error('Error: "// @CODE" not found in wrapper file');
        process.exit(1);
    }

    // Insert code after the marker (keeping the marker and its line)
    const markerEnd = codePosition + marker.length;
    // Find the end of the line (so code is inserted after the marker's line)
    const lineEnd = wrapper.indexOf('\n', markerEnd);
    let insertPos = lineEnd !== -1 ? lineEnd + 1 : markerEnd;

    let wrapped = wrapper.slice(0, insertPos) + code + '\n' + wrapper.slice(insertPos);

    wrapped = wrapped.replace(marker, '');
    wrapped = wrapped.replace(/@VERSION/g, jPackConfig.get('version'));
    wrapped = wrapped.replace(/@BUNDLE/g, jPackConfig.get('buildName'));
    wrapped = wrapped.replace(/@DATE/g, date.toISOString().replace(/:\d+\.\d+Z$/, "Z"));

    const onGenerateWrappedJs = jPackConfig.get('onGenerateWrappedJs');
    if (typeof onGenerateWrappedJs === 'function') {
        wrapped = onGenerateWrappedJs(wrapped);
    }

    return wrapped;
}

function onPacked() {
    LogMe.log('Build completed successfully.');

    moveCssFiles();

    const onPacked = jPackConfig.get('onPacked');
    if (typeof onPacked === 'function') {
        onPacked();
    }

    // Cleanup the build folder
    cleanupBuild();

    LogMe.log('Build process completed.');
}

function moveCssFiles() {
    LogMe.log('Moving CSS files from js/ to css/ ...');
    const assetsPath = jPackConfig.get('assetsPath');

    fs.readdirSync(assetsPath + '/js')
        .filter(file => file.endsWith('.css'))
        .forEach(file => {
            const oldPath = path.join(assetsPath + '/js', file);
            const newPath = path.join(assetsPath + '/css', file);
            fs.mkdirSync(path.dirname(newPath), { recursive: true });
            fs.renameSync(oldPath, newPath);
            LogMe.log('- ' + file);
        });
}

function cleanupBuild() {
    LogMe.log('Cleaning up generated build ...');

    // Remove the generated build.js file
    if (fs.existsSync(jPackConfig.get('buildJsFilePath'))) {
        LogMe.log('Removed generated build.js file');
        fs.unlinkSync(jPackConfig.get('buildJsFilePath'));
    }

    let emptyBuildFolder = false;
    const ignoreRemove = [];

    if (jPackConfig.get('buildZip')) {
        LogMe.log('Creating zip file ...');
        const zipFilePath = path.join(jPackConfig.get('assetsFullpath'), jPackConfig.get('buildName') + '.zip');

        execSync(`cd ${jPackConfig.get('assetsFullpath')} && zip -r ${zipFilePath} .`, { stdio: 'inherit' });
        LogMe.log('-> ' + zipFilePath);

        if (jPackConfig.get('buildTarget')) {
            LogMe.log('Transfer zip file ...');
            const zipTargetPath = path.join(jPackConfig.get('buildTarget'), jPackConfig.get('buildName') + '.zip');
            fs.copyFileSync(zipFilePath, zipTargetPath);
            LogMe.log('-> ' + zipTargetPath);
        }

        emptyBuildFolder = true;
        ignoreRemove.push(zipFilePath);
    }
    else if (jPackConfig.get('buildTarget') && jPackConfig.get('assetsPath') !== 'dist') {
        LogMe.log('Copy generated build folder ...');

        fs.mkdirSync(jPackConfig.get('buildTarget'), { recursive: true });

        // Iterate over the files and directories in jPackConfig.get('assetsPath')
        fs.readdirSync(jPackConfig.get('assetsPath')).forEach(file => {
            const sourcePath = path.join(jPackConfig.get('assetsPath'), file);
            const destinationPath = path.join(jPackConfig.get('buildTarget'), file);

            if (fs.lstatSync(sourcePath).isDirectory()) {
                // Recursively copy directories
                fs.mkdirSync(destinationPath, { recursive: true });
                fs.readdirSync(sourcePath).forEach(subFile => {
                    const subSourcePath = path.join(sourcePath, subFile);
                    const subDestinationPath = path.join(destinationPath, subFile);
                    fs.copyFileSync(subSourcePath, subDestinationPath);
                    LogMe.log('- Copied file: ' + subDestinationPath);
                });
            } else {
                // Copy files
                fs.copyFileSync(sourcePath, destinationPath);
                LogMe.log('- Copied file: ' + destinationPath);
            }
        });

        emptyBuildFolder = true;
    }

    if (emptyBuildFolder) {
        LogMe.log('Cleaning up build folder ...');

        fs.readdirSync(jPackConfig.get('assetsPath')).forEach(file => {
            const filePath = path.join(jPackConfig.get('assetsPath'), file);
            if (fs.lstatSync(filePath).isDirectory()) {
                fs.rmSync(filePath, { recursive: true, force: true });
                LogMe.log('Removed folder: ' + filePath);
            }
            else {
                if (filePath.endsWith('.zip')) {
                    return;
                }

                fs.unlinkSync(filePath);
                LogMe.log('Removed file: ' + filePath);
            }
        });
    }
    else {
        fs.readdirSync(jPackConfig.get('assetsPath')).forEach(file => {
            const filePath = path.join(jPackConfig.get('assetsPath'), file);
            if (fs.lstatSync(filePath).isDirectory()) {
                if (fs.readdirSync(filePath).length === 0) {
                    fs.rmdirSync(filePath);
                    LogMe.log('Removed empty folder: ' + filePath);
                }
            }
        });
    }
}
