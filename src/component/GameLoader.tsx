import React from "react";
import { Progress } from "@nextui-org/react";

import styles from "../../styles/Home.module.scss";
import { formatTime } from "../util";
import { useGame } from "../game/hooks/useGame";

export default function GameLoader() {
  const { progress, imageDimensions, eta } = useGame();

  if (progress < 1)
    return (
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
    );

  return null;
}
