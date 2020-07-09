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

function generate_color(alpha = true) {
  color = {
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
    rules: Array(2 + Math.floor(Math.random() * 3))
      .fill()
      .map(() => generate_rule()),
  };
}

function generate_config() {
  return {
    background: generate_color(false),
    ants: Array(1 + Math.floor(Math.random() * 2))
      .fill()
      .map(() => generate_ant()),
  };
}

width = 0;
height = 0;

field = null;

textarea = document.getElementById("textarea");
canvas = document.getElementById("canvas");
ctx = null;
image_data = null;
data = null;

window.onload = init;
window.onresize = (event) => {
  reset = true;
};
window.onhashchange = init;

reset = true;

function init(event) {
  reset = false;
  scale = document.getElementById("scale").value;
  width = Math.floor(canvas.clientWidth / scale);
  height = Math.floor(canvas.clientHeight / scale);
  canvas.width = width;
  canvas.height = height;

  if (textarea.value) {
    config = JSON.parse(textarea.value);
  } else {
    config = generate_config();
  }
  textarea.innerHTML = JSON.stringify(config, null, 1);

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

  window.requestAnimationFrame(update);
}

function update(timestamp) {
  steps = document.getElementById("speed").value;
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
