
# jizy-packer

A CLI tool and Node.js library to generate optimized builds for your projects. It provides utilities for configuration management, build orchestration, and file operations.

## Features

- Command-line interface for building projects (init & build)
- Configurable via JSON and programmatic API
- Utilities for cleaning build folders and managing configs
- Rollup-based build process with plugin support
- When the name of the build is "example"
  * mirrors the base example-base folder (no override)
  * moves the content of build/example to the example folder

## Create a jPacker

Init the jizy-packer in your project:

```sh
npm install jizy-packer
node ./node_modules/jizy-packer/cli/init.js
```

Examples in all jizy packages
@jizy-browser 
@jizy-cooky
etc.

Look into these packages for the file architecture.

./cli/jpack.js
./config/jpack.js
./config/jpack.template
./config/jpack.wrapper.js

## Quick Usage

### CLI

```sh
node ./cli/jpack.js --debug
node ./cli/jpack.js --action build --name perso --config {"key":"value"}
node ./cli/jpack.js --action build --name perso --config ABSOLUTE_PATH_TO_JSON_FILE
```

Options:
- `--action, -a`  Build action (dist|build)
- `--name, -n`    Name of the build
- `--config, -c`  Path to the custom config file or JSON string
- `--debug, -d`   Enable debug mode

### Programmatic

```js
import jPackBuild from './lib/Build.js';

await jPackBuild({
	action: 'build',
	name: 'perso',
	config: 'PATH_TO_JSON_FILE',
	debug: true
});
```
