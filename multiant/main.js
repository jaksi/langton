var lastFPSUpdate;
var frames;

var background;

var ctx;
var width, height;
var imageData;
var pixelData;

var state;
var orientations;
var ants;

function init() {
    background = { r: 0x00, g: 0x00, b: 0x00 }

    var canvas = document.getElementById('canvas');
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = width;
    canvas.height = height;
    console.log(width, height);
    ctx = canvas.getContext('2d');
    imageData = ctx.getImageData(0, 0, width, height);
    pixelData = imageData.data;
    for (let index = 0; index < width * height * 4; index += 4) {
        pixelData[index + 0] = background.r;
        pixelData[index + 1] = background.g;
        pixelData[index + 2] = background.b;
        pixelData[index + 3] = 255;
    }

    state = new Array(width);
    for (let x = 0; x < width; x++) {
        column = new Array(height);
        for (let y = 0; y < height; y++) {
            column[y] = 0;
        }
        state[x] = column;
    }

    orientations = [
        { x: 1, y: 0 },
        { x: 0, y: 1 },
        { x: -1, y: 0 },
        { x: 0, y: -1 },
    ];

    ants = [
        {
            x: Math.floor(width / 4), y: Math.floor(height / 4),
            orientation: 0,
            rules: 'RLRL',
            color: { r: 0xFF, g: 0x00, b: 0x00 },
        },
        {
            x: Math.floor(3 * width / 4), y: Math.floor(height / 4),
            orientation: 1,
            rules: 'RLLR',
            color: { r: 0x00, g: 0xFF, b: 0x00 },
        },
        {
            x: Math.floor(width / 4), y: Math.floor(3 * height / 4),
            orientation: 2,
            rules: 'RRLR',
            color: { r: 0x00, g: 0x00, b: 0xFF },
        },
        {
            x: Math.floor(3 * width / 4), y: Math.floor(3 * height / 4),
            orientation: 3,
            rules: 'RRLL',
            color: { r: 0xFF, g: 0xFF, b: 0x00 },
        },
    ];

    lastFPSUpdate = new Date();
    frames = 0;

    window.requestAnimationFrame(draw);
}

function draw() {
    for (let index = 0; index < 256; index++) {
        update();
    }

    ctx.putImageData(imageData, 0, 0);

    now = new Date();
    if (now - lastFPSUpdate > 1000) {
        console.log(1000 * frames / (now - lastFPSUpdate), "FPS");
        lastFPSUpdate = now;
        frames = 0;
    }
    frames++;

    window.requestAnimationFrame(draw);
}

function update() {
    ants.forEach(ant => {
        let currentState = state[ant.x][ant.y];
        let rule = ant.rules[currentState];
        //console.log("At", ant.x, ant.y, ", which is", currentState, ", facing", ant.orientation);

        switch (rule) {
            case 'R':
                ant.orientation += 1;
                break;

            case 'U':
                ant.orientation += 2;
                break;

            case 'L':
                ant.orientation += 3;
                break;

            default:
                break;
        }
        ant.orientation %= orientations.length;
        //console.log("Turn", rule, ", to", ant.orientation);

        let nextState = (currentState + 1) % ant.rules.length;
        //console.log("Set", ant.x, ant.y, "to", nextState);
        state[ant.x][ant.y] = nextState;

        gradientRatio = nextState / (ant.rules.length - 1);
        currentR = pixelData[(ant.y * width + ant.x) * 4 + 0];
        currentG = pixelData[(ant.y * width + ant.x) * 4 + 1];
        currentB = pixelData[(ant.y * width + ant.x) * 4 + 2];
        pixelData[(ant.y * width + ant.x) * 4 + 0] = 0.99 * currentR + 0.01 * gradient(255, ant.color.r, gradientRatio);
        pixelData[(ant.y * width + ant.x) * 4 + 1] = 0.99 * currentG + 0.01 * gradient(255, ant.color.g, gradientRatio);
        pixelData[(ant.y * width + ant.x) * 4 + 2] = 0.99 * currentB + 0.01 * gradient(255, ant.color.b, gradientRatio);

        let orientation = orientations[ant.orientation];
        ant.x = (ant.x + orientation.x) % width;
        if (ant.x < 0) ant.x += width;
        ant.y = (ant.y + orientation.y) % height;
        if (ant.y < 0) ant.y += height;
        //console.log("Move to", ant.x, ant.y)
    });
}

function gradient(a, b, ratio) {
    return a + (b - a) * ratio;
}

init();