import type { AvatarProps } from "@animic/react/avatar";
export const accountColors = [
  { color: "#ff2d87", palette: "pink" },
  { color: "#00b4fc", palette: "cyan" },
  { color: "#fddb13", palette: "yellow" },
  { color: "#16b37e", palette: "green" },
  { color: "#7c5cff", palette: "violet" },
  { color: "#ff7a45", palette: "orange" },
  { color: "#0b1b2b", palette: "ink" },
] as const;
export function accountPalette(color?: string): AvatarProps["palette"] {
  return accountColors.find((item) => item.color === color?.toLowerCase())?.palette ?? "pink";
}
