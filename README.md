
# jizy-packer

A CLI tool and Node.js library to generate optimized builds for your projects. It provides utilities for configuration management, build orchestration, and file operations.

## Features

- Command-line interface for building projects
- Configurable via JSON and programmatic API
- Utilities for cleaning build folders and managing configs
- Rollup-based build process with plugin support

## Quick Usage

### CLI

```sh
node lib/Cli.js
node lib/Cli.js --action build --name perso --config { "key": "value" }
node lib/Cli.js --action build --name perso --config ABSOLUTE_PATH_TO_JSON_FILE
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

### Create a jPacker

Example from the "jizy-browser" extension.

***First for the default dist build***

#### ./config/config.json
```json
{
    "desktopBreakpoint": "900px"
}
```

#### ./config/jpack.js
```js
import fs from 'fs';
import path from 'path';
import { LogMe, jPackConfig } from 'jizy-packer';

const jPackData = {
    name: 'BrowserCompat',
    alias: 'jizy-browser',

    onCheckConfig: () => { 
        // add some config validation
        const desktopBreakpoint = jPackConfig.get('desktopBreakpoint');
        if (!desktopBreakpoint) {
            LogMe.error('Missing desktopBreakpoint in config');
            process.exit(1);
        }
    },

    // generate config.less
    onGenerateBuildJs: (code) => {
        LogMe.log('Generate config.less');
        const desktopBreakpoint = jPackConfig.get('desktopBreakpoint') ?? '768px';
        let lessContent = `@desktop-breakpoint: ${desktopBreakpoint};\n`;
        lessContent += `@mobile-breakpoint: @desktop-breakpoint - 1px;`;
        fs.writeFileSync(path.join(jPackConfig.get('targetPath'), 'config.less'), lessContent);
        return code;
    },

    // parse wrapped js
    onGenerateWrappedJs: (wrapped) => wrapped,

    // after packing
    onPacked: () => { }
};

export default jPackData;
```

#### ./config/jpack.template
```js
import BrowserCompat from '{{PREFIX}}lib/js/browsercompat.js';
import '{{PREFIX}}lib/browsercompat.less';
export default BrowserCompat;
```

#### ./config/jpack.wrapper.js
```js
/*! BrowserCompat v@VERSION | @DATE | [@BUNDLE] */
(function (global) {
    "use strict";

    if (typeof global !== "object" || !global || !global.document) {
        throw new Error("BrowserCompat requires a window and a document");
    }

    if (typeof global.BrowserCompat !== "undefined") {
        throw new Error("BrowserCompat is already defined");
    }

    // @CODE 

    global.BrowserCompat = BrowserCompat;

})(typeof window !== "undefined" ? window : this);
```
