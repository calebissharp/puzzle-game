import React, { useState } from "react";
import { Button } from "@nextui-org/react";
import { Gear } from "phosphor-react";
import OptionsMenu from "./OptionsMenu";
import Timer from "./Timer";
import { useGame } from "../game/hooks/useGame";

export default function GameControls() {
  const { progress } = useGame();

  const [optionsOpen, setOptionsOpen] = useState(false);

  const isLoaded = progress === 1;

  if (!isLoaded) return null;

  return (
    <>
      <Timer />

      <Button
        auto
        icon={<Gear />}
        onClick={() => setOptionsOpen(true)}
        css={{
          position: "absolute",
          top: 0,
          right: 0,
          borderTopRightRadius: 0,
          borderTopLeftRadius: 0,
          borderBottomRightRadius: 0,
          backgroundColor: "$gray700",
        }}
      />

      <OptionsMenu
        visible={optionsOpen}
        onClose={() => setOptionsOpen(false)}
      />
    </>
  );
}
