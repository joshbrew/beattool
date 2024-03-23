# beattool
 Sync scripts to your phat beats in javascript with howlerjs and web worker timers.

# AudioSync Class Documentation

## Overview

`npm i beattool`

`import {AudioSync} from 'beattool'`

The `beattool` library is a tool for synchronizing audio playback with events on specific time intervals and signatures. Utilizing the Howler.js library for audio control and a web-worker hack for browser timers to keep events synced, this class enables the creation of dynamic audio experiences in web applications.

### Methods

#### BeatSettings
Defines the settings for beat synchronization, including intervals, tempo, and callbacks for beat events.

```typescript
type BeatSettings = {
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
```

#### constructor
```js

    import { AudioSync, BeatSettings } from "beattool";
    
    // Define your beat settings
    const beatSettings = {
        interval: '4/4', // Main time signature. Adjust this interval to match the beat of your sound
        tempo:144, //main sound tempo
        // onBeat: (sound, now, startTime) => { //main onBeat function etc.

        //     if(b) console.timeEnd('dum');
        //     console.time('dum'); b = true;
            
        //     if(now - startTime > 5500) 
        //         toggleBeatColor();
        // },
        100:{ //the key is the start of the subinterval from song start, e.g. 100ms after begin
            interval:'1/16', //1/16th notes
            tempo:144,
            onBeat:() => {
                console.timeEnd('da');
                console.time('da');
                toggleBeatColor();
            },
            duration:1200,    //duration of subinterval
            repeatEvery:1600, //time from the start of the previous subinterval not the end
            repeatUntil:3800 //dont play after this time (else repeatEvery continues till song ends)
        },
        '00:05.800':{ //start here
            interval: '1/4', // e.g quarter notes. Adjust this interval to match the beat of your sound
            //main interval and time signature adopted if not specified
            onBeat:(sound,now,startTime)=>{
                
                if(b) console.timeEnd('dum');
                console.time('dum'); b = true;

                toggleBeatColor()
            }
        }
    } as BeatSettings;

    const audioSync = new AudioSync(
        ['./entertainer.mp3'], // Replace with the path to your sound file
        beatSettings,
        true //autoplay
    );

```

#### init()
Initializes or re-initializes the audio synchronization settings.

```javascript
audioSync.init(src, settings, playAll);
```
Parameters are the same as the constructor.


#### play()
Begins audio playback, optionally at a specific sound ID.

```javascript
audioSync.play(onplay, id);
```

- onplay (optional): A callback function to be executed when playback starts.
- id (optional): The sound ID to play. If omitted, all sounds are played.


#### stop()
Stops audio playback, optionally for a specific sound ID.

```javascript
audioSync.stop(onstop, id);
```
- onstop (optional): A callback function to be executed when playback stops.
- id (optional): The sound ID to stop. If omitted, all sounds are stopped.

```typescript
type Timing = number|`${number}/${number}`; //millisecond intervals or signatures e.g. '4/4' '3/4' etc
```

The rest is just using howlerjs normally, so you can dig into that at will. The audioSync will follow the song start/stop/end events and re-arm itself for you.

## Example index.ts

```javascript

import { AudioSync, BeatSettings } from "beattool";

document.body.insertAdjacentHTML('beforeend', `
    Press F12 for timer results<br/>
    <canvas id="beat-visualization" width="200" height="200" style="border:1px solid #000; margin: 5px;"></canvas>
    <hr/>
    <button id="play-button">Play</button>
    <button id="stop-button">Stop</button>
`);

// Initialize the canvas and its drawing context
const canvas = document.getElementById('beat-visualization') as HTMLCanvasElement;
const ctx = canvas.getContext('2d') as CanvasRenderingContext2D;

// Function to toggle the color of the beat visualization
function toggleBeatColor() {
    // Check the current color and switch between red and green
    if(ctx.fillStyle === '#ff0000') {
        ctx.fillStyle = '#00ff00';
    } else if (ctx.fillStyle === '#00ff00') {
        ctx.fillStyle = '#0000ff';
    } else ctx.fillStyle = '#ff0000';

    ctx.fillRect(0, 0, canvas.width, canvas.height);
}

// Initialize the beat color to red
ctx.fillStyle = 'red';
ctx.fillRect(0, 0, canvas.width, canvas.height);

let b = false;

// Define your beat settings
const beatSettings = {
    interval: '4/4', // Main time signature. Adjust this interval to match the beat of your sound
    tempo:144, //main sound tempo
    // onBeat: (sound, now, startTime) => { //main onBeat function etc.

    //     if(b) console.timeEnd('dum');
    //     console.time('dum'); b = true;
        
    //     if(now - startTime > 5500) 
    //         toggleBeatColor();
    // },
    100:{ //the key is the start of the subinterval from song start, e.g. 100ms after begin or say 00:00.100 can be used
        interval:'1/16', //1/16th notes
        tempo:144,
        onBeat:() => {
            console.timeEnd('da');
            console.time('da');
            toggleBeatColor();
        },
        duration:1200,    //duration of subinterval
        repeatEvery:1600, //time from the start of the previous subinterval not the end
        repeatUntil:3800 //dont play after this time (else repeatEvery continues till song ends)
    },
    '00:05.800':{ //This could also be defined as 00:05.800 like a clock
        interval: '1/4', // e.g quarter notes. Adjust this interval to match the beat of your sound
        //main interval and time signature adopted if not specified
        onBeat:(sound,now,startTime)=>{
            
            if(b) console.timeEnd('dum');
            console.time('dum'); b = true;

            toggleBeatColor()
        }
    }
} as BeatSettings;

// Initialize your AudioSync with the sound file and beat settings
document.addEventListener('DOMContentLoaded', () => {
    const audioSync = new AudioSync(
        ['./entertainer.mp3'], // Replace with the path to your sound file
        beatSettings,
        true
    );

    // Optionally, provide additional logic for play and stop buttons
    (document.getElementById('play-button') as HTMLElement).addEventListener('click', () => {
        audioSync.play();
    });

    (document.getElementById('stop-button') as HTMLElement).addEventListener('click', () => {
        audioSync.stop();
    });
});


```


### (Dev) Dependencies

- [**Howler.js**](https://howlerjs.com/): A JavaScript library for audio playback. Ensure you include Howler.js in your project to use the `AudioSync` class.
- [**HackTimer.js**](https://github.com/turuslan/HackTimer): For improving timer precision and ensuring functionality when the browser tab is not in focus.


## Build and run sample

With `tinybuild` installed globally (`npm i -g tinybuild`): `npm start`

## Configuration

See [`./tinybuild.config.js`](./tinybuild.config.js) for settings. 

Add build:true for build-only, add serve:true for serve-only, or set bundle or server to false alternatively.
