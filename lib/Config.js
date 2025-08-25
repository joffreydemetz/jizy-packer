import fs from 'fs';
import path from 'path';

const config = {};

const jPackConfig = {
    /**
     * Returns a shallow copy of the current config object
     * replacing functions with 'fn'.
     */
    all: function () {
        const result = {};
        for (const key in config) {
            if (typeof config[key] === 'function') {
                result[key] = 'fn';
            }
            else {
                result[key] = config[key];
            }
        }
        return result;
    },

    /**
     * Loads the version from package.json and sets it in the config under 'version'.
     */
    setPackageVersion: function () {
        const pkgPath = path.join(jPackConfig.get('basePath'), 'package.json');

        if (fs.existsSync(pkgPath)) {
            const data = fs.readFileSync(pkgPath, 'utf8');
            const json = JSON.parse(data);

            if (json.version) {
                this.set('version', json.version);
                return;
            }
        }

        this.set('version', '0.0.1');
    },

    /**
     * Validates and prepares the config object, setting paths and defaults as needed.
     * Throws if required fields are missing.
     */
    validate: function () {
        if (!config.basePath) {
            throw new Error('Invalid configuration: basePath is required.');
        }

        if (!config.buildName) {
            throw new Error('Invalid configuration: buildName is required.');
        }

        if (config.action === 'dist') {
            config.importPrefix = '../';
            config.targetRelativePath = 'dist';
            config.targetPath = path.join(config.basePath, 'dist');
        }
        else {
            config.importPrefix = '../../';
            config.targetPath = path.join(config.basePath, 'build', config.buildName);
            config.targetRelativePath = 'build/' + config.buildName;
        }

        config.buildJsFilePath = path.join(config.targetPath, 'build.js');
        config.buildTemplatePath = path.join(config.basePath, 'config', 'jpack.template');
        config.wrapperPath = path.join(config.basePath, 'config', 'jpack.wrapper.js');

        if (typeof config.onCheckConfig === 'function') {
            config.onCheckConfig();
        }

        if (!config.alias) {
            config.alias = config.name.toLowerCase();
            config.alias = config.alias.replace(/\s+/g, '-');
        }
    },

    /**
     * Merges a new config object into the current config.
     * @param {Object} newConfig - The config object to merge.
     */
    sets: (newConfig) => {
        if (typeof newConfig !== 'object' || newConfig === null) {
            throw new Error('Invalid configuration: newConfig must be an object.');
        }
        newConfig.array.forEach(element => {
            this.set(element, newConfig[element]);
        });
    },

    /**
     * Gets a config value by key, or returns the default if not set.
     * @param {string} key - The config key.
     * @param {*} def - The default value if key is not set.
     */
    get(key, def) {
        return config[key] || def;
    },

    /**
     * Sets a config value by key.
     * @param {string} key - The config key.
     * @param {*} value - The value to set.
     */
    set(key, value) {
        config[key] = value;
    }
};

export default jPackConfig;
