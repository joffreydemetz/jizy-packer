
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
