import fs from 'fs';
import path from 'path';
import postcss from "rollup-plugin-postcss";
import url from "@rollup/plugin-url";
import json from "@rollup/plugin-json";
import resolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import terser from '@rollup/plugin-terser';

import jPackConfig from "./Config.js";
import LogMe from "./LogMe.js";
import { emptyTargetPath } from './utils.js';

export default async function jPackRollup(config) {
    return [
        {
            name: 'beforeBuild',
            buildStart() {
                LogMe.log('Prepare build folder');
                emptyTargetPath(jPackConfig.get('targetPath'));
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
            destDir: jPackConfig.get('targetRelativePath') + '/fonts/',
        }),

        url({
            include: ['**/*.png'],
            limit: 0,
            emitFiles: true,
            fileName: '[name][extname]',
            destDir: jPackConfig.get('targetRelativePath') + '/images/',
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

function cleanBuildFolder() {
}

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
    const targetPath = jPackConfig.get('targetPath');

    fs.readdirSync(jPackConfig.get('targetRelativePath') + '/js')
        .filter(file => file.endsWith('.css'))
        .forEach(file => {
            const oldPath = path.join(jPackConfig.get('targetRelativePath') + '/js', file);
            const newPath = path.join(jPackConfig.get('targetRelativePath') + '/css', file);
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

    fs.readdirSync(jPackConfig.get('targetPath')).forEach(file => {
        const filePath = path.join(jPackConfig.get('targetPath'), file);
        if (fs.lstatSync(filePath).isDirectory()) {
            if (fs.readdirSync(filePath).length === 0) {
                fs.rmdirSync(filePath);
                LogMe.log('Removed empty folder: ' + filePath);
            }
        }
    });
}
