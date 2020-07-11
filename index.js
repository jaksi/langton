const orientations = {
  right: 0,
  down: 1,
  left: 2,
  up: 3,
};

const directions = {
  N: 0,
  R: 1,
  U: 2,
  L: 3,
};

function generate_color(alpha = true) {
  const color = {
    r: Math.floor(Math.random() * 256),
    g: Math.floor(Math.random() * 256),
    b: Math.floor(Math.random() * 256),
  };
  if (alpha) {
    color.a = Math.floor(Math.random() * 256);
  }
  return color;
}

function generate_rule() {
  return {
    direction: Object.keys(directions)[
      Math.floor(Math.random() * Object.keys(directions).length)
    ],
    color: generate_color(),
  };
}

function generate_ant() {
  return {
    start_x: Math.round(100 * Math.random()) / 100,
    start_y: Math.round(100 * Math.random()) / 100,
    start_orientation: Object.keys(orientations)[
      Math.floor(Math.random() * Object.keys(orientations).length)
    ],
    rules: [...Array(2 + Math.floor(Math.random() * 15))].map(() =>
      generate_rule()
    ),
  };
}

function generate_config() {
  return {
    background: generate_color(false),
    ants: [...Array(1 + Math.floor(Math.random() * 4))].map(() =>
      generate_ant()
    ),
  };
}

var field;
var canvas_context;
var image_data;
var data;
var request_id;
var config = null;
var running = false;
var previous_timestamp = 0;
var frames_count = 0;
var ants;
var width, height;

window.onload = init;
window.onresize = init;
window.onhashchange = init;

function reset() {
  running = false;

  if (request_id) {
    cancelAnimationFrame(request_id);
  }

  const canvas = document.getElementById("canvas");

  const scale = parseInt(document.getElementById("scale").value);

  width = Math.floor(canvas.clientWidth / scale);
  height = Math.floor(canvas.clientHeight / scale);

  canvas.width = width;
  canvas.height = height;

  canvas_context = canvas.getContext("2d", { alpha: false });
  image_data = canvas_context.getImageData(0, 0, width, height);
  data = image_data.data;
}

function load_config() {
  if (config === null) {
    const hash = window.location.hash
      ? window.location.hash.substring(1)
      : null;
    if (hash) {
      config = JSON.parse(atob(hash));
    } else {
      config = generate_config();
    }
  }
  if (config.background === undefined) {
    config.background = generate_color(false);
  }
  if (config.ants === undefined) {
    config.ants = [];
  }

  ants = config.ants.map(function (ant) {
    return {
      x: Math.round(ant.start_x * width),
      y: Math.round(ant.start_y * height),
      orientation: orientations[ant.start_orientation],
      rules: ant.rules.map(function (rule) {
        return {
          color: {
            r: rule.color.r,
            g: rule.color.g,
            b: rule.color.b,
            a: rule.color.a !== undefined ? rule.color.a : 255,
          },
          direction: directions[rule.direction],
        };
      }),
    };
  });

  field = new Array(width * height).fill(0);
}

function setup_ui() {
  document.getElementById("share").href = `#${btoa(JSON.stringify(config))}`;

  document.getElementById(
    "background"
  ).value = `#${config.background.r
    .toString(16)
    .padStart(2, "0")}${config.background.g
    .toString(16)
    .padStart(2, "0")}${config.background.b.toString(16).padStart(2, "0")}`;

  const ants_div = document.getElementById("ants");
  ants_div.innerHTML = "";

  config.ants.forEach((ant) => {
    const ant_div = document.createElement("div");
    ant_div.className = "ant";

    const x_text = document.createElement("p");
    x_text.textContent = "X: ";
    ant_div.appendChild(x_text);

    const x_input = document.createElement("input");
    x_input.type = "number";
    x_input.min = 0;
    x_input.max = 1;
    x_input.step = 0.01;
    x_input.value = ant.start_x;
    ant_div.appendChild(x_input);
    ant_div.appendChild(document.createElement("br"));

    const y_text = document.createElement("p");
    y_text.textContent = "Y: ";
    ant_div.appendChild(y_text);

    const y_input = document.createElement("input");
    y_input.type = "number";
    y_input.min = 0;
    y_input.max = 1;
    y_input.step = 0.01;
    y_input.value = ant.start_y;
    ant_div.appendChild(y_input);
    ants_div.appendChild(ant_div);
  });
}

function setup_canvas() {
  const data = image_data.data;
  for (var cy = 0; cy < height; cy++) {
    for (var cx = 0; cx < width; cx++) {
      const index = 4 * (width * cy + cx);
      data[index + 0] = config.background.r;
      data[index + 1] = config.background.g;
      data[index + 2] = config.background.b;
      data[index + 3] = 255;
    }
  }
  canvas_context.putImageData(image_data, 0, 0);
}

function start() {
  running = true;

  request_id = window.requestAnimationFrame(update);
}

function init() {
  reset();
  load_config();
  setup_ui();
  setup_canvas();
  start();
}

/*function config_change() {
  hex = config.background = document
    .getElementById("background")
    .value.substring(1);
  r = parseInt(hex.substring(0, 2), 16);
  g = parseInt(hex.substring(2, 4), 16);
  b = parseInt(hex.substring(4, 6), 16);
  config.background = { r: r, g: g, b: b };
  init();
}*/

function move_forward(ant) {
  switch (ant.orientation) {
    case orientations.right:
      ant.x++;
      if (ant.x >= width) {
        ant.x = 0;
      }
      break;
    case orientations.down:
      ant.y++;
      if (ant.y >= height) {
        ant.y = 0;
      }
      break;
    case orientations.left:
      ant.x--;
      if (ant.x < 0) {
        ant.x = width - 1;
      }
      break;
    case orientations.up:
      ant.y--;
      if (ant.y < 0) {
        ant.y = height - 1;
      }
      break;
  }
}

function update_ant(ant) {
  var state = field[width * ant.y + ant.x];

  const rule = ant.rules[state % ant.rules.length];

  ant.orientation += rule.direction;
  ant.orientation %= Object.keys(orientations).length;

  state++;
  state %= ant.rules.length;
  field[width * ant.y + ant.x] = state;

  move_forward(ant);

  const index = 4 * (width * ant.y + ant.x);
  const blend_ratio = rule.color.a / 255;
  data[index + 0] =
    (1 - blend_ratio) * data[index + 0] + blend_ratio * rule.color.r;
  data[index + 1] =
    (1 - blend_ratio) * data[index + 1] + blend_ratio * rule.color.g;
  data[index + 2] =
    (1 - blend_ratio) * data[index + 2] + blend_ratio * rule.color.b;
}

function update(timestamp) {
  if (timestamp - previous_timestamp > 1000) {
    const fps = Math.round(
      (1000 * frames_count) / (timestamp - previous_timestamp)
    );
    document.getElementById("fps").textContent = `${fps} FPS`;
    previous_timestamp = timestamp;
    frames_count = 0;
  }

  data = image_data.data;

  const steps = parseInt(document.getElementById("speed").value);
  for (var step = 0; step < steps; step++) {
    ants.forEach(update_ant);
  }

  canvas_context.putImageData(image_data, 0, 0);

  frames_count++;

  if (running) {
    request_id = window.requestAnimationFrame(update);
  }
}
