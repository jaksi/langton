function HSVtoRGB(h, s, v) {
    var r, g, b, i, f, p, q, t;
    if (arguments.length === 1) {
        s = h.s, v = h.v, h = h.h;
    }
    i = Math.floor(h * 6);
    f = h * 6 - i;
    p = v * (1 - s);
    q = v * (1 - f * s);
    t = v * (1 - (1 - f) * s);
    switch (i % 6) {
        case 0: r = v, g = t, b = p; break;
        case 1: r = q, g = v, b = p; break;
        case 2: r = p, g = v, b = t; break;
        case 3: r = p, g = q, b = v; break;
        case 4: r = t, g = p, b = v; break;
        case 5: r = v, g = p, b = q; break;
    }
    return {
        r: Math.round(r * 255),
        g: Math.round(g * 255),
        b: Math.round(b * 255)
    };
}

var canvas = document.getElementById('canvas');
var ctx = canvas.getContext('2d');
var imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
var data = imageData.data;

rules = [
    { color: [255, 255, 255], dir: 1 },
    { color: [0, 0, 0], dir: -1 },
]

x = canvas.width / 2;
y = canvas.width / 2;
dir = 0;

oldInterval = 0;

function init() {
    x = canvas.width / 2;
    y = canvas.width / 2;
    dir = 0;

    rules = [];
    n_rules = document.getElementById('rules').value.length;
    for (let index = 0; index < n_rules; index++) {
        const rule = document.getElementById('rules').value[index];
        switch (rule) {
            case "F":
                rd = 0;
                break;
            case "R":
                rd = 1;
                break;
            case "B":
                rd = 2;
                break;
            case "L":
                rd = 3;
                break;
        }
        if (index == 0) {
            rc = [255, 255, 255];
        }
        else if (index == n_rules - 1) {
            rc = [0, 0, 0];
        }
        else {
            ratio = (index - 1) / (n_rules - 2);
            rgb = HSVtoRGB(ratio, 1, 0.875);
            rc = [rgb.r, rgb.g, rgb.b];
        }
        newrule = {
            color: rc,
            dir: rd,
        }
        rules.push(newrule);
    }

    for (let index = 0; index < canvas.width * canvas.height * 4; index += 4) {
        color = rules[0].color;
        data[index + 0] = color[0];
        data[index + 1] = color[1];
        data[index + 2] = color[2];
        data[index + 3] = 255;
    }

    if (oldInterval != 0)
        clearInterval(oldInterval)
    oldInterval = setInterval(update, Math.floor(60 / 1000.0));
}

function draw() {
    ctx.putImageData(imageData, 0, 0);
}

function tick() {
    index = (y * canvas.width + x) * 4;

    r = data[index + 0];
    g = data[index + 1];
    b = data[index + 2];

    for (let rindex = 0; rindex < rules.length; rindex++) {
        const rule = rules[rindex];
        rr = rule.color[0];
        rg = rule.color[1];
        rb = rule.color[2];
        if (r === rr && g === rg && b === rb) {
            dir += rule.dir;
            ni = (rindex + 1) % rules.length;
            nr = rules[ni];
            data[index + 0] = nr.color[0];
            data[index + 1] = nr.color[1];
            data[index + 2] = nr.color[2];
            break;
        }
    }

    dir %= 4;
    if (dir < 0) dir += 4;

    switch (dir) {
        case 0:
            y--;
            break;

        case 1:
            x++;
            break;

        case 2:
            y++;
            break;

        case 3:
            x--;
            break;
    }

    x %= canvas.width;
    if (x < 0) x += canvas.width;
    y %= canvas.height;
    if (y < 0) y += canvas.height;
}

function update() {
    speed = document.getElementById('speed').value;
    for (let index = 0; index < speed; index++) {
        tick();
    }
    draw();
}