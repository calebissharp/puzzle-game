import { PuzzleGame } from "./game";
import "./index.scss";
import imageUrl from "../puzzles/uv.jpg";
// import { greet } from "../crate/Cargo.toml";

async function main() {
  // greet();

  const game = new PuzzleGame(
    imageUrl,
    // "https://upload.wikimedia.org/wikipedia/commons/6/68/Joe_Biden_presidential_portrait.jpg",
    // "https://media.discordapp.net/attachments/504136447088001044/890452777745125406/4d42ef344bd7c83708310000.png",
    // "https://pbs.twimg.com/profile_images/2836936806/912753e911ee1fa26d74d2843e046608.jpeg",
    // "https://images.unsplash.com/photo-1494059980473-813e73ee784b?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=2669&q=80",
    16,
    16
  );
  await game.load();
  game.start();
}

main();
