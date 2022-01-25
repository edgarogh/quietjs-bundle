import { encode as encodeBase64 } from 'base64-arraybuffer';
import chalk from 'chalk';
import { writeFile as fsWriteFile, readFile as fsReadFile } from 'fs/promises';
import fetch from 'node-fetch';

const { name: moduleName } = JSON.parse(await fsReadFile('package.json', 'utf-8'));

const quietRepo = 'https://raw.githubusercontent.com/quiet/quiet-js/72782542a41f1b615a02c2ab43a0edb56edb6ce4/';

const requirements = {
    quietEs: quietRepo + 'quiet-emscripten.js',
    quietEsMem: quietRepo + 'quiet-emscripten.js.mem',
    quietProfiles: quietRepo + 'quiet-profiles.json',
    quietBase: quietRepo + 'quiet.js'
};

const log = console.log.bind(console, chalk.bgBlack.white(moduleName));

async function downloadRequirements() {
    const total = Object.keys(requirements).length;
    let step = -1;

    function incrementProgress() {
        process.stdout.clearLine();
        process.stdout.cursorTo(0);
        process.stdout.write(Math.ceil(100 * (++step) / total) + '%');
    }

    incrementProgress();

    return Promise.all(Object.keys(requirements).map(async key => {
        const url = requirements[key];
        const res = await fetch(url);

        requirements[key] = await (url.endsWith('mem')
            ? res.arrayBuffer()
            : res.text()
        );

        incrementProgress();
    }));
}

/**
 * @param {Buffer} buffer
 */
function bufferToLiteral(buffer) {
    return 'Uint8Array.from(atob(`'
        + encodeBase64(buffer)
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
    console.log();

    log('Bundling...');

    let code = [
        `let mem=${bufferToLiteral(requirements.quietEsMem)}`,
        replaceFunctionBody(requirements.quietBase, 'setProfilesPrefix', `onProfilesFetch(${'\`' + requirements.quietProfiles + '\`'})`),
        `Quiet.init({profilesPrefix: 'https://quiet.github.io/quiet-js/javascripts/', memoryInitializerPrefix: 'https://quiet.github.io/quiet-js/javascripts/'})`,
        replaceFunctionBody(requirements.quietEs, 'Module["readAsync"]', 'onload(mem);'),
        `Quiet.Module=Module`,
        `module.exports=Quiet`
    ].join(';\n');

    const profileNames = Object.keys(JSON.parse(requirements.quietProfiles));
    log(`${profileNames.length} profiles names found in 'quiet-profiles.json', creating 'index.d.ts'`);
    const indexDTs = await fsReadFile('template.index.d.ts', 'utf8');
    await fsWriteFile(
        'index.d.ts',
        indexDTs.replace(
            /type ProfileName = ['a-zA-Z0-9| ]*;/, `type ProfileName = ${profileNames.map((p) => `'${p}'`).join(' | ')};`
        )
    );

    await fsWriteFile('_bundle.js', code);
    log(chalk.greenBright('Finished ! Module ready to use !'))
}

bundle().catch(e => { throw e });
