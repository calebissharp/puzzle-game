import * as Phaser from "phaser";

const PUZZLE_WIDTH = 16;
const PUZZLE_HEIGHT = 16;

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: window.innerWidth,
  height: window.innerHeight,
  scene: {
    preload: preload,
    create: create,
    update: update,
  },
};

const game = new Phaser.Game(config);

async function preload(this: Phaser.Scene) {
  const image = await new Promise<HTMLImageElement>((resolve) => {
    const image = document.createElement("img");

    image.addEventListener("load", () => {
      resolve(image);
    });

    image.src = new URL("../puzzles/store.jpg", import.meta.url).toString();
  });

  this.textures.addSpriteSheet("puzzle", image, {
    frameWidth: image.width / PUZZLE_WIDTH,
    frameHeight: image.height / PUZZLE_HEIGHT,
    endFrame: PUZZLE_WIDTH * PUZZLE_HEIGHT,
  });

  console.log("loaded");
}

function create(this: Phaser.Scene, data: object) {
  console.log("loaded2");
  // this.textures.create()
  // this.load.image(
  //   {
  //     key: 'puzzle',
  //     frameConfig: {
  //       frameWidth:
  //     }
  //   },
  //   new URL("../puzzles/uv.jpg", import.meta.url).toString()
  // );

  this.add.sprite(0, 0, "puzzle", 4);
}

function update(this: Phaser.Scene) {}
