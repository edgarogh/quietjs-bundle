interface Quiet {
    ab2str(ab: ArrayBuffer): string;
    str2ab(str: string): ArrayBuffer;
    mergeab(ab1: ArrayBuffer, ab2: ArrayBuffer): Uint8Array;

    addReadyCallback(success: () => void, error?: (error: any) => void): void;
    transmitter(options: TransmitterOptions): Transmitter;
    receiver(options: ReceiverOptions): Receiver;
    disconnect(): void;

    Module: Record<string, any>;
}

declare const quiet: Quiet;
export = quiet;

// Common

type Profile = string | Record<string, any>;

// Transmitter

interface TransmitterOptions {
    profile: Profile;
    onFinish?: () => void;
    onEnqueue?: () => void;
    clampFrame?: boolean;
}

interface Transmitter {
    transmit(payload: ArrayBuffer): void;
    frameLength: number;
    getAverageEncodeTime(): number;

    destroy(): void;
}

// Receiver

interface Complex {
    real: number;
    imag: number;
}

interface ReceiverStats {
    symbols: Complex[];
    receivedSignalStrengthIndicator: number;
    errorVectorMagnitude: number;
}

interface ReceiverOptions {
    profile: Profile;
    onReceive: (payload: ArrayBuffer) => void;
    onCreate?: () => void;
    onCreateFail?: (reason: string) => void;
    onReceiveFail?: (failedCount: number) => void;
    onReceiverStatsUpdate?: (stats: ReceiverStats[]) => void;
}

interface Receiver {
    getAverageDecodeTime(): number;
    destroy(): void;
}
