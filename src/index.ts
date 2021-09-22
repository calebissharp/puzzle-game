import { PuzzleGame } from "./game";
import "./index.scss";
import imageUrl from "../puzzles/store.jpg";
// import { greet } from "../crate/Cargo.toml";

async function main() {
  // greet();

  const game = new PuzzleGame(
    imageUrl,
    // "https://upload.wikimedia.org/wikipedia/commons/6/68/Joe_Biden_presidential_portrait.jpg",
    32,
    20
  );
  await game.load();
  game.start();
}

main();
