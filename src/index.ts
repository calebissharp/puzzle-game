import { PuzzleGame } from "./game";

async function main() {
  const game = new PuzzleGame(
    // new URL("../puzzles/store.jpg", import.meta.url).toString(),
    "https://upload.wikimedia.org/wikipedia/commons/6/68/Joe_Biden_presidential_portrait.jpg",
    12,
    15
  );
  await game.load();
  game.start();
}

main();
