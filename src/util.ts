export function formatTime(milliseconds: number): string {
  const minutes = Math.floor(milliseconds / 1000 / 60);
  const seconds = ((milliseconds / 1000) % 60).toFixed(0);

  return `${minutes}:${seconds.padStart(2, "0")}`;
}
