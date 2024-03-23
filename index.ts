import { AudioSync, BeatSettings } from "./AudioSync";

document.body.insertAdjacentHTML('afterbegin', `
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
    100:{ //the key is the start of the subinterval from song start, e.g. 100ms after begin
        interval:'0.25/4',
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

// Initialize your AudioSync with the sound file and beat settings
document.addEventListener('DOMContentLoaded', () => {
    const audioSync = new AudioSync(
        ['./entertainer.mp3'], // Replace with the path to your sound file
        beatSettings,
        false
    );

    // Optionally, provide additional logic for play and stop buttons
    (document.getElementById('play-button') as HTMLElement).addEventListener('click', () => {
        audioSync.play();
    });

    (document.getElementById('stop-button') as HTMLElement).addEventListener('click', () => {
        audioSync.stop();
    });
});


