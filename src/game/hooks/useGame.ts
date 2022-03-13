import { useContext } from "react";

import { GameContext } from "../GameProvider";

export function useGame() {
  const value = useContext(GameContext);

  if (!value) {
    throw new Error("useGame must be wrapped in a GameProvider");
  }

  return value;
}
