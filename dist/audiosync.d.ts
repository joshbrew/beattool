import './hacktimer/HackTimer.min.js';
import { Howl } from 'howler';
export type Timing = number | `${number}/${number}`;
export type BeatSettings = {
    interval: Timing;
    tempo?: number;
    onBeat?: (sound: any, now: number, startTime: number, intervals: any) => void;
} & {
    [key: string]: {
        interval: Timing;
        tempo?: number;
        duration?: number;
        onBeat: (sound: any, now: number, startTime: number, intervals: any) => void;
        repeatEvery?: number;
        repeatUntil?: number;
    } | any;
};
export declare class AudioSync {
    sound: Howl;
    interval?: number;
    src: string[];
    settings: BeatSettings;
    subIntervals: {
        [key: string]: {
            intv: number;
            startTime: number;
            timeout: number;
        };
    };
    times: number[];
    onplay: () => void;
    stopped: boolean;
    constructor(src?: string[], settings?: BeatSettings, playAll?: boolean);
    init: (src?: string[], settings?: BeatSettings, playAll?: boolean) => Promise<unknown>;
    play(onplay?: () => void, id?: number): void;
    stop(onstop?: () => void, id?: number): boolean;
    calcInterval: (signature: string, tempo: number) => number;
}
