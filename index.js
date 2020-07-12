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

function generate_color() {
  const color = color_scheme[Math.floor(Math.random() * color_scheme.length)];
  color.a = Math.floor(Math.random() * 256);
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
    background: color_scheme[0],
    ants: [...Array(1 + Math.floor(Math.random() * 16))].map(() =>
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
const colors = [];
var color_scheme;

window.onload = init;
window.onresize = init;
window.onhashchange = init;

document.getElementById("add_ant").onclick = function () {
  config.ants.push({});
  init();
};

document.getElementById("background").onchange = config_change;

document.getElementById("randomize").onclick = function () {
  color_scheme = colors[Math.floor(Math.random() * colors.length)];
  config = generate_config();
  init();
};

document.getElementById("reset").onclick = init;

document.getElementById("scale").onchange = init;

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
      config = {
        background: { r: 255, g: 255, b: 255 },
        ants: [
          {
            start_x: 0.5,
            start_y: 0.5,
            start_orientation: "left",
            rules: [
              { direction: "R", color: { r: 0, g: 0, b: 0, a: 255 } },
              {
                direction: "L",
                color: { r: 255, g: 255, b: 255, a: 255 },
              },
            ],
          },
        ],
      };
    }
  }
  if (config.background === undefined) {
    config.background = { r: 255, g: 255, b: 255 };
  }
  if (config.ants === undefined) {
    config.ants = [];
  }
  config.ants.forEach((ant) => {
    if (ant.start_x === undefined) {
      ant.start_x = 0.5;
    }
    if (ant.start_y === undefined) {
      ant.start_y = 0.5;
    }
    if (ant.start_orientation === undefined) {
      ant.start_orientation = "left";
    }
    if (ant.rules === undefined) {
      ant.rules = [];
    }
    ant.rules.forEach((rule) => {
      if (rule.direction === undefined) {
        rule.direction = "R";
      }
      if (rule.color === undefined) {
        rule.color = { r: 0, g: 0, b: 0, a: 255 };
      }
    });
  });

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

  config.ants.forEach((ant, i) => {
    const ant_div = document.createElement("div");
    ant_div.id = `ant_${i}`;
    ant_div.className = "box";

    const ant_grid = document.createElement("div");
    ant_grid.className = "grid";

    const x_text = document.createElement("p");
    x_text.textContent = "X";
    ant_grid.appendChild(x_text);

    const x_input = document.createElement("input");
    x_input.className = "x";
    x_input.onchange = config_change;
    x_input.type = "number";
    x_input.min = 0;
    x_input.max = 1;
    x_input.step = 0.01;
    x_input.value = ant.start_x;
    ant_grid.appendChild(x_input);

    const y_text = document.createElement("p");
    y_text.textContent = "Y";
    ant_grid.appendChild(y_text);

    const y_input = document.createElement("input");
    y_input.onchange = config_change;
    y_input.className = "y";
    y_input.type = "number";
    y_input.min = 0;
    y_input.max = 1;
    y_input.step = 0.01;
    y_input.value = ant.start_y;
    ant_grid.appendChild(y_input);

    const orientation_text = document.createElement("p");
    orientation_text.textContent = "Orientation";
    ant_grid.appendChild(orientation_text);

    const orientation_select = document.createElement("select");
    orientation_select.onchange = config_change;
    orientation_select.className = "orientation";
    Object.keys(orientations).forEach((orientation) => {
      const orientation_option = document.createElement("option");
      orientation_option.textContent = orientation;
      orientation_select.appendChild(orientation_option);
    });
    orientation_select.value = ant.start_orientation;
    ant_grid.appendChild(orientation_select);

    ant_div.appendChild(ant_grid);

    const rules_div = document.createElement("div");
    rules_div.innerText = "Rules";

    const rules_container_div = document.createElement("div");
    rules_container_div.className = "rules";
    ant.rules.forEach((rule, j) => {
      const rule_box_div = document.createElement("div");
      rule_box_div.id = `rule_${j}`;
      rule_box_div.className = "box";

      const rule_grid_div = document.createElement("div");
      rule_grid_div.className = "grid";

      const direction_text = document.createElement("p");
      direction_text.textContent = "Direction";
      rule_grid_div.appendChild(direction_text);

      const direction_select = document.createElement("select");
      direction_select.className = "direction";
      direction_select.onchange = config_change;
      Object.keys(directions).forEach((direction) => {
        const direction_option = document.createElement("option");
        direction_option.textContent = direction;
        direction_select.appendChild(direction_option);
      });
      direction_select.value = rule.direction;
      rule_grid_div.appendChild(direction_select);

      const color_text = document.createElement("p");
      color_text.textContent = "Color";
      rule_grid_div.appendChild(color_text);

      const color_input = document.createElement("input");
      color_input.onchange = config_change;
      color_input.className = "color";
      color_input.type = "color";
      color_input.value = "#ff00ff";
      color_input.value = `#${rule.color.r
        .toString(16)
        .padStart(2, "0")}${rule.color.g
        .toString(16)
        .padStart(2, "0")}${rule.color.b.toString(16).padStart(2, "0")}`;
      rule_grid_div.appendChild(color_input);

      const alpha_text = document.createElement("p");
      alpha_text.textContent = "Alpha";
      rule_grid_div.appendChild(alpha_text);

      const alpha_input = document.createElement("input");
      alpha_input.onchange = config_change;
      alpha_input.className = "alpha";
      alpha_input.type = "number";
      alpha_input.min = 0;
      alpha_input.max = 255;
      alpha_input.step = 1;
      alpha_input.value = rule.color.a;
      rule_grid_div.appendChild(alpha_input);

      rule_box_div.appendChild(rule_grid_div);

      const remove_input = document.createElement("input");
      remove_input.onclick = function (event) {
        const ant_id = event.target.parentElement.parentElement.parentElement.parentElement.id.split(
          "_"
        )[1];
        const rule_id = event.target.parentElement.id.split("_")[1];
        config.ants[ant_id].rules.splice(rule_id, 1);
        init();
      };
      remove_input.type = "button";
      remove_input.value = "Remove rule";
      rule_box_div.appendChild(remove_input);

      rules_container_div.appendChild(rule_box_div);
    });
    rules_div.appendChild(rules_container_div);

    const add_rule_input = document.createElement("input");
    add_rule_input.onclick = function (event) {
      const ant_id = event.target.parentElement.parentElement.id.split("_")[1];
      config.ants[ant_id].rules.push({});
      init();
    };
    add_rule_input.type = "button";
    add_rule_input.value = "Add rule";
    rules_div.appendChild(add_rule_input);

    ant_div.appendChild(rules_div);

    const remove_input = document.createElement("input");
    remove_input.onclick = function (event) {
      const ant_id = event.target.parentElement.id.split("_")[1];
      config.ants.splice(ant_id, 1);
      init();
    };
    remove_input.type = "button";
    remove_input.value = "Remove ant";
    ant_div.appendChild(remove_input);

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

function config_change() {
  const background_hex = (config.background = document
    .getElementById("background")
    .value.substring(1));
  const r = parseInt(background_hex.substring(0, 2), 16);
  const g = parseInt(background_hex.substring(2, 4), 16);
  const b = parseInt(background_hex.substring(4, 6), 16);
  config.background = { r: r, g: g, b: b };

  config.ants = [...document.getElementById("ants").childNodes].map(
    (ant_div) => {
      return {
        start_x: ant_div.querySelector(".x").value,
        start_y: ant_div.querySelector(".y").value,
        start_orientation: ant_div.querySelector(".orientation").value,
        rules: [...ant_div.querySelector(".rules").childNodes].map(
          (rule_div) => {
            const color_hex = rule_div
              .querySelector(".color")
              .value.substring(1);
            const r = parseInt(color_hex.substring(0, 2), 16);
            const g = parseInt(color_hex.substring(2, 4), 16);
            const b = parseInt(color_hex.substring(4, 6), 16);
            const a = parseInt(rule_div.querySelector(".alpha").value);
            return {
              color: { r: r, g: g, b: b, a: a },
              direction: rule_div.querySelector(".direction").value,
            };
          }
        ),
      };
    }
  );

  init();
}

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
  if (ant.rules.length === 0) {
    return;
  }
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
