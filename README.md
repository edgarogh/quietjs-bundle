# [**quietjs-bundle**](https://www.npmjs.com/package/quietjs-bundle)

[![GitHub license](https://img.shields.io/github/license/edgarogh/quietjs-bundle.svg)](https://github.com/edgarogh/quietjs-bundle/blob/master/LICENSE)
[![David](https://img.shields.io/david/edgarogh/quietjs-bundle.svg)](https://www.npmjs.com/package/quietjs-bundle)

> quietjs-bundle is a ready-to-use bundled version of [quiet-js](https://github.com/quiet/quiet-js) that you can require in CommonJS/TypeScript-based web projects
> ```javascript
> const quiet = require('quietjs-bundle');
> 
> quiet.addReadyCallback(() => {
>    quiet.receiver({ profile: 'ultrasonic-experimental', onReceive: console.log });
> });
> ```

## Motivations
I needed to use [quiet-js](https://github.com/quiet/quiet-js) in a project, and was annoyed by the fact that I needed to serve many dependencies for the library to work and couldn't bundle everything in one file with a tool like [ParcelJS](https://parceljs.org/). I made this bundler, which automatically downloads all the required files from the latest version of quiet-js from its GitHub repository and combines the files together.

## Features
 * Bundles `quiet-emscripten.js.mem` (a binary file) using base64
 * Initializes the library as soon as the bundle is loaded on the webpage
 * Allows the whole code to be wrapped in an [IIFE](https://developer.mozilla.org/en-US/docs/Glossary/IIFE), so the global scope isn't polluted
 * Includes TypeScript definitions

## Installation
```bash
npm i quietjs-bundle
```
Installing the module will build the bundle a first time. If you want to rebuild it, navigate to `node_modules/quietjs-bundle` in your shell and run `npm run-script bundle`.

## TODO
 - [ ] More size-efficient `quiet-emscripten.js.mem` bundling (currently stored as a string litteral using base64)
 - [ ] Control over the version of quiet-js that is being downloaded (currently the latest `#master` commit, potentially unstable)
 - [x] Document the TypeScript definitions

## License
This project itself is licensed under the MIT license. However, this tool bundles code from different sources that each have their own license. You are entirely responsible for every bit of licensed code that can end up in the final script.

Since the whole downloading & building/bundling process involving externally licensed code happens on your computer, I don't think that I have to specify the license of each piece of code. After all, this project is just a _tool_ that does all the magic™. However, I'm not a lawyer, and if the previous statement is wrong, get in touch with me so I fix this !
