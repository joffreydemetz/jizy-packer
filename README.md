
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
node ./cli/jpack.js --debug
node ./cli/jpack.js --action build --name perso --config { "key": "value" }
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

### Create a jPacker

Example from the "jizy-browser" extension.

***First for the default dist build***

#### ./cli/jpack.js
```js
import { jPackCli } from 'jizy-packer';
import jPackData from '../config/jpack.js';
jPackCli(jPackData);
```

#### ./config/jpack.js
```js
import fs from 'fs';
import path from 'path';
import { LogMe, jPackConfig } from 'jizy-packer';

const jPackData = function () {
    jPackConfig.sets({
        name: 'BrowserCompat',
        alias: 'jizy-browser',
        desktopBreakpoint: "900px"
    });

    jPackConfig.set('onCheckConfig', () => { });

    jPackConfig.set('onGenerateBuildJs', (code) => {
        LogMe.log('Generate config.less');
        LogMe.log('  path: ' + path.join(jPackConfig.get('targetPath'), 'config.less'));
        const desktopBreakpoint = jPackConfig.get('desktopBreakpoint') ?? '768px';
        let lessContent = `@desktop-breakpoint: ${desktopBreakpoint};` + "\n";
        lessContent += `@mobile-breakpoint: @desktop-breakpoint - 1px;`;
        fs.writeFileSync(path.join(jPackConfig.get('targetPath'), 'config.less'), lessContent);
        return code;
    });

    jPackConfig.set('onGenerateWrappedJs', (wrapped) => wrapped);

    jPackConfig.set('onPacked', () => { });
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
