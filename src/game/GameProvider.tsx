import { throttle } from "lodash";
import React, {
  ComponentPropsWithRef,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { PuzzleGame } from "./game";

type GameContextValue = {
  game: PuzzleGame | null;
  eta: number | null;
  imageDimensions: [number, number] | null;
  progress: number;
};

export const GameContext = React.createContext<GameContextValue | null>(null);

type GameProviderProps = {
  children: (canvasProps: ComponentPropsWithRef<"canvas">) => React.ReactNode;
  piecesX: number;
  piecesY: number;
  imageUrl: string;
  genNormals: boolean;
};

export function GameProvider({
  children,
  imageUrl,
  piecesX,
  piecesY,
  genNormals,
}: GameProviderProps) {
  const puzzleGame = useRef<PuzzleGame | null>(null);
  const initializing = useRef<boolean>(false);
  const [isInitialized, setIsInitialized] = useState(false);

  function start() {
    if (!puzzleGame.current) {
      console.error("Cannot start game before it's been initialized");
    } else {
      puzzleGame.current.start();
    }
  }

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
      await puzzleGame.current.load({ genNormals });
      setIsInitialized(true);
      initializing.current = false;
    }
  }

  const [progress, setProgress] = useState(0);
  const [imageDimensions, setImageDimensions] = useState<
    [number, number] | null
  >(null);
  const [eta, setEta] = useState<number | null>(null);
  const startTime = useRef<number>();

  const onLoadProgress = useMemo(
    () =>
      throttle((n: number, total: number) => {
        if (!startTime.current) {
          startTime.current = performance.now();
        }

        if (n === 0) return;

        const elapsedTime = performance.now() - startTime.current;
        const estimatedRemaining = (elapsedTime / n) * (total - n);
        setEta(estimatedRemaining);

        setProgress(n / total);
      }, 100),
    []
  );

  const onLoadImage = useCallback((image: HTMLImageElement) => {
    setImageDimensions([image.width, image.height]);
  }, []);

  useEffect(() => {
    if (puzzleGame.current) {
      puzzleGame.current.addListener("loadProgress", onLoadProgress);
      puzzleGame.current.addListener("loadImage", onLoadImage);

      return () => {
        puzzleGame.current?.removeListener("loadProgress", onLoadProgress);
        puzzleGame.current?.removeListener("loadImage", onLoadImage);
      };
    }
  }, [onLoadProgress, onLoadImage]);

  const canvasProps: ComponentPropsWithRef<"canvas"> = {
    ref: (canvas) => {
      if (canvas && !isInitialized && !initializing.current) {
        puzzleGame.current = new PuzzleGame({
          imageUrl,
          puzzleWidth: piecesX,
          puzzleHeight: piecesY,
          canvas,
        });

        initialize().then(start);
      }
    },
  };

  return (
    <GameContext.Provider
      value={{ game: puzzleGame.current, eta, imageDimensions, progress }}
    >
      {children(canvasProps)}
    </GameContext.Provider>
  );
}
