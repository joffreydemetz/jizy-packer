import fs from 'fs';
import path from 'path';

const config = {};

const jPackConfig = {
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

    loadFromJson: function (cfgPath) {
        if (!fs.existsSync(cfgPath)) {
            throw new Error(`Configuration file not found: ${cfgPath}`);
        }

        const data = fs.readFileSync(cfgPath, 'utf8');
        const json = JSON.parse(data);
        this.sets(json);
    },

    setPackageVersion: function () {
        const pkgPath = path.join(jPackConfig.get('basePath'), 'package.json');
        if (fs.existsSync(pkgPath)) {
            const data = fs.readFileSync(pkgPath, 'utf8');
            const json = JSON.parse(data);
            if (json.version) {
                this.set('version', json.version);
            }
        }
    },

    check: function () {
        if (!config.basePath) {
            throw new Error('Invalid configuration: basePath is required.');
        }

        if (!config.name) {
            throw new Error('Invalid configuration: name is required.');
        }

        if (!config.alias) {
            config.alias = config.name.toLowerCase();
            config.alias = config.alias.replace(/\s+/g, '-');
        }

        if (!config.cfg) {
            config.cfg = config.alias;
        }
    },

    sets: (newConfig) => {
        Object.assign(config, newConfig);
    },

    get(key, def) {
        return config[key] || def;
    },

    set(key, value) {
        config[key] = value;
    }
};

export default jPackConfig;
