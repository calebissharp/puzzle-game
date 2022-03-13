import { useEffect, useState } from "react";
import { useGame } from "./useGame";

export default function usePerf(): [boolean, (isVisible: boolean) => void] {
  const { game } = useGame();
  const [showPerf, setShowPerf] = useState(game?.showPerf ?? false);

  useEffect(() => {
    if (game) {
      game.showPerf = showPerf;
    }
  }, [showPerf, game]);

  return [showPerf, setShowPerf];
}
