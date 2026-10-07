import { ROOM_CODE_CHARS } from "./room-state";

/**
 * 入力されたルームコードを大文字にし、英数字以外を除いて8文字までにする。
 * ルームコードに使わない文字があれば、最初の1文字を`invalid`で返す。
 */
export function readRoomCodeInput(value: string) {
  const code = value
    .toUpperCase()
    .replace(/[^0-9A-Z]/g, "")
    .slice(0, 8);
  const invalid = code.split("").find((char) => !ROOM_CODE_CHARS.includes(char)) ?? null;
  return { code, invalid, complete: code.length === 8 && invalid === null };
}
