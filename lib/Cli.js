import yargs from "yargs/yargs";
import { hideBin } from 'yargs/helpers';
import jPackBuild from "./Build.js";
import jPackConfig from "./Config.js";

const jPackCli = function (jPackData) {
    jPackConfig.set('basePath', process.cwd());
    jPackData();

    const command = yargs(hideBin(process.argv))
        .usage('Usage: $0 <command> [options]')
        .option('action', {
            alias: 'a',
            type: 'string',
            description: 'Set the build action (dist or build)',
            default: 'dist',
        })
        .option('name', {
            alias: 'n',
            type: 'string',
            description: 'Set the build name',
            default: '',
        })
        .option('config', {
            alias: 'c',
            type: 'string',
            description: 'Custom config absolute path or json string',
            default: '',
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