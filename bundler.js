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

async function bundle() {
    log('Downloading requirements...');
    await downloadRequirements();

    log('Bundling...');

    let code = [
        `let mem=${bufferToLitteral(requirements.quietEsMem)}`,
        requirements.quietBase.replace(setProfilesDef, `onProfilesFetch(${'\`' + requirements.quietProfiles + '\`'})`),
        `Quiet.init({profilesPrefix: 'https://quiet.github.io/quiet-js/javascripts/', memoryInitializerPrefix: 'https://quiet.github.io/quiet-js/javascripts/'})`,
        requirements.quietEs.replace(readAsyncDef, 'Module["readAsync"]=function readAsync(url,onload,onerror){onload(mem);}'),
        `Quiet.Module=Module`,
        `module.exports=Quiet`
    ].join(';\n');

    await lafy(cb => fs.writeFile('_bundle.js', code, cb));
    log(chalk.greenBright('Finished ! Module ready to use !'))
}

bundle().catch(e => { throw e });

const setProfilesDef = `if (profilesFetched) {
            return;
        }
        if (!prefix.endsWith("/")) {
            prefix += "/";
        }
        var profilesPath = prefix + "quiet-profiles.json";

        var fetch = new Promise(function(resolve, reject) {
            var xhr = new XMLHttpRequest();
            xhr.overrideMimeType("application/json");
            xhr.open("GET", profilesPath, true);
            xhr.onload = function() {
                if (this.status >= 200 && this.status < 300) {
                    resolve(this.responseText);
                } else {
                    reject(this.statusText);
                }
            };
            xhr.onerror = function() {
                reject(this.statusText);
            };
            xhr.send();
        });

        fetch.then(function(body) {
            onProfilesFetch(body);
        }, function(err) {
            fail("fetch of quiet-profiles.json failed: " + err);
        });`;

const readAsyncDef = `Module["readAsync"]=function readAsync(url,onload,onerror){var xhr=new XMLHttpRequest;xhr.open("GET",url,true);xhr.responseType="arraybuffer";xhr.onload=function xhr_onload(){if(xhr.status==200||xhr.status==0&&xhr.response){onload(xhr.response)}else{onerror()}};xhr.onerror=onerror;xhr.send(null)}`;
