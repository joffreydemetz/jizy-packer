// Drives a real `dist` build of this fixture through the local packer.
// Spawned (cwd = this dir) by tests/build.test.js; jPackBuild calls process.exit().
import jPackConfig from '../../../lib/Config.js';
import jPackBuild from '../../../lib/Build.js';

jPackConfig.set('basePath', process.cwd());
jPackConfig.sets({ name: 'Widget', alias: 'widget' });

await jPackBuild({ action: 'dist' });
