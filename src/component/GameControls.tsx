import React, { useState } from "react";
import { Button, styled } from "@nextui-org/react";
import { Gear } from "phosphor-react";
import OptionsMenu from "./OptionsMenu";
import Timer from "./Timer";

export default function GameControls() {
  const [optionsOpen, setOptionsOpen] = useState(false);

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
