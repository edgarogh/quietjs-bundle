// @ts-check

// Compile this file with `npm run-script testbundle` and open test/index.html

const quiet = require('../');

document.querySelector('button').onclick = () => quiet.addReadyCallback(
    function success() {

        quiet.receiver({
            profile: 'ultrasonic',
            onReceive: console.log,
            onCreate() {
                console.info('Receiver ready');
            }
        });

        quiet.transmitter({
            profile: 'ultrasonic',
            onFinish() {
                console.info('Transmission finished');
            }
        }).transmit(quiet.str2ab('hello'));

    },
    function error(e) {
        console.error('addReadyCallback reported an error', e);
    }
);
