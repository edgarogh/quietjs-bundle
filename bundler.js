const { default: chalk } = require('chalk');
const fetch = require('node-fetch');
const fs = require('fs');
const lafy = require('lafy');
const progress = require('cli-progress');

const moduleName = require('./package.json').name;

const quietRepo = 'https://raw.githubusercontent.com/quiet/quiet-js/master/';

const requirements = {
    quietEs: quietRepo + 'quiet-emscripten.js',
    quietEsMem: quietRepo + 'quiet-emscripten.js.mem',
    quietProfiles: quietRepo + 'quiet-profiles.json',
    quietBase: quietRepo + 'quiet.js'
};

const log = console.log.bind(console, chalk.bgBlack.white(moduleName));

async function downloadRequirements() {
    const bar = new progress.Bar({
        format: `[{bar}] {value}/{total} {url}`,
        stopOnComplete: true,
        clearOnComplete: true
    }, progress.Presets.shades_classic);

    bar.start(Object.keys(requirements).length, 0);
    
    return Promise.all(Object.keys(requirements).map(async key => {
        const url = requirements[key];
        const res = await fetch(url);

        requirements[key] = await (url.endsWith('mem')
            ? res.buffer()
            : res.text()
        );

        bar.increment(1, {
            url
        });
    }));
}

/**
 * @param {Buffer} buffer
 */
function bufferToLitteral(buffer) {
    return 'Uint8Array.from(atob(`'
        + buffer.toString('base64')
        + '`), c => c.charCodeAt(0))';
}

/**
 * Replaces the body of a function, given its name
 * @param {string} code - Original code where the function is written
 * @param {string} name - Name of the function, or any text that precedes the 
 * first `{` of the function body
 * @param {string} replacement - New content for the function body
 * @returns {string} The new `code` with the modified function
 */
function replaceFunctionBody(code, name, replacement) {
    let depth = 0;
    let start = -1;
    let i;
    for (i = code.indexOf(name); ; i++) {
        if (code[i] === '{') {
            if (depth === 0) start = i + 1;
            depth++;
        };
        if (code[i] === '}') {
            depth--;
            if (!depth) break;
        }
    }

    const end = i;
    return code.substring(0, start) + replacement + code.substring(end);
}

async function bundle() {
    log('Downloading requirements...');
    await downloadRequirements();

    log('Bundling...');

    let code = [
        `let mem=${bufferToLitteral(requirements.quietEsMem)}`,
        replaceFunctionBody(requirements.quietBase, 'setProfilesPrefix', `onProfilesFetch(${'\`' + requirements.quietProfiles + '\`'})`),
        `Quiet.init({profilesPrefix: 'https://quiet.github.io/quiet-js/javascripts/', memoryInitializerPrefix: 'https://quiet.github.io/quiet-js/javascripts/'})`,
        replaceFunctionBody(requirements.quietEs, 'Module["readAsync"]', 'onload(mem);'),
        `Quiet.Module=Module`,
        `module.exports=Quiet`
    ].join(';\n');

    await lafy(cb => fs.writeFile('_bundle.js', code, cb));
    log(chalk.greenBright('Finished ! Module ready to use !'))
}

bundle().catch(e => { throw e });
