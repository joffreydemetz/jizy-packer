
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

Start by creating a new folder for your project:

```sh
mkdir my-project
cd my-project
```

Optionaly create a me.json file to define the default values for your projects.
You can use the same file as a reference in your own projects.

keywords will prepend the keywords array in your package.json & composer.json files.
gitAccount is your Git account or organization name.
gitPrefix is a prefix for your Git repositories.
authorName, authorEmail, authorWebsite are your personal information.
homepagePrefix is the prefix for your projects homepage URL. (homepage will be https://mywebsite.com/module-alias)

```json
{
  "keywords": ["johndoe"],
  "gitAccount": "your-account",
  "gitPrefix": "your-prefix",
  "authorName": "John Doe",
  "authorEmail": "john.doe@example.com",
  "authorWebsite": "https://john-doe.com",
  "homepagePrefix": "https://john-doe.com/your-project",
  "license": "MIT"
}
```

Init your NPM package:

```sh
npm init -y
```

Init your Git repository:

```sh
git init
```

Init the Packer for your project:

```sh
npm install jizy-packer
node ./node_modules/jizy-packer/cli/init.js
```

## Questions during the process

The init script will ask you several questions to configure your project.
You can set default values in the me.json file to pre-fill some questions.

### Module
Needed to build package.json, import statements, etc.

**Name**
Name of your module to be called 
ex: ModuleName
-> const myModule = new ModuleName(); 

**Alias**
Name of your NPM package
ex: new-module-name
-> import ModuleName from 'module-name';

### Git Repo
Needed to build repository URLs in package.json and composer.json

**Git Module**
Your Git module name in the format "account/repo"
ex: your-account/new-module-name

**Account**
Your Git account or organization name
ex: your-account

**Repository**
Name of your Git repository
ex: new-module-name

### Author
(Optional) Used to build author information in package.json and composer.json

**Name**
Your full name
ex: John Doe

**Email**
Your email address
ex: john.doe@example.com

**Website**
Your personal or company website
ex: https://your-website.com

### Miscellaneous
(Optional) Additional information for your package.json and composer.json

**Description**
A brief description of your package

**Keywords**
Comma separated keywords for your package
ex: jizy,jdz,example,packer
-> "keywords": [ "jizy", "jdz", "example", "packer" ]

**Homepage**
Your project homepage URL
ex: https://your-website.com/new-module-name

## Build your project

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
- `--target, -t`  Custom output directory (absolute path)
- `--debug, -d`   Enable debug mode (verbose build logging; the output is minified either way)

`dist` (the default) writes to `dist/`, `build` to `build/<name>/` (`custom` when no name is
given); `--target` replaces either location. Passing `--config` implies `build`; its keys are
merged over the package config, so a consumer can override anything `config/jpack.js` declares.

### Programmatic

```js
import { jPackBuild } from 'jizy-packer';

await jPackBuild({
	action: 'build',
	name: 'perso',
	config: 'PATH_TO_JSON_FILE',
	debug: true
});
```

## Using it in a package

Install it as a build-time dependency:

```sh
npm i -D jizy-packer
```

The init script scaffolds the files below from `_package/` (the `*.skel` files). The packer reads
them from the package root, so a package written by hand needs the same layout:

```
cli/jpack.js              # entry point: node ./cli/jpack.js
config/jpack.js           # name, alias, custom keys and hooks
config/jpack.template     # the rollup entry (what goes into the bundle)
config/jpack.wrapper.js   # the IIFE that exposes the browser global
lib/                      # the sources
dist/                     # the output of `dist` builds
```

### `cli/jpack.js`

```js
import { jPackCli } from 'jizy-packer';
import jPackData from '../config/jpack.js';
jPackCli(jPackData);
```

`jPackCli()` sets `basePath` to the working directory, runs your config function, parses the CLI
flags and starts the build — so run it from the package root (`npm run jpack:dist` with
`"jpack:dist": "node ./cli/jpack.js"`).

### `config/jpack.js`

```js
import { jPackConfig } from 'jizy-packer';

const jPackData = function () {
    jPackConfig.sets({
        name: 'MyWidget',      // the browser global (and the rollup IIFE name)
        alias: 'my-widget',    // output file names; defaults to the lower-cased name
    });

    jPackConfig.set('onCheckConfig', () => { });
    jPackConfig.set('onGenerateBuildJs', (code) => code);
    jPackConfig.set('onGenerateWrappedJs', (wrapped) => wrapped);
    jPackConfig.set('onPacked', () => { });
};

export default jPackData;
```

Any other key you set (a list of languages, of icon sets, …) is yours: read it back with
`jPackConfig.get(key)` in the hooks, and let consumers override it through `--config`.

### Build steps and hooks

1. **Config.** `--config` is merged in, `version` and `license` are read from `package.json`, and
   the paths are computed (`targetPath`, `targetRelativePath`, `importPrefix`, `buildJsFilePath`, …).
   Then **`onCheckConfig()`** runs: validate or normalise your own keys there.
2. **Entry.** `config/jpack.template` is read and passed through **`onGenerateBuildJs(code)`**,
   which returns the code (use it to generate imports from your config). Then `{{PREFIX}}` is
   replaced by the path from the output folder back to the package root (`../` for `dist`,
   `../../` for `build/<name>/`) and `{{TARGET_REL_PATH}}` by the output folder. The result is
   written as a temporary `build.js` in the output folder and used as the rollup input.
3. **Bundle.** Rollup resolves Node modules and CommonJS. `.less` imports are compiled, minified and
   extracted to `css/<alias>.min.css`; `.woff` / `.woff2` imports are copied to `fonts/` and `.png`
   imports to `images/`.
4. **Wrap.** The IIFE bundle is inserted into `config/jpack.wrapper.js` right after the line holding
   the `// @CODE` marker (the build stops if the marker is missing), the marker is removed, a banner
   (`/*! <name> v<version> | <license> | <date> | [<build name>] */`) is prepended, and the result
   goes through **`onGenerateWrappedJs(wrapped)`**. Then terser minifies it into `js/<alias>.min.js`.
5. **Packed.** Once written, **`onPacked()`** runs (copy assets, reshape the output folder…), then
   `build.js` and the empty folders are removed. An optional **`onComplete()`** hook runs last.

A minimal template and wrapper:

```js
// config/jpack.template
import MyWidget from '{{PREFIX}}lib/js/MyWidget.js';
import '{{PREFIX}}lib/index.less';

export default MyWidget;
```

```js
// config/jpack.wrapper.js
(function (global) {
    "use strict";

    if (typeof global.MyWidget !== "undefined") {
        throw new Error("MyWidget is already defined");
    }

    // @CODE

    global.MyWidget = MyWidget;
})(typeof window !== "undefined" ? window : this);
```

Theming goes through CSS custom properties declared in the package's LESS. Since 2.2.0 the packer no
longer generates LESS variables from the config: `generateLessVariablesFromConfig` and
`deleteLessVariablesFile` were removed, so a `config/jpack.js` that still imports them fails to load.

### Exports

```js
import { jPackCli, jPackBuild, jPackRollup, jPackConfig, LogMe } from 'jizy-packer';
```

- `jPackCli(jPackData)` — the CLI entry (above).
- `jPackBuild({ action, name, config, target, debug })` — the same build, called from code.
- `jPackRollup()` — the rollup plugin list the build uses.
- `jPackConfig` — the shared config store: `set(key, value)`, `sets(object)`, `get(key, def)`, `all()`.
- `LogMe` — `log`, `warn`, `error`, `debug`, `dir`; prints only in debug mode.

## Development

Run the example to test the full pipeline (scaffold + build):

```sh
npm run example
```

This creates a dummy "MyWidget" package in `examples/output/`, builds it with jizy-packer, and verifies the output.

Run the tests:

```sh
npm test                  # node --test
```

## License

MIT — see [LICENSE](LICENSE).
