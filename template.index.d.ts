interface Quiet {
    /**
     * Convert an array buffer in UTF8 to string
     * @param {ArrayBuffer} ab - ArrayBuffer to be converted
     * @returns {string} Converted string
     */
    ab2str(ab: ArrayBuffer): string;

    /**
     * Convert a string to array buffer in UTF8
     * @param {string} string - String to be converted
     * @returns {ArrayBuffer} Converted ArrayBuffer
     */
    str2ab(string: string): ArrayBuffer;

    /**
     * Merge 2 ArrayBuffers. This is a convenience function to assist user 
     * receiver functions that want to aggregate multiple payloads.
     * @param {ArrayBuffer} ab1 - Beginning ArrayBuffer
     * @param {ArrayBuffer} ab2 - Ending ArrayBuffer
     * @returns {ArrayBuffer} ab1 merged with ab2
     */
    mergeab(ab1: ArrayBuffer, ab2: ArrayBuffer): Uint8Array;
    

    /**
     * Add a callback to be called when Quiet is ready for use, e.g. when 
     * transmitters and receivers can be created
     * @param {function} success - The user function which will be called
     * @param {function} [error] - User errback function
     * @example
     * addReadyCallback(function() { console.log("ready!"); });
     */
    addReadyCallback(success: () => void, error?: (error: any) => void): void;

    /**
     * Create a new transmitter configured by the given profile name
     * @param {object} options - Transmitter params
     * @returns {Transmitter} Transmitter object
     * @example
     * var tx = transmitter({profile: "robust", onFinish: function () { console.log("transmission complete"); }});
     * tx.transmit(quiet.str2ab("Hello, World!"));
     */
    transmitter(options: TransmitterOptions): Transmitter;

    /**
     * Create a new receiver with the profile specified by profile (should 
     * match profile of transmitter).
     * @param {object} options - Receiver params
     * @returns {Receiver} Receiver object
     * @example
     * receiver({profile: "robust", onReceive: function(payload) { console.log("received chunk of data: " + Quiet.ab2str(payload)); }});
     */
    receiver(options: ReceiverOptions): Receiver;

    /**
     * Disconnect quiet.js from its microphone source. This will disconnect 
     * quiet.js's microphone fully from all receivers. This is useful to cause 
     * the browser to stop displaying the microphone icon. Browser support is 
     * limited for disconnecting a single destination, so this call will 
     * disconnect all receivers. It is highly recommended to call this only 
     * after destroying any receivers.
     */
    disconnect(): void;
    
    Module: Record<string, any>;
}

declare const quiet: Quiet;
export = quiet;

// Common

type ProfileName = string;

type Profile = ProfileName | Record<string, any>;

// Transmitter

interface TransmitterOptions {
    /**
     * Name of profile to use, must be a key in quiet-profiles.json OR an object
     * which contains a single profile
     */
    profile: Profile;

    /**
     * User callback which will notify user when playback of all data in queue 
     * is complete if the user calls transmit multiple times before waiting for 
     * onFinish, then onFinish will be called only once after all of the data 
     * has been played out
     */
    onFinish?: () => void;

    /**
     * User callback which will notify user when all data passed to transmit() 
     * has been written to the transmit queue and has thus entered the transmit 
     * pipeline. For convenience, quiet.js is designed to hold as much data as 
     * you ask it to and write it to the libquiet transmit queue over time. 
     * This callback is handy because it informs the user that all data resides 
     * in libquiet, which is useful if you would like to stream data to the 
     * transmitter. This callback is the appropriate place to stream the next 
     * chunk. doing so will prevent excess memory bloat while maintaining the 
     * maximum transmit throughput. If the user calls transmit multiple times 
     * before waiting for onEnqueue, then onEnqueue will be called only once 
     * after all of the data has been played out
     */
    onEnqueue?: () => void;

    /**
     * Prevent frames from overlapping sample blocks. Web Audio collects sound 
     * samples in blocks, and the browser ensures that each block plays out 
     * smoothly and atomically. However, it is possible for playback gaps to 
     * occur between these blocks due to GC pause or similar conditions. This 
     * is especially common on mobile. Enabling this flag ensures that data 
     * frames do not overlap these sample blocks so that no playback gaps will 
     * occur within a frame, which greatly degrades error performance. Setting 
     * this flag to false will increase throughput but can significantly 
     * increase error rate. Defaults to true.
     */
    clampFrame?: boolean;
}

interface Transmitter {
    /**
     * Queue up array buffer and begin transmitting
     * @param {ArrayBuffer} payload - Bytes which will be encoded and sent to 
     * speaker
     * @example
     * transmit(quiet.str2ab("Hello, World!"));
     */
    transmit(payload: ArrayBuffer): void;

    /**
     * Length in bytes of each underlying transmit frame. Calls to transmit() 
     * will automatically slice passed arraybuffer into frames of this length 
     * or shorter
     */
    frameLength: number;

    /**
     * Returns average time in ms spent encoding data into sound samples over 
     * the last 3 runs
     */
    getAverageEncodeTime(): number;
    

    /**
     * Immediately stop playback and release all resources
     */
    destroy(): void;
}

// Receiver

interface Complex {
    real: number;
    imag: number;
}

interface ReceiverStats {
    /**
     * Received complex symbols
     */
    symbols: Complex[];

    /**
     * Strength of received signal, in dB
     */
    receivedSignalStrengthIndicator: number;

    /**
     * Magnitude of error vector between received symbols and reference 
     * symbols, in dB
     */
    errorVectorMagnitude: number;
}

interface ReceiverOptions {
    /**
     * Name of profile to use, must be a key in quiet-profiles.json OR an object
     * which contains a single profile
     */
    profile: Profile;

    /**
     * Callback used by receiver to notify user of data received via 
     * microphone/line-in.
     * @param {ArrayBuffer} payload - Chunk of data received
     */
    onReceive: (payload: ArrayBuffer) => void;

    /**
     * Callback to notify user that receiver has been created and is ready to 
     * receive. if the user needs to grant permission to use the microphone, 
     * this callback fires after that permission is granted.
     */
    onCreate?: () => void;

    /**
     * Callback used by receiver to notify user of errors in creating receiver.
     * This is a callback because frequently this will result when the user 
     * denies permission to use the mic, which happens long after the call to 
     * create the receiver.
     * @param {string} reason - Error message related to create fail
     */
    onCreateFail?: (reason: string) => void;

    /**
     * Callback used by receiver to notify user that a frame was received but
     * failed checksum. Frames that fail checksum are not sent to onReceive.
     * @param {number} total - Total number of frames failed across lifetime of 
     * receiver
     */
    onReceiveFail?: (failedCount: number) => void;

    /**
     * Callback used by receiver to notify user that new decoder stats were
     * generated. These stats provide instrumentation into the decoding process.
     * @param {Array} stats - Array of stats objects, one per frame detected by 
     * decoder
     */
    onReceiverStatsUpdate?: (stats: ReceiverStats[]) => void;
}

interface Receiver {
    /**
     * Returns average time in ms spent decoding data from sound samples over 
     * the last 3 runs
     */
    getAverageDecodeTime(): number;

    /**
     * Immediately stop sampling microphone and release all resources
     */
    destroy(): void;
}
