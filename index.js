orientations = {
  right: 0,
  down: 1,
  left: 2,
  up: 3,
};

directions = {
  N: 0,
  R: 1,
  U: 2,
  L: 3,
};

function generate_color(params = {}) {
  color = {
    r: params.r !== undefined ? params.r : Math.floor(Math.random() * 256),
    g: params.g !== undefined ? params.g : Math.floor(Math.random() * 256),
    b: params.b !== undefined ? params.b : Math.floor(Math.random() * 256),
  };
  if (params.alpha === undefined || params.alpha || params.a !== undefined) {
    color.a =
      params.a !== undefined ? params.a : Math.floor(Math.random() * 256);
  }
  return color;
}

function generate_rule(params = {}) {
  return {
    direction:
      params.direction !== undefined
        ? params.direction
        : Object.keys(directions)[
            Math.floor(Math.random() * Object.keys(directions).length)
          ],
    color: generate_color(params.color !== undefined ? params.color : {}),
  };
}

function generate_ant(params = {}) {
  return {
    start_x: params.start_x !== undefined ? params.start_x : Math.random(),
    start_y: params.start_y !== undefined ? params.start_y : Math.random(),
    start_orientation:
      params.start_orientation !== undefined
        ? params.start_orientation
        : Object.keys(orientations)[
            Math.floor(Math.random() * Object.keys(orientations).length)
          ],
    rules: params.rules
      ? params.rules
          .split("")
          .map((rule) =>
            generate_rule({ direction: rule, color: { alpha: false } })
          )
      : Array(2 + Math.floor(Math.random() * 8))
          .fill()
          .map(() => generate_rule()),
  };
}

width = 0;
height = 0;

field = null;

canvas = document.getElementById("canvas");
ctx = null;
image_data = null;
data = null;

steps = 0;

window.onload = init;
window.onresize = (event) => {
  reset = true;
};
window.onhashchange = init;

reset = true;

function init(event) {
  reset = false;
  square_size = 1;
  width = Math.floor(window.innerWidth / square_size);
  height = Math.floor(window.innerHeight / square_size);
  canvas.width = width;
  canvas.height = height;

  hash = window.location.hash ? window.location.hash.substring(1) : null;

  config = {
    background: generate_color({ alpha: false }),
    ants: hash
      ? hash.split(",").map((ant, i) =>
          generate_ant({
            rules: ant,
            start_orientation: "left",
            start_x:
              i / hash.split(",").length + 1 / (2 * hash.split(",").length),
            start_y: 0.5,
          })
        )
      : Array(1 + Math.floor(Math.random() * 8))
          .fill()
          .map(() => generate_ant()),
  };

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

  ctx = canvas.getContext("2d", { alpha: false });
  image_data = ctx.getImageData(0, 0, width, height);
  data = image_data.data;
  for (cy = 0; cy < height; cy++) {
    for (cx = 0; cx < width; cx++) {
      index = 4 * (width * cy + cx);
      data[index + 0] = config.background.r;
      data[index + 1] = config.background.g;
      data[index + 2] = config.background.b;
      data[index + 3] = 255;
    }
  }
  ctx.putImageData(image_data, 0, 0);

  field = new Array(width * height).fill(0);

  steps = 256;

  window.requestAnimationFrame(update);
}

function update(timestamp) {
  for (step = 0; step < steps; step++) {
    ants.forEach((ant) => {
      state = field[width * ant.y + ant.x];
      rule = ant.rules[state % ant.rules.length];
      ant.orientation += rule.direction;
      ant.orientation %= Object.keys(orientations).length;
      state++;
      state %= ant.rules.length;
      field[width * ant.y + ant.x] = state;
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
      index = 4 * (width * ant.y + ant.x);
      blend_ratio = rule.color.a / 255;
      data[index + 0] =
        (1 - blend_ratio) * data[index + 0] + blend_ratio * rule.color.r;
      data[index + 1] =
        (1 - blend_ratio) * data[index + 1] + blend_ratio * rule.color.g;
      data[index + 2] =
        (1 - blend_ratio) * data[index + 2] + blend_ratio * rule.color.b;
    });
  }
  ctx.putImageData(image_data, 0, 0);
  if (reset) {
    init();
  } else {
    window.requestAnimationFrame(update);
  }
}
