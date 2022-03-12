import { createSlice, PayloadAction } from "@reduxjs/toolkit";

type GameState = {
  showPerfStats?: boolean;
};

const initialState: GameState = {
  showPerfStats: false,
};

export const gameSlice = createSlice({
  name: "game",
  initialState,
  reducers: {
    setShowPerfStats(state, action: PayloadAction<boolean>) {
      state.showPerfStats = action.payload;
    },
  },
});

export const { setShowPerfStats } = gameSlice.actions;
