import { PuzzleGame } from "./game";

async function main() {
  const game = new PuzzleGame(
    new URL("../puzzles/store.jpg", import.meta.url).toString(),
    16,
    12
  );
  await game.load();
  game.start();
}

main();
