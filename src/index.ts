import { PuzzleGame } from "./game";

async function main() {
  const game = new PuzzleGame(
    new URL("../puzzles/uv.jpg", import.meta.url).toString(),
    12,
    12
  );
  await game.load();
  game.start();
}

main();
