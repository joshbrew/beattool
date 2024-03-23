
import './hacktimer/HackTimer.min.js' //Worker timers for better precision, and it prevents window focus loss blocking setTimeout

import {Howl, Howler} from 'howler'; //standardized audio api

export type Timing = number|`${number}/${number}`; //millisecond intervals or signatures e.g. '4/4' '3/4' etc


export type BeatSettings = {
    interval: Timing; //timing interval in ms or generic signature string `${number}/${number}`
    tempo?: number; //tempo in bpm
    onBeat?: (sound: any, now: number, startTime: number, intervals: any) => void; //event callback fired at the interval based on time from song start
} & { //sub interval keys defined as numbers which are milliseconds from the start of the song
    [key:string]:{  //animation keys should be in a clock format e.g. 00:00:00.000 or the millisecond value
        interval: Timing; //timing interval in ms or generic signature string `${number}/${number}`
        tempo?: number; //tempo in bpm
        duration?: number; //duration ms
        onBeat: (sound: any, now: number, startTime: number, intervals: any) => void; //event callback fired at the interval based on time from song start

        //special subbeat settings
        repeatEvery?: number; //repeat this callback n milliseconds after start of this subinterval
        repeatUntil?: number; //stop subinterval after n milliseconds if repeatEvery is defined 
      }|any
};

export class AudioSync {

    sound:Howl;
    interval?:number; //setInterval result
    src:string[];
    settings:BeatSettings;
    subIntervals:{[key:string]:{intv:number, startTime:number, timeout:number}} = {};
    times:number[] = []; //time[0] = prev beat, time[1] = current beat
    onplay:()=>void;

    stopped = false;

    constructor(
        src?:string[],
        settings?:BeatSettings,
        playAll = false
    ) {
        if(src && settings) 
            this.init(src, settings, playAll);
    }

    init = (
        src:string[] = this.src, 
        settings:BeatSettings = this.settings,
        playAll = false
    ) => {

        // Convert interval string to milliseconds based on tempo, if applicable
        if(typeof settings.interval === 'string') {
            if(!settings.tempo) settings.tempo = 60;
            settings.interval = this.calcInterval(settings.interval, settings.tempo);
        } else if(!settings.interval) {
            settings.interval = 250; // Default interval if none is provided e.g. a quarter note at 60bpm
        }

        this.src = src;
        this.settings = settings;

        const sound = new Howl({
            src
        });

        this.sound = sound;

        const soundIds = new Array(src.length);

        let temp; let keys;

        let initKeys = () => {
            this.interval = undefined;

            temp = {...settings};
            delete temp.interval;
            delete temp.tempo;
            delete temp.onBeat;
            delete temp.delay;
    
                // Adjust subintervals based on their specified tempo and interval
            Object.keys(temp).forEach(key => {
                if(typeof temp[key].interval === 'string') {
                    temp[key].interval = this.calcInterval(temp[key].interval, temp[key].tempo || settings.tempo || 60);
                } else if(!temp[key].interval) {
                    temp[key].interval = settings.interval; // Default subinterval
                }
            });
    
            keys = Object.keys(temp).map((v,i) => {
                if(v.includes(':')) { //supports e.g. 00:00:00.0000 syntax
                    let split = v.split(':');
                    let ms = 0;

                    let multiplier = 1000;
                    split.reverse().forEach((value,j) => {
                        ms += parseFloat(value)*multiplier;
                        multiplier *= 60;
                    });
                    temp[ms] = temp[v]; //set the temp to this
                    delete temp[v];
                    return ms;
                }
                else return parseFloat(v)
            }).sort((a,b) => a - b); 
        }

        initKeys();

        //get ms timestamp offset keys for setting intervals mid-song at specific times
        //sorted from beg to end
        
        return new Promise((res) => {

            sound.on('load',()=>{

                this.onplay = async () => {

                    if(settings.delay) await new Promise ((r) => {
                        setTimeout(()=>{r(true)},settings.delay);
                    })
    
                    if(!this.interval) {
                        const soundStart = Date.now(); //sounds started, log the start time
    
                        const onbeat = ()=>{
                            let now = Date.now();
                            const elapsedTime = now - soundStart;
                            this.times[0] = this.times[1];
                            this.times[1] = now;
    
                            if(settings.onBeat && !this.stopped) {
                                settings.onBeat(sound, now, soundStart, settings);
                            }        
    
                            //keys.find
                            for(const key of keys) {  //FIX
                                if(
                                    !this.subIntervals[key] && 
                                    elapsedTime + (settings.interval as number) > key 
                                ) {
                                    //   setTimeout to setInterval for the onBeat for that beat subinterval
                                    this.subIntervals[key] = { 
                                        timeout: setTimeout(()=>{
                                            let subIntervalStart = Date.now();

                                            this.subIntervals[key].intv = setInterval(()=>{ 
                                                        const n = Date.now();
                                                        if(n > subIntervalStart+temp[key].duration) { 
                                                            clearInterval(this.subIntervals[key].intv); 
                                                            delete this.subIntervals[key]; 
                                                            keys.find((v,i) => {
                                                                if(`${v}` === `${key}`) {
                                                                    keys.splice(i,1);
                                                                    return true;
                                                                }
                                                            })
                                                            
                                                        }
                                                        else temp[key].onBeat(sound, n, soundStart, temp);     
                                                    }, 
                                                    temp[key].interval
                                            );
                                            this.subIntervals[key].startTime = subIntervalStart;

                                            const n = Date.now();
                                            temp[key].onBeat(sound, n, soundStart, temp);  
                                        }, 
                                        key - elapsedTime //the key should be the milliseconds from start
                                        ) //timeout so it starts at specified time
                                    } as any;

                                    if(
                                        key < (elapsedTime) + (temp[key].interval as number) &&
                                        !(temp[key + temp[key].repeatEvery]) && 
                                        temp[key].repeatEvery && 
                                        ( 
                                          !temp[key].repeatUntil 
                                            || 
                                          (elapsedTime + temp[key].duration) < temp[key].repeatUntil
                                        )
                                    ) {
                                        let newkey = key + temp[key].repeatEvery;
                                        keys.push(newkey);
                                        temp[newkey] = temp[key];
                                    }
                                }
                            }
                                
                            //when a sub-interval duration is up, cancel that interval
                            //  iterate over active subIntervals, check if subIntervals[key].startTime + duration is greater than Date.now() to cancel
                            
                        }

                        this.interval = setInterval(
                            onbeat, 
                            settings.interval as number
                        );

                        onbeat();
                    }
                }
    
                sound.on('play',this.onplay);

                if(playAll) {
                    src.forEach((v,i) => {
                        soundIds[i] = sound.play(); 
                        //multi sounds should be played sequentially afaik
                    });
                }

                res(true);
    
            });

            const onend = () => {
                clearInterval(this.interval);
                for(const k in this.subIntervals) {
                    clearInterval(this.subIntervals[k].intv);
                    delete this.subIntervals[k];
                }
                initKeys();
            }
    
            sound.on('stop', ()=>{
                console.log('stop');
                onend();
            });

            sound.on('end', ()=>{
                console.log('end');
                onend();
            });


            sound.load();
        })
        
    }

    play(onplay?:()=>void,id?:number) {
        if(onplay)
            this.sound.on('play',onplay, id);

        this.stopped = false;

        this.sound.play(id);
    }

    stop(onstop?:()=>void,id?:number) {
        if(onstop) 
            this.sound.on('stop',onstop,id);
        
        this.stopped = true;

        this.sound.stop(id);

        return true;
    }

    calcInterval = (
        signature:string, 
        tempo:number
    ) => {
        const split = signature.split('/');
        const beatsPerMeasure = parseFloat(split[0]); 
        const divisions = parseFloat(split[1]);
        const minutesPerBeat = 1 / tempo;
        const millisecondsPerBeat = minutesPerBeat * 60 * 1000;
        const standardDivision = 4; // Standard division for a quarter note
        return millisecondsPerBeat * (standardDivision / divisions) * beatsPerMeasure;
    }

}


