import {
  ComponentPropsWithRef,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import { PuzzleGame } from "../game/game";

type UsePuzzleParams = {
  onChangeGameState?: () => void;
  onLoadProgress?: (step: number, stepsRemaining: number, dt: number) => void;
  onLoadImage?: (image: HTMLImageElement) => void;
  imageUrl: string;
  piecesX: number;
  piecesY: number;
};

export default function usePuzzle({
  onLoadProgress,
  onLoadImage,
  onChangeGameState,
  imageUrl,
  piecesX,
  piecesY,
}: UsePuzzleParams) {
  const puzzleGame = useRef<PuzzleGame | null>(null);
  const initializing = useRef<boolean>(false);
  const [isInitialized, setIsInitialized] = useState(false);

  async function initialize() {
    if (isInitialized) {
      console.error("Puzzle has already been initialized");
    } else if (!puzzleGame.current) {
      console.error(
        "Game cannot be initialized because it hasn't been instantiated yet"
      );
    } else if (initializing.current) {
      console.error("Puzzle is already being initialized");
    } else {
      initializing.current = true;
      await puzzleGame.current.load();
      setIsInitialized(true);
      initializing.current = false;
    }
  }

  function start() {
    if (!puzzleGame.current) {
      console.error("Cannot start game before it's been initialized");
    } else {
      puzzleGame.current.start();
    }
  }

  const loadProgressHandler = useCallback(
    (n: number, total: number, dt: number) => {
      typeof onLoadProgress === "function" && onLoadProgress(n, total, dt);
    },
    [onLoadProgress]
  );

  const loadImageHandler = useCallback(
    (image: HTMLImageElement) => {
      typeof onLoadImage === "function" && onLoadImage(image);
    },
    [onLoadImage]
  );

  useEffect(() => {
    if (puzzleGame.current) {
      puzzleGame.current.addListener("loadProgress", loadProgressHandler);
      puzzleGame.current.addListener("loadImage", loadImageHandler);

      return () => {
        puzzleGame.current?.removeListener("loadProgress", loadProgressHandler);
        puzzleGame.current?.removeListener("loadImage", loadImageHandler);
      };
    }
  }, [loadProgressHandler, loadImageHandler]);

  const canvasProps: ComponentPropsWithRef<"canvas"> = {
    ref: (canvas) => {
      if (canvas && !isInitialized && !initializing.current) {
        puzzleGame.current = new PuzzleGame(imageUrl, piecesX, piecesY, canvas);

        initialize().then(start);
      }
    },
  };

  return { canvasProps, isInitialized };
}
