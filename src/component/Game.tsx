import { useMemo, useState, useRef } from "react";
import { Progress } from "@nextui-org/react";
import { throttle } from "lodash";

import usePuzzle from "../hook/usePuzzle";
import styles from "../../styles/Home.module.scss";
import { formatTime } from "../util";

type GameProps = {
  image: HTMLImageElement;
  piecesX: number;
  piecesY: number;
  genNormals?: boolean;
};

const Game = ({ image, piecesX, piecesY, genNormals }: GameProps) => {
  const [progress, setProgress] = useState(0);
  const [imageDimensions, setImageDimensions] = useState<[number, number]>();
  const [eta, setEta] = useState<number>();
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

  const { canvasProps } = usePuzzle({
    onLoadProgress,
    imageUrl: image.src,
    piecesX,
    piecesY,
    genNormals,
    onLoadImage: (image) => {
      setImageDimensions([image.width, image.height]);
    },
  });

  return (
    <div className={styles.gameContainer}>
      {progress < 1 && (
        <div className={styles.loader}>
          <span>Generating pieces... </span>
          {imageDimensions && (
            <span>
              Image size: ({`${imageDimensions[0]}x${imageDimensions[1]}`})
            </span>
          )}
          {eta && <span>ETA {formatTime(eta)}</span>}
          <span style={{ width: 400 }}>
            <Progress color="primary" value={progress} min={0} max={1} />
          </span>
        </div>
      )}
      <canvas {...canvasProps} className={styles.game} />
    </div>
  );
};

export default Game;
