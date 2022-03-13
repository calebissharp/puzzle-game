import { useEffect, useState } from "react";
import { useGame } from "./useGame";

export default function useJiggle(): [boolean, (jiggling: boolean) => void] {
  const { game } = useGame();
  const [jiggling, setJiggling] = useState(game?.jiggling ?? false);

  useEffect(() => {
    if (game) {
      game.jiggling = jiggling;
    }
  }, [jiggling, game]);

  return [jiggling, setJiggling];
}
