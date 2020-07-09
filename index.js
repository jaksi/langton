orientations = {
  right: 0,
  down: 1,
  left: 2,
  up: 3,
  length: 4,
};

directions = {
  forward: 0,
  right: 1,
  reverse: 2,
  left: 3,
  length: 4,
};

function generate_color() {
  return {
    r: Math.floor(Math.random() * 256),
    g: Math.floor(Math.random() * 256),
    b: Math.floor(Math.random() * 256),
    a: Math.floor(Math.random() * 256),
  };
}

function generate_rule() {
  return {
    direction: Math.floor(Math.random() * directions.length),
    color: generate_color(),
  };
}

function generate_ant() {
  return {
    start_x: Math.random(),
    start_y: Math.random(),
    orientation: Math.floor(Math.random() * orientations.length),
    rules: Array(2 + Math.floor(Math.random() * 8))
      .fill()
      .map(() => generate_rule()),
  };
}

background = generate_color();

ants = Array(1 + Math.floor(Math.random() * 8))
  .fill()
  .map(() => generate_ant());

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

reset = true;

function init(event) {
  reset = false;
  square_size = 1;
  width = Math.floor(window.innerWidth / square_size);
  height = Math.floor(window.innerHeight / square_size);
  canvas.width = width;
  canvas.height = height;

  ctx = canvas.getContext("2d", { alpha: false });
  image_data = ctx.getImageData(0, 0, width, height);
  data = image_data.data;
  for (cy = 0; cy < height; cy++) {
    for (cx = 0; cx < width; cx++) {
      index = 4 * (width * cy + cx);
      data[index + 0] = background.r;
      data[index + 1] = background.g;
      data[index + 2] = background.b;
      data[index + 3] = 255;
    }
  }
  ctx.putImageData(image_data, 0, 0);

  ants.forEach((ant) => {
    ant.x = Math.round(ant.start_x * width);
    ant.y = Math.round(ant.start_y * height);
  });

  field = new Array(width * height).fill(0);

  steps = 50000;

  window.requestAnimationFrame(update);
}

function update(timestamp) {
  for (step = 0; step < steps; step++) {
    ants.forEach((ant) => {
      state = field[width * ant.y + ant.x];
      rule = ant.rules[state % ant.rules.length];
      ant.orientation += rule.direction;
      ant.orientation %= orientations.length;
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
