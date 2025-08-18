import yargs from "yargs/yargs";
import { hideBin } from 'yargs/helpers';
import jPackBuild from "./Build.js";
import jPackConfig from "./Config.js";

const jPackCli = function (cfg) {
    jPackConfig.set('basePath', process.cwd());
    jPackConfig.sets(cfg);

    const command = yargs(hideBin(process.argv))
        .usage('Usage: $0 <command> [options]')
        .option('target', {
            alias: 't',
            type: 'string',
            description: 'Target path',
            default: '',
        })
        .option('name', {
            alias: 'n',
            type: 'string',
            description: 'Set the build name',
            default: '',
        })
        .option('zip', {
            alias: 'z',
            type: 'boolean',
            description: 'Create a zip file',
            default: false,
        })
        .option('debug', {
            alias: 'd',
            type: 'boolean',
            description: 'Enable debug mode',
            default: false,
        })
        .help()
        .alias('help', 'h');

    const argv = command.parse();
    jPackBuild(argv);
};

export default jPackCli;