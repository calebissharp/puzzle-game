import { configureStore } from "@reduxjs/toolkit";
import { gameSlice } from "./game/slice";

export const store = configureStore({
  reducer: {
    [gameSlice.name]: gameSlice.reducer,
  },
});

export type AppState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
