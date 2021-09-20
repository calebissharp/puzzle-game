import { PuzzleGame } from "./game";

async function main() {
  const game = new PuzzleGame(
    new URL("../puzzles/uv.jpg", import.meta.url).toString(),
    // "https://upload.wikimedia.org/wikipedia/commons/6/68/Joe_Biden_presidential_portrait.jpg",
    16,
    16
  );
  await game.load();
  game.start();
}

main();
