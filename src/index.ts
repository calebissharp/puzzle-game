import { PuzzleGame } from "./game";
import "./index.scss";
import imageUrl from "../puzzles/uv.jpg";
// import { greet } from "../crate/Cargo.toml";

async function main() {
  // greet();

  const game = new PuzzleGame(
    // imageUrl,
    "https://upload.wikimedia.org/wikipedia/commons/6/68/Joe_Biden_presidential_portrait.jpg",
    // "https://pbs.twimg.com/profile_images/2836936806/912753e911ee1fa26d74d2843e046608.jpeg",
    20,
    21
  );
  await game.load();
  game.start();
}

main();
