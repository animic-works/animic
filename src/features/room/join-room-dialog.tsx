import { useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import type { FormEvent } from "react";

import { Button } from "../../components/button";
import { CodeInput } from "../../components/code";
import { Dialog, DialogClose } from "../../components/dialog";
import { useWipe } from "../../components/transition";
import { readRoomCodeInput } from "./room-code-input";
import { ROOM_CODE_CHARS } from "./room-state";

const ROOM_CODE_LENGTH = 8;

export type JoinRoomDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

// ルームコードを入力して、そのルームのURLへ移動するダイアログ。
export function JoinRoomDialog({ open, onOpenChange }: JoinRoomDialogProps) {
  const wipe = useWipe();
  const navigate = useNavigate();
  const [value, setValue] = useState("");
  const { code, complete } = readRoomCodeInput(value);

  // 閉じるときに入力を空へ戻し、次に開いたときは空から始める。
  function handleOpenChange(next: boolean) {
    if (!next) setValue("");
    onOpenChange(next);
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!complete) return;
    handleOpenChange(false);
    void wipe.wipeTo(() => navigate({ href: `/rooms/${code}` }));
  }

  return (
    <Dialog
      open={open}
      onOpenChange={handleOpenChange}
      density="compact"
      title="ルームに参加"
      description="英数字8文字のルームコードを入力してください"
      footer={
        <>
          <DialogClose>
            <Button variant="secondary" size="md">
              やめる
            </Button>
          </DialogClose>
          <Button type="submit" form="join-form" size="md" disabled={!complete}>
            参加する
          </Button>
        </>
      }
    >
      <form id="join-form" onSubmit={submit} noValidate>
        <CodeInput
          value={code}
          onValueChange={setValue}
          length={ROOM_CODE_LENGTH}
          characters={ROOM_CODE_CHARS}
          hint="英数字8文字（0・O・1・I・Lは使いません）"
          autoFocus
        />
      </form>
    </Dialog>
  );
}
