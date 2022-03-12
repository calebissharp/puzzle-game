import React, { useEffect, useState } from "react";
import { styled } from "@nextui-org/react";
import { formatTime } from "../util";

export default function GameControls() {
  const [timeElapsed, setTimeElapsed] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeElapsed((t) => t + 1000);
    }, 1000);

    return () => {
      clearInterval(interval);
    };
  }, []);

  return (
    <Timer>
      <TimerText aria-label="time elapsed">{formatTime(timeElapsed)}</TimerText>
    </Timer>
  );
}

const Timer = styled("div", {
  position: "absolute",
  top: 0,
  width: "100%",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  pointerEvents: "none",
});

const TimerText = styled("div", {
  backgroundColor: "#4d4b4b",
  color: "#ebebeb",
  padding: "$4",
  opacity: 0.5,
  paddingLeft: "$13",
  paddingRight: "$13",
  borderBottomLeftRadius: "$base",
  borderBottomRightRadius: "$base",
  borderStyle: "solid",
  borderWidth: 4,
  borderTopWidth: 0,
  borderColor: "#363636",
  fontSize: 20,
  transition: "all 150ms ease",
  pointerEvents: "all",
  "&:hover": {
    opacity: 1,
    paddingTop: "$5",
    boxShadow: "$sm",
  },
});
